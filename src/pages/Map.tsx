import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Search, Star, Navigation, Phone, Clock, Plus, Loader2, X, ChevronUp, ChevronDown, LocateFixed } from 'lucide-react';
import Papa from 'papaparse';

interface Place {
  id: string;
  name: string;
  type: string;
  region: string;
  address: string;
  phone?: string;
  open?: string;
  rating?: string;
  googleMapsLink?: string;
  friendlyPolicy?: string;
  environmentDesc?: string;
  lat?: number;
  lng?: number;
}

const REGIONS = ['全部', '台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市', '南投縣', '其他'];
const TYPES = [
  { id: 'all', label: '全部', icon: '📍' },
  { id: 'hospital', label: '醫院', icon: '🏥' },
  { id: 'store', label: '用品/美容', icon: '🛒' },
  { id: 'hotel', label: '旅館', icon: '🏨' },
  { id: 'restaurant', label: '餐廳', icon: '🍽️' },
  { id: 'other', label: '其他', icon: '📌' }
];

/**
 * 根據地區名稱回傳大致中心座標
 * NOTE: 用於在使用者選擇地區時平移地圖
 */
const REGION_CENTERS: Record<string, { lat: number; lng: number }> = {
  '台北市': { lat: 25.033, lng: 121.5654 },
  '新北市': { lat: 25.012, lng: 121.465 },
  '桃園市': { lat: 24.9936, lng: 121.301 },
  '台中市': { lat: 24.1477, lng: 120.6736 },
  '台南市': { lat: 22.9998, lng: 120.2269 },
  '高雄市': { lat: 22.6273, lng: 120.3014 },
  '南投縣': { lat: 23.9609, lng: 120.9718 },
};

/** 台灣中心預設座標 */
const DEFAULT_CENTER = { lat: 23.5, lng: 121.0 };
const DEFAULT_ZOOM = 7;
const LOCATED_ZOOM = 14;

export default function MapPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('全部');
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isListExpanded, setIsListExpanded] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const userMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  /**
   * 動態載入 Google Maps API script
   */
  useEffect(() => {
    if (window.google?.maps) return;

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) return;

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker&v=weekly`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  /**
   * 初始化 Google Map 並取得使用者位置
   */
  useEffect(() => {
    const initMap = () => {
      if (!mapRef.current || !window.google?.maps) return;

      const map = new google.maps.Map(mapRef.current, {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        mapId: 'petcare-friendly-map',
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      googleMapRef.current = map;
      infoWindowRef.current = new google.maps.InfoWindow();

      // 取得使用者位置
      requestUserLocation();
    };

    // 等待 Google Maps API 載入完成
    if (window.google?.maps) {
      initMap();
    } else {
      const checkInterval = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(checkInterval);
          initMap();
        }
      }, 200);

      // 10 秒超時
      setTimeout(() => clearInterval(checkInterval), 10000);

      return () => clearInterval(checkInterval);
    }
  }, []);

  /**
   * 請求使用者定位權限並定位地圖
   */
  const requestUserLocation = useCallback(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(loc);

        if (googleMapRef.current) {
          googleMapRef.current.panTo(loc);
          googleMapRef.current.setZoom(LOCATED_ZOOM);

          // 使用者位置藍點標記
          if (userMarkerRef.current) {
            userMarkerRef.current.map = null;
          }

          const userDot = document.createElement('div');
          userDot.innerHTML = `
            <div style="width:18px;height:18px;background:#4285F4;border:3px solid white;border-radius:50%;box-shadow:0 0 8px rgba(66,133,244,0.5);"></div>
          `;

          userMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
            map: googleMapRef.current,
            position: loc,
            content: userDot,
            title: '您的位置',
          });
        }
      },
      () => {
        // NOTE: 定位失敗時靜默處理，保持台灣全景
        console.warn('Geolocation denied or unavailable');
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  /**
   * 撈取場所資料（僅在使用者選擇篩選條件後觸發）
   */
  const fetchPlaces = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        'https://docs.google.com/spreadsheets/d/1lx9MLgjkuzHCm1CMrVtMxXSz2QuHKm7KLbrctafFcC0/export?format=csv&gid=2128561092'
      );
      const csvText = await response.text();

      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsedPlaces: Place[] = results.data
            .filter((row: any) => row['status'] === 'approved' || !row['status'])
            .map((row: any, index: number) => {
              let type = 'other';
              const category = row['場所類別'] || '';
              if (category.includes('醫療') || category.includes('醫院')) type = 'hospital';
              else if (category.includes('用品') || category.includes('美容')) type = 'store';
              else if (category.includes('旅館') || category.includes('住宿')) type = 'hotel';
              else if (category.includes('餐廳') || category.includes('餐飲')) type = 'restaurant';

              return {
                id: `place-${index}`,
                name: row['場所名稱'] || '未知名稱',
                type,
                region: row['所在縣市'] || '其他',
                address: row['完整地址'] || '',
                googleMapsLink: row['Google Maps 連結'] || '',
                friendlyPolicy: row['友善政策'] || '',
                environmentDesc: row['環境描述'] || '',
                lat: parseFloat(row['緯度']) || undefined,
                lng: parseFloat(row['經度']) || undefined,
                rating: '4.5',
                open: '營業時間請參考 Google Maps',
                phone: '請參考 Google Maps',
              };
            });
          setPlaces(parsedPlaces);
          setHasFetched(true);
          setLoading(false);
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          setLoading(false);
        },
      });
    } catch (error) {
      console.error('Error fetching places:', error);
      setLoading(false);
    }
  }, []);

  /**
   * 當使用者選擇了非「全部」的篩選條件時，觸發資料撈取
   */
  const handleFilterChange = useCallback(
    (newType: string, newRegion: string) => {
      const shouldFetch = newType !== 'all' || newRegion !== '全部';

      if (shouldFetch && !hasFetched) {
        fetchPlaces();
      }

      // 若選擇了地區，平移地圖到該地區中心
      if (newRegion !== '全部' && REGION_CENTERS[newRegion] && googleMapRef.current) {
        googleMapRef.current.panTo(REGION_CENTERS[newRegion]);
        googleMapRef.current.setZoom(12);
      }
    },
    [hasFetched, fetchPlaces]
  );

  const handleTypeChange = (typeId: string) => {
    setSelectedType(typeId);
    handleFilterChange(typeId, selectedRegion);
  };

  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
    handleFilterChange(selectedType, region);
  };

  const filteredPlaces = places.filter((place) => {
    const matchRegion = selectedRegion === '全部' || place.region === selectedRegion;
    const matchType = selectedType === 'all' || place.type === selectedType;
    const matchSearch = place.name.includes(searchQuery) || place.address.includes(searchQuery);
    return matchRegion && matchType && matchSearch;
  });

  /**
   * 根據場所類型回傳對應標記顏色
   */
  const getMarkerColor = (type: string): string => {
    switch (type) {
      case 'hospital': return '#EF4444';
      case 'store': return '#F59E0B';
      case 'hotel': return '#8B5CF6';
      case 'restaurant': return '#10B981';
      default: return '#6366F1';
    }
  };

  const getMarkerEmoji = (type: string): string => {
    switch (type) {
      case 'hospital': return '🏥';
      case 'store': return '🛒';
      case 'hotel': return '🏨';
      case 'restaurant': return '🍽️';
      default: return '📍';
    }
  };

  /**
   * 更新地圖上的標記
   */
  useEffect(() => {
    if (!googleMapRef.current || !window.google?.maps) return;

    // 清除舊標記
    markersRef.current.forEach((m) => (m.map = null));
    markersRef.current = [];

    filteredPlaces.forEach((place) => {
      // NOTE: 若場所缺少座標，嘗試使用地區中心作為近似位置
      const position = place.lat && place.lng
        ? { lat: place.lat, lng: place.lng }
        : REGION_CENTERS[place.region]
          ? { lat: REGION_CENTERS[place.region].lat + (Math.random() - 0.5) * 0.02, lng: REGION_CENTERS[place.region].lng + (Math.random() - 0.5) * 0.02 }
          : null;

      if (!position) return;

      const markerEl = document.createElement('div');
      markerEl.innerHTML = `
        <div style="
          background: ${getMarkerColor(place.type)};
          color: white;
          padding: 4px 8px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          cursor: pointer;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 4px;
          border: 2px solid white;
        ">
          ${getMarkerEmoji(place.type)}
          <span style="max-width:100px;overflow:hidden;text-overflow:ellipsis;">${place.name}</span>
        </div>
      `;

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: googleMapRef.current!,
        position,
        content: markerEl,
        title: place.name,
      });

      marker.addListener('click', () => {
        setSelectedPlaceId(place.id);
        setIsListExpanded(true);

        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(`
            <div style="padding:8px;max-width:200px;">
              <h3 style="margin:0 0 4px;font-size:14px;font-weight:700;">${place.name}</h3>
              <p style="margin:0;font-size:12px;color:#666;">${place.address}</p>
              ${place.friendlyPolicy ? `<p style="margin:4px 0 0;font-size:11px;color:#16a34a;">🐾 ${place.friendlyPolicy}</p>` : ''}
            </div>
          `);
          infoWindowRef.current.open(googleMapRef.current!, marker);
        }
      });

      markersRef.current.push(marker);
    });
  }, [filteredPlaces]);

  const handleNavigate = (place: Place) => {
    if (place.googleMapsLink) {
      window.open(place.googleMapsLink, '_blank');
    } else {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + place.address)}`;
      window.open(url, '_blank');
    }
  };

  /**
   * 點擊清單項目時平移地圖到對應位置
   */
  const handlePlaceClick = (place: Place) => {
    setSelectedPlaceId(place.id);

    const position = place.lat && place.lng
      ? { lat: place.lat, lng: place.lng }
      : REGION_CENTERS[place.region] || null;

    if (position && googleMapRef.current) {
      googleMapRef.current.panTo(position);
      googleMapRef.current.setZoom(16);
    }
  };

  /** 是否已選擇篩選條件（非全部） */
  const hasActiveFilter = selectedType !== 'all' || selectedRegion !== '全部';

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 transition-colors relative">
      {/* Header + Filters */}
      <div className="bg-white dark:bg-gray-800 px-4 pt-8 pb-3 shadow-sm z-20 transition-colors">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">友善空間地圖</h1>

        {/* Search */}
        <div className="relative mb-3">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-2xl leading-5 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
            placeholder="搜尋醫院、商店或地址..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Type Filters */}
        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide mb-1">
          {TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => handleTypeChange(type.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${selectedType === type.id
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
            >
              <span>{type.icon}</span>
              {type.label}
            </button>
          ))}
        </div>

        {/* Region Filters */}
        <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-hide">
          {REGIONS.map((region) => (
            <button
              key={region}
              onClick={() => handleRegionChange(region)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${selectedRegion === region
                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30'
                : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
            >
              {region}
            </button>
          ))}
        </div>
      </div>

      {/* Google Map Area */}
      <div className="flex-1 relative min-h-0">
        <div ref={mapRef} className="w-full h-full" />

        {/* 無 API Key 時的提示 */}
        {!window.google?.maps && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
            <div className="text-center p-6">
              <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400 font-medium">Google Maps 載入中...</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                請確認已設定 VITE_GOOGLE_MAPS_API_KEY
              </p>
            </div>
          </div>
        )}

        {/* 未選擇篩選條件的提示覆蓋層 */}
        {!hasActiveFilter && !hasFetched && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] z-10">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mx-4 text-center max-w-xs">
              <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <Search className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                選擇場所類型
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                請先選擇上方的場所類型（醫院、餐廳等）或地區，即可查看友善場所
              </p>
            </div>
          </div>
        )}

        {/* 重新定位按鈕 */}
        <button
          onClick={requestUserLocation}
          className="absolute top-3 right-3 bg-white dark:bg-gray-800 p-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all z-10 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
          title="重新定位"
        >
          <LocateFixed className="w-5 h-5" />
        </button>

        {/* Loading 指示器 */}
        {loading && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-lg z-10 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">載入場所中...</span>
          </div>
        )}
      </div>

      {/* Collapsible Place List */}
      {hasFetched && (
        <div
          className={`bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 transition-all duration-300 z-20 ${isListExpanded ? 'max-h-[50%]' : 'max-h-16'
            }`}
        >
          {/* Toggle Header */}
          <button
            onClick={() => setIsListExpanded(!isListExpanded)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm"
          >
            <span className="text-gray-600 dark:text-gray-400 font-medium">
              找到{' '}
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                {filteredPlaces.length}
              </span>{' '}
              個友善場所
            </span>
            {isListExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {/* Place List */}
          {isListExpanded && (
            <div className="overflow-y-auto px-4 pb-4 space-y-3" style={{ maxHeight: 'calc(50vh - 48px)' }}>
              {filteredPlaces.length > 0 ? (
                filteredPlaces.map((place) => (
                  <div
                    key={place.id}
                    onClick={() => handlePlaceClick(place)}
                    className={`rounded-2xl p-4 shadow-sm border transition-all cursor-pointer ${selectedPlaceId === place.id
                      ? 'border-indigo-400 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md'
                      }`}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1">
                        <span>{getMarkerEmoji(place.type)}</span>
                        {place.name}
                      </h3>
                      <div className="flex items-center bg-yellow-50 dark:bg-yellow-900/30 px-1.5 py-0.5 rounded-lg">
                        <Star className="w-3 h-3 text-yellow-400 fill-current mr-0.5" />
                        <span className="text-xs font-bold text-yellow-700 dark:text-yellow-400">
                          {place.rating}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 mb-3">
                      <div className="flex items-start text-gray-500 dark:text-gray-400 text-xs">
                        <MapPin className="w-3 h-3 mr-1.5 mt-0.5 flex-shrink-0" />
                        <span>{place.address}</span>
                      </div>
                      {place.friendlyPolicy && (
                        <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs px-2 py-1 rounded-lg border border-green-100 dark:border-green-800/50">
                          🐾 {place.friendlyPolicy}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNavigate(place);
                      }}
                      className="w-full flex items-center justify-center py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-xl font-medium text-xs hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                    >
                      <Navigation className="w-3 h-3 mr-1.5" />
                      導航與評論
                    </button>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
                  <MapPin className="w-10 h-10 mb-3 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm">找不到符合條件的地點</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* NOTE: FAB 按鈕位置改為相對於清單上方，避免被廣告+導覽列遮蔽 */}
      <a
        href="https://forms.gle/UBuoPzy8Pi8ngoo3A"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute right-4 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all z-30 flex items-center justify-center group"
        style={{ bottom: hasFetched && isListExpanded ? 'calc(50% + 16px)' : '80px' }}
        title="新增店家"
      >
        <Plus className="w-5 h-5" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 ease-in-out font-medium text-sm">
          新增店家
        </span>
      </a>
    </div>
  );
}
