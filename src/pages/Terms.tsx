import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

/**
 * 服務條款頁面
 * Apple App Store / Google Play Store 上架必要頁面
 * NOTE: 包含 UGC 零容忍政策（審核合規必備）
 */
export default function Terms() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 max-w-md mx-auto transition-colors">
            <div className="bg-white dark:bg-gray-800 px-4 pt-8 pb-4 shadow-sm sticky top-0 z-10 transition-colors">
                <div className="flex items-center space-x-3 mb-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    </button>
                    <div className="flex items-center space-x-2">
                        <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">服務條款</h1>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                <p className="text-xs text-gray-500 dark:text-gray-400">最後更新日期：2026 年 3 月 4 日</p>

                <section className="space-y-3">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">1. 服務說明</h2>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        PetCare Pro 是一款寵物照護管理平台，提供寵物資料管理、AI 健康分析、友善空間地圖、
                        社群互動等功能。使用本服務即表示您同意以下條款。
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">2. AI 健康分析免責聲明</h2>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        AI 健康分析功能僅供參考，<strong>不構成專業獸醫診斷或醫療建議</strong>。若您的寵物有明顯不適或異常症狀，
                        請立即尋求合格獸醫師的專業協助。本平台不對 AI 分析結果的準確性承擔任何責任。
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">3. 使用者行為規範</h2>
                    <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2 list-disc pl-5 leading-relaxed">
                        <li>不得發佈違法、騷擾、歧視或不當內容</li>
                        <li>不得冒充他人或發佈虛假資訊</li>
                        <li>不得利用本服務進行任何商業推銷行為</li>
                        <li>不得嘗試破壞或干擾服務的正常運作</li>
                    </ul>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">4. VIP 會員服務</h2>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        VIP 會員為付費訂閱服務。購買後即刻生效，提供更多 AI 分析次數等進階功能。
                        退款政策依照 Apple App Store / Google Play Store 的相關規定辦理。
                        在 iOS 裝置上，訂閱費用將透過您的 Apple ID 帳號收取；
                        在 Android 裝置上，訂閱費用將透過 Google Play 帳號收取。
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">5. 服務變更與終止</h2>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        我們保留隨時修改、暫停或終止服務的權利。重大變更將透過應用程式內通知告知使用者。
                    </p>
                </section>

                {/* NOTE: UGC 零容忍政策（Apple/Google 審核合規必備段落） */}
                <section className="space-y-3">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">6. 使用者內容管理（UGC 政策）</h2>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        本平台對於不當內容與濫用行為採取<strong>零容忍政策</strong>。以下行為將導致內容被移除，嚴重者帳號將被永久停權：
                    </p>
                    <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2 list-disc pl-5 leading-relaxed">
                        <li>發佈色情、暴力、仇恨言論或其他違反社群規範的內容</li>
                        <li>對其他使用者進行騷擾、霸凌或人身攻擊</li>
                        <li>發佈垃圾訊息、不實廣告或詐騙資訊</li>
                        <li>冒充他人身份或盜用他人照片</li>
                        <li>任何可能導致動物虐待或傷害的內容</li>
                    </ul>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        我們保留在不事先通知的情況下，移除任何違反上述政策的內容並停用相關帳號的權利。
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">7. 檢舉與封鎖機制</h2>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        使用者可透過貼文右側「⋯」選單進行檢舉不當內容或封鎖特定使用者。
                        所有檢舉將由管理團隊在 24 小時內進行審核處理。
                        被封鎖的使用者將無法與您互動，您也不會看到其發佈的內容。
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">8. 適用法律</h2>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        本服務條款受中華民國（臺灣）法律管轄。
                    </p>
                </section>
            </div>
        </div>
    );
}
