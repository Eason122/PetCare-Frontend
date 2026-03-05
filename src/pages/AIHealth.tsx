import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Camera, Upload, AlertCircle, CheckCircle2, Loader2, History, Crown, Info, ShieldAlert, Video, Image, Flashlight, FlashlightOff, X } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { compressImage } from '../utils/image-utils';
import { useCamera } from '../hooks/use-camera';

/** 上傳媒體的類型 */
type MediaType = 'image' | 'video';

export default function AIHealth() {
  const { user, selectedPetId, pets, addAIAnalysis, getRemainingAILimit, aiHistory, token } = useAppContext();
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>('image');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { isTorchSupported, isTorchOn, toggleTorch, cleanup: cleanupTorch } = useCamera();

  const remainingLimit = getRemainingAILimit();
  const selectedPet = pets.find(p => p.id === selectedPetId);

  // 元件卸載時釋放 Torch 資源
  useEffect(() => {
    return () => cleanupTorch();
  }, [cleanupTorch]);

  /**
   * 處理媒體檔案上傳（圖片或影片）
   * NOTE: 圖片會自動壓縮至 800px / 70% 品質，降低 Token 消耗
   */
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setShowSourcePicker(false);

    // 判斷檔案類型
    const isVideo = file.type.startsWith('video/');
    setMediaType(isVideo ? 'video' : 'image');

    if (isVideo) {
      // 影片：直接產生預覽 URL
      const url = URL.createObjectURL(file);
      setMediaPreview(url);
      setResult(null);
    } else {
      // 圖片：壓縮後轉 Base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const compressed = await compressImage(reader.result as string, 800, 0.7);
          setMediaPreview(compressed);
          setResult(null);
        } catch {
          setMediaPreview(reader.result as string);
          setResult(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * 從相機拍照（帶 capture 屬性）
   */
  const handleCameraCapture = () => {
    setShowSourcePicker(false);
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  /**
   * 從相簿/檔案選擇
   */
  const handleGalleryPick = () => {
    setShowSourcePicker(false);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  /**
   * AI 分析（透過後端代理呼叫 Gemini，API Key 不外洩）
   */
  const analyzeImage = async () => {
    if (!mediaPreview || !selectedPetId || remainingLimit <= 0) return;

    setIsAnalyzing(true);
    try {
      // NOTE: 若為影片，取第一幀截圖作為分析素材
      let imageData = mediaPreview;
      if (mediaType === 'video') {
        imageData = await captureVideoFrame(mediaPreview);
      }

      const res = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          petId: selectedPetId,
          image: imageData,
        }),
      });

      if (res.status === 429) {
        setResult('今日 AI 分析次數已用盡。升級 VIP 可獲得更多次數！');
        return;
      }

      if (!res.ok) {
        throw new Error('分析失敗');
      }

      const data = await res.json();
      setResult(data.result);

      // NOTE: 後端已儲存紀錄，前端重新拉取歷史即可
      addAIAnalysis({
        petId: selectedPetId,
        imageUrl: mediaType === 'image' ? mediaPreview : imageData,
        result: data.result,
      });
    } catch (error) {
      console.error('AI Analysis error:', error);
      setResult('分析過程中發生錯誤，請確認您的網路連線或稍後再試。');
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * 從影片 URL 截取第一幀為 Base64 圖片
   * NOTE: 使用 Canvas API 擷取影片畫面
   */
  const captureVideoFrame = (videoUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.src = videoUrl;
      video.muted = true;

      video.addEventListener('loadeddata', () => {
        video.currentTime = 0.5;
      });

      video.addEventListener('seeked', () => {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(video.videoWidth, 800);
        canvas.height = Math.round(canvas.width * video.videoHeight / video.videoWidth);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        URL.revokeObjectURL(videoUrl);
        resolve(dataUrl);
      });

      video.addEventListener('error', () => reject(new Error('影片載入失敗')));
      video.load();
    });
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 px-4 pt-8 pb-4 shadow-sm z-10 transition-colors">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI 健康分析</h1>
          <div className="flex items-center gap-2">
            {/* 閃光燈按鈕 — 僅在支援的裝置上顯示 */}
            {isTorchSupported && (
              <button
                onClick={toggleTorch}
                className={`p-2 rounded-full transition-colors ${isTorchOn
                    ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                title={isTorchOn ? '關閉閃光燈' : '開啟閃光燈'}
              >
                {isTorchOn ? <Flashlight className="w-5 h-5" /> : <FlashlightOff className="w-5 h-5" />}
              </button>
            )}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-full text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
            >
              <History className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* AI 免責聲明（常駐顯示，Apple/Google 審核要求） */}
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 flex items-start border border-amber-200 dark:border-amber-800/50 mb-4">
          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            <strong>AI 分析結果僅供日常參考，無法取代專業獸醫師的實際診斷。</strong>若寵物有明顯不適，請立即就醫。
          </p>
        </div>

        {/* Limit Info */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-4 flex items-center justify-between border border-indigo-100 dark:border-indigo-800/50 transition-colors">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center">
              今日剩餘分析次數
              {user?.isVip && <Crown className="w-4 h-4 ml-2 text-yellow-500" />}
            </p>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
              {remainingLimit} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">/ {user?.isVip ? 10 : 3} 次</span>
            </p>
          </div>
          {!user?.isVip && (
            <button
              onClick={() => navigate('/payment')}
              className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-sm font-bold rounded-xl shadow-sm hover:shadow-md transition-all"
            >
              升級 VIP
            </button>
          )}
        </div>
      </div>

      {/* Hidden native file inputs */}
      {/* 相簿選擇：接受圖片和影片 */}
      <input
        type="file"
        accept="image/*,video/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleMediaUpload}
      />
      {/* 相機拍照：使用 capture 呼叫原生相機 */}
      <input
        type="file"
        accept="image/*,video/*"
        capture="environment"
        className="hidden"
        ref={cameraInputRef}
        onChange={handleMediaUpload}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {showHistory ? (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">歷史分析紀錄</h2>
            {aiHistory.length > 0 ? (
              aiHistory.map(history => (
                <div key={history.id} className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full">
                      {pets.find(p => p.id === history.petId)?.name || '未知寵物'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {format(new Date(history.date), 'yyyy/MM/dd HH:mm')}
                    </span>
                  </div>
                  {history.imageUrl && (
                    <img src={history.imageUrl} alt="Analysis" className="w-full h-40 object-cover rounded-2xl mb-3" />
                  )}
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap line-clamp-3">{history.result}</p>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-10">
                <History className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <p>尚無分析紀錄</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {!selectedPetId ? (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-2xl p-4 flex items-start transition-colors">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-800 dark:text-yellow-400">請先在首頁或個人檔案新增並選擇一隻寵物，才能進行健康分析。</p>
              </div>
            ) : (
              <>
                {/* Upload / Preview Area */}
                {mediaPreview ? (
                  <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                    <div className="relative">
                      {mediaType === 'video' ? (
                        <video
                          src={mediaPreview}
                          controls
                          className="w-full h-64 object-cover rounded-2xl bg-black"
                          playsInline
                        />
                      ) : (
                        <img src={mediaPreview} alt="Preview" className="w-full h-64 object-cover rounded-2xl shadow-sm" />
                      )}
                      {/* 清除 / 更換按鈕 */}
                      <button
                        onClick={() => { setMediaPreview(null); setResult(null); }}
                        className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white p-1.5 rounded-full hover:bg-black/70 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => setShowSourcePicker(true)}
                      className="w-full mt-3 py-2 text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors"
                    >
                      更換{mediaType === 'video' ? '影片' : '照片'}
                    </button>
                  </div>
                ) : (
                  /* 來源選擇面板 — 拍照 / 從相簿選擇 */
                  <div className="grid grid-cols-2 gap-4">
                    {/* 現場拍照 */}
                    <button
                      onClick={handleCameraCapture}
                      className="bg-white dark:bg-gray-800 border-2 border-dashed border-indigo-200 dark:border-indigo-800/50 rounded-3xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors group"
                    >
                      <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Camera className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">拍照</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">開啟相機現場拍攝</p>
                    </button>

                    {/* 從相簿選擇 */}
                    <button
                      onClick={handleGalleryPick}
                      className="bg-white dark:bg-gray-800 border-2 border-dashed border-purple-200 dark:border-purple-800/50 rounded-3xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors group"
                    >
                      <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Upload className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">從相簿選擇</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">支援照片與影片</p>
                    </button>
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={analyzeImage}
                  disabled={!mediaPreview || isAnalyzing || remainingLimit <= 0}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                      AI 分析中...
                    </>
                  ) : remainingLimit <= 0 ? (
                    '今日次數已用盡'
                  ) : (
                    '開始分析'
                  )}
                </button>

                {/* Result */}
                {result && (
                  <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mt-6 transition-colors">
                    <div className="flex items-center mb-4">
                      <CheckCircle2 className="w-6 h-6 text-green-500 dark:text-green-400 mr-2" />
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">分析結果</h3>
                    </div>
                    <div className="prose prose-sm prose-indigo dark:prose-invert max-w-none">
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{result}</p>
                    </div>

                    {/* 免責聲明 */}
                    <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl border border-yellow-100 dark:border-yellow-800/50 flex items-start">
                      <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mr-3 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-yellow-800 dark:text-yellow-400 leading-relaxed">
                        免責聲明：AI 分析結果僅供參考，不能取代專業獸醫師的診斷。若寵物有明顯不適或異常症狀，請立即尋求獸醫師協助。
                      </p>
                    </div>

                    {/* AI 服務來源透明度說明（Apple App Store 2025 新規） */}
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50 flex items-start">
                      <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                        本分析使用 Google Gemini AI 提供服務。您的寵物照片將傳送至 Google 伺服器進行處理。
                        詳情請參閱<button onClick={() => navigate('/privacy')} className="underline font-medium">隱私權政策</button>。
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Source Picker Modal (更換照片/影片時彈出) */}
      {showSourcePicker && (
        <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setShowSourcePicker(false)}>
          <div
            className="bg-white dark:bg-gray-800 w-full rounded-t-3xl p-6 space-y-3 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mb-2">
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-4">選擇來源</h3>
            <button
              onClick={handleCameraCapture}
              className="w-full flex items-center gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
            >
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center">
                <Camera className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">拍照</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">使用相機即時拍攝</p>
              </div>
            </button>
            <button
              onClick={handleGalleryPick}
              className="w-full flex items-center gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
            >
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center">
                <Upload className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">從相簿選擇</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">支援照片與影片檔案</p>
              </div>
            </button>
            <button
              onClick={() => setShowSourcePicker(false)}
              className="w-full py-3 text-gray-500 dark:text-gray-400 font-medium text-sm hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
