import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

/**
 * 隱私權政策頁面
 * Apple App Store / Google Play Store 上架必要頁面
 */
export default function Privacy() {
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
                        <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">隱私權政策</h1>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                <p className="text-xs text-gray-500 dark:text-gray-400">最後更新日期：2026 年 3 月 4 日</p>

                <section className="space-y-3">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">1. 我們收集的資料</h2>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        PetCare Pro 為提供服務，會收集以下類型的個人資料：
                    </p>
                    <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2 list-disc pl-5 leading-relaxed">
                        <li><strong>帳戶資訊</strong>：Email 地址、帳戶 ID、使用者名稱</li>
                        <li><strong>寵物資料</strong>：寵物名稱、種類、品種、生日、體重、疫苗紀錄、健康記錄</li>
                        <li><strong>AI 分析資料</strong>：您上傳供 AI 健康分析的寵物照片與分析結果</li>
                        <li><strong>社群資料</strong>：動態貼文內容、留言、聊天訊息</li>
                        <li><strong>預約資料</strong>：醫院預約時間、地點、備註</li>
                    </ul>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">2. 資料使用方式</h2>
                    <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2 list-disc pl-5 leading-relaxed">
                        <li>提供寵物管理與健康追蹤服務</li>
                        <li>進行 AI 寵物健康分析（使用 Google Gemini API）</li>
                        <li>支援社群互動與即時聊天功能</li>
                        <li>發送疫苗到期提醒與預約通知</li>
                    </ul>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">3. AI 服務使用說明</h2>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        本應用程式使用 <strong>Google Gemini API</strong> 提供 AI 寵物健康分析功能。當您上傳寵物照片進行分析時，
                        照片資料將傳送至 Google 的伺服器進行處理。AI 分析結果僅供參考，不構成專業獸醫診斷。
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">4. 資料安全</h2>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        我們採用 JWT 身分驗證機制保護您的帳戶安全，密碼使用 bcrypt 加密儲存，確保資料傳輸與儲存的安全性。
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">5. 帳號刪除</h2>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        您可以隨時在「個人檔案 → 帳號設定」中刪除您的帳號。刪除帳號後，所有個人資料、寵物資料、貼文、
                        聊天記錄等將被永久刪除，且無法恢復。
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">6. 聯絡我們</h2>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        如果您對我們的隱私權政策有任何疑問，請透過應用程式內的意見回饋功能與我們聯繫。
                    </p>
                </section>
            </div>
        </div>
    );
}
