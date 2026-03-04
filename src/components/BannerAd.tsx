import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { X, Megaphone, ExternalLink } from 'lucide-react';

/**
 * 廣告輪播資料
 * NOTE: 正式環境可替換為從廣告 API（如 Google AdMob）動態拉取
 */
const AD_POOL = [
    {
        id: 'ad-1',
        title: '🐾 PetFood Pro',
        description: '天然有機寵物飼料，首購享 8 折優惠',
        cta: '了解更多',
        bgGradient: 'from-amber-500 to-orange-500',
        url: '#',
    },
    {
        id: 'ad-2',
        title: '🏥 PetClinic 24H',
        description: '24 小時線上獸醫諮詢，守護毛孩健康',
        cta: '立即預約',
        bgGradient: 'from-teal-500 to-cyan-500',
        url: '#',
    },
    {
        id: 'ad-3',
        title: '🛒 PetShop Mall',
        description: '寵物用品滿千免運，結帳再折 $100',
        cta: '去逛逛',
        bgGradient: 'from-pink-500 to-rose-500',
        url: '#',
    },
    {
        id: 'ad-4',
        title: '📸 寵物攝影工作室',
        description: '專業寵物寫真，留下最美回憶',
        cta: '預約拍攝',
        bgGradient: 'from-violet-500 to-purple-500',
        url: '#',
    },
];

/** 廣告自動關閉後恢復的等待時間（毫秒） */
const AD_RESHOW_DELAY_MS = 30000;
/** 廣告輪播間隔（毫秒） */
const AD_ROTATE_INTERVAL_MS = 8000;

interface BannerAdProps {
    className?: string;
}

/**
 * 底部橫幅廣告元件
 * 僅非 VIP 用戶顯示，支援輪播與暫時關閉
 */
export default function BannerAd({ className = '' }: BannerAdProps) {
    const { user } = useAppContext();
    const [currentAdIndex, setCurrentAdIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);
    const [isAnimating, setIsAnimating] = useState(false);

    // VIP 用戶不顯示廣告
    if (user?.isVip) return null;

    // 廣告輪播
    useEffect(() => {
        const interval = setInterval(() => {
            setIsAnimating(true);
            setTimeout(() => {
                setCurrentAdIndex(prev => (prev + 1) % AD_POOL.length);
                setIsAnimating(false);
            }, 300);
        }, AD_ROTATE_INTERVAL_MS);

        return () => clearInterval(interval);
    }, []);

    /**
     * 暫時關閉廣告
     * 關閉後 30 秒自動恢復顯示
     */
    const handleClose = useCallback(() => {
        setIsVisible(false);
        setTimeout(() => {
            setIsVisible(true);
        }, AD_RESHOW_DELAY_MS);
    }, []);

    if (!isVisible) return null;

    const currentAd = AD_POOL[currentAdIndex];

    return (
        <div className={`w-full px-2 pb-1 ${className}`}>
            <div
                className={`relative bg-gradient-to-r ${currentAd.bgGradient} rounded-xl px-4 py-2.5 shadow-md transition-all duration-300 ${isAnimating ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'}`}
            >
                {/* 關閉按鈕 */}
                <button
                    onClick={handleClose}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/20 hover:bg-black/30 text-white/80 hover:text-white transition-colors"
                    aria-label="關閉廣告"
                >
                    <X className="w-3 h-3" />
                </button>

                {/* 廣告標籤 */}
                <span className="absolute top-1 left-2 text-[9px] text-white/60 font-medium flex items-center">
                    <Megaphone className="w-2.5 h-2.5 mr-0.5" />
                    廣告
                </span>

                {/* 廣告內容 */}
                <div className="flex items-center justify-between mt-2">
                    <div className="flex-1 mr-2">
                        <p className="text-white font-bold text-sm leading-tight">{currentAd.title}</p>
                        <p className="text-white/80 text-xs mt-0.5">{currentAd.description}</p>
                    </div>
                    <button
                        onClick={() => window.open(currentAd.url, '_blank')}
                        className="flex-shrink-0 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center transition-colors"
                    >
                        {currentAd.cta}
                        <ExternalLink className="w-3 h-3 ml-1" />
                    </button>
                </div>

                {/* 輪播指示器 */}
                <div className="flex justify-center space-x-1 mt-1.5">
                    {AD_POOL.map((_, idx) => (
                        <div
                            key={idx}
                            className={`w-1 h-1 rounded-full transition-all ${idx === currentAdIndex ? 'bg-white w-3' : 'bg-white/40'}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
