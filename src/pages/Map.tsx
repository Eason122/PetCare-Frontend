import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MapPin, Search, Star, Navigation, Phone, Clock, Plus, Loader2, X, ChevronUp, ChevronDown, LocateFixed, RotateCcw } from 'lucide-react';
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

/**
 * 計算兩點間距離（公里）
 * NOTE: 使用 Haversine 公式計算球面距離
 */
function getDistanceKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Bottom Sheet 三段式高度（vh） */
const SHEET_COLLAPSED = 8;    // 摆疊：只露拖曳把手與計數標題
const SHEET_HALF = 35;        // 半展開：佔螢幕 35%
const SHEET_FULL = 55;        // 全展開：佔螢幕 55%

export default function MapPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('全部');
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  // Bottom Sheet 狀態
  const [sheetHeight, setSheetHeight] = useState(SHEET_COLLAPSED);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);
  const isDragging = useRef(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const userMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  /** 是否有任何篩選條件啟用 */
  const hasActiveFilter = selectedType !== 'all' || selectedRegion !== '全部' || searchQuery.trim() !== '';

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
   * 頁面載入即自動撈取場所資料
   * NOTE: 移除舊版「需先選篩選才載入」的限制，改善首次進入體驗
   */
  useEffect(() => {
    const fetchPlaces = async () => {
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
    };

    fetchPlaces();
  }, []);

  const handleTypeChange = (typeId: string) => {
    setSelectedType(typeId);
  };

  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
    // 若選擇了地區，平移地圖到該地區中心
    if (region !== '全部' && REGION_CENTERS[region] && googleMapRef.current) {
      googleMapRef.current.panTo(REGION_CENTERS[region]);
      googleMapRef.current.setZoom(12);
    }
  };

  /** 重置所有篩選條件 */
  const resetFilters = () => {
    setSelectedType('all');
    setSelectedRegion('全部');
    setSearchQuery('');
  };

  const filteredPlaces = useMemo(() => {
    return places.filter((place) => {
      const matchRegion = selectedRegion === '全部' || place.region === selectedRegion;
      const matchType = selectedType === 'all' || place.type === selectedType;
      const q = searchQuery.trim();
      const matchSearch = !q || place.name.includes(q) || place.address.includes(q);
      return matchRegion && matchType && matchSearch;
    });
  }, [places, selectedRegion, selectedType, searchQuery]);

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
   * 計算場所與使用者之間的距離文字
   */
  const getDistanceText = useCallback((place: Place): string | null => {
    if (!userLocation || !place.lat || !place.lng) return null;
    const km = getDistanceKm(userLocation.lat, userLocation.lng, place.lat, place.lng);
    if (km < 1) return `${Math.round(km * 1000)}m`;
    return `${km.toFixed(1)}km`;
  }, [userLocation]);

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
        setSheetHeight(SHEET_HALF);

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

  // --- Bottom Sheet 拖曳邏輯 ---
  const handleDragStart = useCallback((clientY: number) => {
    isDragging.current = true;
    dragStartY.current = clientY;
    dragStartHeight.current = sheetHeight;
    document.body.style.userSelect = 'none';
  }, [sheetHeight]);

  const handleDragMove = useCallback((clientY: number) => {
    if (!isDragging.current) return;
    const delta = dragStartY.current - clientY;
    const viewportH = window.innerHeight;
    const deltaPercent = (delta / viewportH) * 100;
    const newHeight = Math.min(SHEET_FULL, Math.max(8, dragStartHeight.current + deltaPercent));
    setSheetHeight(newHeight);
  }, []);

  const handleDragEnd = useCallback(() => {
    isDragging.current = false;
    document.body.style.userSelect = '';
    // 吸附到最近的段位
    setSheetHeight(prev => {
      if (prev < 18) return SHEET_COLLAPSED;
      if (prev < 45) return SHEET_HALF;
      return SHEET_FULL;
    });
  }, []);

  // Touch handlers
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientY);
  }, [handleDragStart]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientY);
  }, [handleDragMove]);

  const onTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Mouse handlers（桌面開發用）
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleDragMove(e.clientY);
    const onMouseUp = () => handleDragEnd();

    if (isDragging.current) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [handleDragMove, handleDragEnd]);

  /** 自動滾動到選中的場所卡片 */
  useEffect(() => {
    if (selectedPlaceId && sheetHeight > SHEET_COLLAPSED) {
      const el = document.getElementById(`place-card-${selectedPlaceId}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedPlaceId, sheetHeight]);

  const isSheetExpanded = sheetHeight > SHEET_COLLAPSED;

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 transition-colors relative">
      {/* Header + Filters */}
      <div className="bg-white dark:bg-gray-800 px-4 pt-8 pb-3 shadow-sm z-20 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">友善空間地圖</h1>
          {hasActiveFilter && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              重置篩選
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-10 py-2.5 border border-gray-200 dark:border-gray-700 rounded-2xl leading-5 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
            placeholder="搜尋醫院、商店或地址..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          )}
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

      {/* Bottom Sheet — 觸控友善的可拖曳面板 */}
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-20 transition-[height] duration-200 ease-out flex flex-col"
        style={{
          height: `${sheetHeight}vh`,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          transitionProperty: isDragging.current ? 'none' : 'height',
        }}
      >
        {/* 拖曳把手 */}
        <div
          className="flex-shrink-0 cursor-grab active:cursor-grabbing touch-none"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={(e) => handleDragStart(e.clientY)}
        >
          <div className="flex justify-center pt-2.5 pb-1">
            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
          </div>

          {/* 標題列 */}
          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              找到{' '}
              <span className="text-indigo-600 dark:text-indigo-400 font-bold text-base">
                {filteredPlaces.length}
              </span>{' '}
              個友善場所
            </span>
            <button
              onClick={() => setSheetHeight(isSheetExpanded ? SHEET_COLLAPSED : SHEET_HALF)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              {isSheetExpanded ? (
                <ChevronDown className="w-5 h-5" />
              ) : (
                <ChevronUp className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* 場所清單 */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3 min-h-0">
          {filteredPlaces.length > 0 ? (
            filteredPlaces.map((place) => {
              const distance = getDistanceText(place);
              return (
                <div
                  key={place.id}
                  id={`place-card-${place.id}`}
                  onClick={() => handlePlaceClick(place)}
                  className={`rounded-2xl p-4 shadow-sm border transition-all cursor-pointer ${selectedPlaceId === place.id
                    ? 'border-indigo-400 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-md'
                    : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md'
                    }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1 flex-1 min-w-0">
                      <span className="flex-shrink-0">{getMarkerEmoji(place.type)}</span>
                      <span className="truncate">{place.name}</span>
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      {distance && (
                        <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-lg">
                          {distance}
                        </span>
                      )}
                      <div className="flex items-center bg-yellow-50 dark:bg-yellow-900/30 px-1.5 py-0.5 rounded-lg">
                        <Star className="w-3 h-3 text-yellow-400 fill-current mr-0.5" />
                        <span className="text-xs font-bold text-yellow-700 dark:text-yellow-400">
                          {place.rating}
                        </span>
                      </div>
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
                    className="w-full flex items-center justify-center py-2.5 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl font-medium text-xs hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors shadow-sm"
                  >
                    <Navigation className="w-3.5 h-3.5 mr-1.5" />
                    前往 Google Maps 導航
                  </button>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
              <MapPin className="w-10 h-10 mb-3 text-gray-300 dark:text-gray-600" />
              <p className="text-sm">找不到符合條件的地點</p>
              {hasActiveFilter && (
                <button
                  onClick={resetFilters}
                  className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                >
                  清除所有篩選條件
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* NOTE: FAB 按鈕位置根據 Sheet 高度動態調整 */}
      <a
        href="https://forms.gle/UBuoPzy8Pi8ngoo3A"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute right-4 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all z-30 flex items-center justify-center group"
        style={{ bottom: `calc(${sheetHeight}vh + 12px)` }}
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
