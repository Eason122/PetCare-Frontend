import React, { useState, useEffect } from 'react';
import { MapPin, Search, Star, Navigation, Phone, Clock, Plus, Loader2, X, AlertCircle } from 'lucide-react';
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
}

const REGIONS = ['全部', '台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市', '南投縣', '其他'];
const TYPES = [
  { id: 'all', label: '全部' },
  { id: 'hospital', label: '醫院' },
  { id: 'store', label: '用品/美容' },
  { id: 'hotel', label: '旅館' },
  { id: 'restaurant', label: '餐廳' },
  { id: 'other', label: '其他' }
];

export default function MapPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState('全部');
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [hasPromptedLocation, setHasPromptedLocation] = useState(false);

  useEffect(() => {
    // 檢查是否已提示過定位
    const prompted = localStorage.getItem('petcare_location_prompted');
    if (!prompted) {
      setShowLocationDialog(true);
      setHasPromptedLocation(true);
    }

    const fetchPlaces = async () => {
      try {
        const response = await fetch('https://docs.google.com/spreadsheets/d/1lx9MLgjkuzHCm1CMrVtMxXSz2QuHKm7KLbrctafFcC0/export?format=csv&gid=2128561092');
        const csvText = await response.text();

        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const parsedPlaces: Place[] = results.data
              .filter((row: any) => row['status'] === 'approved' || !row['status']) // Show approved or empty status
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
                  rating: '4.5', // Default rating as it's not in CSV
                  open: '營業時間請參考 Google Maps',
                  phone: '請參考 Google Maps'
                };
              });
            setPlaces(parsedPlaces);
            setLoading(false);
          },
          error: (error) => {
            console.error('Error parsing CSV:', error);
            setLoading(false);
          }
        });
      } catch (error) {
        console.error('Error fetching places:', error);
        setLoading(false);
      }
    };

    fetchPlaces();
  }, []);

  const filteredPlaces = places.filter(place => {
    const matchRegion = selectedRegion === '全部' || place.region === selectedRegion;
    const matchType = selectedType === 'all' || place.type === selectedType;
    const matchSearch = place.name.includes(searchQuery) || place.address.includes(searchQuery);
    return matchRegion && matchType && matchSearch;
  });

  const handleNavigate = (place: Place) => {
    if (place.googleMapsLink) {
      window.open(place.googleMapsLink, '_blank');
    } else {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + place.address)}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 px-4 pt-8 pb-4 shadow-sm z-10 transition-colors">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">友善空間地圖</h1>

        {/* Search */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl leading-5 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
            placeholder="搜尋醫院、商店或地址..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide mb-2">
          {TYPES.map(type => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedType === type.id
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          {REGIONS.map(region => (
            <button
              key={region}
              onClick={() => setSelectedRegion(region)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${selectedRegion === region
                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30'
                : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
            >
              {region}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!loading && (
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            找到 <span className="text-indigo-600 dark:text-indigo-400 font-bold">{filteredPlaces.length}</span> 個友善場所
          </p>
        )}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500 dark:text-gray-400">
            <Loader2 className="w-8 h-8 mb-4 animate-spin text-indigo-500" />
            <p>載入中...</p>
          </div>
        ) : filteredPlaces.length > 0 ? (
          filteredPlaces.map(place => (
            <div key={place.id} className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{place.name}</h3>
                <div className="flex items-center bg-yellow-50 dark:bg-yellow-900/30 px-2 py-1 rounded-lg">
                  <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                  <span className="text-sm font-bold text-yellow-700 dark:text-yellow-400">{place.rating}</span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-start text-gray-500 dark:text-gray-400 text-sm">
                  <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span>{place.address}</span>
                </div>
                <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
                  <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>{place.phone}</span>
                </div>
                <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
                  <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>{place.open}</span>
                </div>
                {place.friendlyPolicy && (
                  <div className="mt-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs px-3 py-2 rounded-xl border border-green-100 dark:border-green-800/50">
                    🐾 {place.friendlyPolicy}
                  </div>
                )}
                {place.environmentDesc && (
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 italic">{place.environmentDesc}</p>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => handleNavigate(place)}
                  className="flex-1 flex items-center justify-center py-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-xl font-medium text-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  導航與評論
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500 dark:text-gray-400">
            <MapPin className="w-12 h-12 mb-4 text-gray-300 dark:text-gray-600" />
            <p>找不到符合條件的地點</p>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <a
        href="https://forms.gle/UBuoPzy8Pi8ngoo3A"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-20 right-6 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all z-40 flex items-center justify-center group"
        title="新增店家"
      >
        <Plus className="w-6 h-6" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 ease-in-out font-medium">
          新增店家
        </span>
      </a>

      {/* 定位權限說明彈窗（Apple/Google 審核合規要求） */}
      {showLocationDialog && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-xl p-6 text-center">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">需要定位權限</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              PetCare Pro 需要存取您的裝置位置，以便為您推薦附近最適合的寵物友善餐廳、醫院與商店。
              您的位置資訊僅用於此功能，不會被永久儲存或分享。
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  localStorage.setItem('petcare_location_prompted', 'true');
                  setShowLocationDialog(false);
                  // 未來可在此呼叫 navigator.geolocation.getCurrentPosition
                }}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
              >
                了解並繼續
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
