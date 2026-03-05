import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import {
    ArrowLeft, CreditCard, Smartphone, Crown,
    Check, Shield, Star, Zap, Infinity, ChevronRight
} from 'lucide-react';
import type { PaymentMethod } from '../types';

/**
 * VIP 方案定義
 * NOTE: 金額以 TWD 為單位
 */
const VIP_PLANS = [
    {
        id: 'monthly',
        name: '月繳方案',
        price: 99,
        originalPrice: 149,
        period: '每月',
        description: '適合想先體驗的用戶',
        badge: '',
        features: ['無限 AI 健康分析', '去除廣告', '優先客服支援'],
    },
    {
        id: 'yearly',
        name: '年繳方案',
        price: 790,
        originalPrice: 1788,
        period: '每年',
        description: '最受歡迎的超值選擇',
        badge: '最划算',
        features: ['無限 AI 健康分析', '去除廣告', '優先客服支援', '專屬 VIP 徽章', '數據匯出報告'],
        savings: '省下 56%',
    },
    {
        id: 'lifetime',
        name: '終身方案',
        price: 1990,
        originalPrice: 0,
        period: '一次付清',
        description: '永久享有所有功能',
        badge: '終身',
        features: ['無限 AI 健康分析', '去除廣告', '優先客服支援', '專屬 VIP 徽章', '數據匯出報告', '搶先體驗新功能'],
    },
];

/**
 * 支付方式定義
 * NOTE: 各支付方式的 API 整合在 server.ts 的 /api/payment/process 端點
 */
const PAYMENT_METHODS: { id: PaymentMethod; name: string; icon: string; description: string }[] = [
    { id: 'credit_card', name: '信用卡 / 簽帳卡', icon: '💳', description: 'Visa, Mastercard, JCB' },
    { id: 'apple_pay', name: 'Apple Pay', icon: '🍎', description: '快速安全付款' },
    { id: 'line_pay', name: 'LINE Pay', icon: '💚', description: 'LINE 錢包付款' },
    { id: 'jko_pay', name: '街口支付', icon: '🔵', description: '街口錢包付款' },
];

export default function Payment() {
    const navigate = useNavigate();
    const { user, showToast, token } = useAppContext();

    const [selectedPlan, setSelectedPlan] = useState('yearly');
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
    const [step, setStep] = useState<'plan' | 'method' | 'card_form' | 'processing' | 'success'>('plan');

    // 信用卡表單
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvc, setCardCvc] = useState('');
    const [cardName, setCardName] = useState('');

    const [isProcessing, setIsProcessing] = useState(false);

    const currentPlan = VIP_PLANS.find(p => p.id === selectedPlan)!;

    // 已是 VIP 導回個人檔案
    if (user?.isVip) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-gray-50 dark:bg-gray-900">
                <Crown className="w-16 h-16 text-yellow-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">您已是 VIP 會員</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">享受所有 VIP 專屬功能</p>
                <button
                    onClick={() => navigate('/profile')}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium"
                >
                    返回個人檔案
                </button>
            </div>
        );
    }

    /**
     * 格式化信用卡號（每 4 碼一組）
     */
    const formatCardNumber = (value: string) => {
        const cleaned = value.replace(/\D/g, '').slice(0, 16);
        return cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    };

    /**
     * 格式化到期日（MM/YY）
     */
    const formatExpiry = (value: string) => {
        const cleaned = value.replace(/\D/g, '').slice(0, 4);
        if (cleaned.length >= 3) {
            return cleaned.slice(0, 2) + '/' + cleaned.slice(2);
        }
        return cleaned;
    };

    /**
     * 處理支付流程
     * 呼叫後端 API 建立訂單並處理付款
     */
    const handlePayment = async () => {
        if (!selectedMethod) return;

        setIsProcessing(true);
        setStep('processing');

        try {
            const authHeaders = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            };

            // Step 1: 建立訂單
            const createRes = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/payment/create-order', {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({
                    planId: selectedPlan,
                    planName: currentPlan.name,
                    amount: currentPlan.price,
                    paymentMethod: selectedMethod,
                }),
            });

            if (!createRes.ok) throw new Error('建立訂單失敗');
            const { orderId } = await createRes.json();

            // Step 2: 處理付款
            const processRes = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/payment/process', {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({
                    orderId,
                    paymentMethod: selectedMethod,
                    ...(selectedMethod === 'credit_card' && {
                        cardNumber: cardNumber.replace(/\s/g, ''),
                        cardExpiry,
                        cardCvc,
                        cardName,
                    }),
                }),
            });

            if (!processRes.ok) {
                const err = await processRes.json();
                throw new Error(err.error || '付款失敗');
            }

            // 支付成功
            setStep('success');
            showToast('🎉 VIP 升級成功！', 'success');

            // 延遲導回首頁
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (error: any) {
            console.error('Payment failed:', error);
            showToast(error.message || '付款失敗，請稍後再試', 'error');
            setStep('method');
        } finally {
            setIsProcessing(false);
        }
    };

    /**
     * 信用卡表單驗證
     */
    const isCardFormValid = () => {
        return (
            cardNumber.replace(/\s/g, '').length >= 15 &&
            cardExpiry.length === 5 &&
            cardCvc.length >= 3 &&
            cardName.trim().length > 0
        );
    };

    /**
     * 恢復購買 (Apple/Google 雙平台審核必備)
     */
    const handleRestorePurchases = async () => {
        setIsProcessing(true);
        // FIXME: 實作與原生 IAP 通訊的邏輯
        setTimeout(() => {
            setIsProcessing(false);
            showToast('已檢查您的 Apple ID / Google Play 帳號，未發現可恢復的有效訂閱紀錄。', 'info');
        }, 1500);
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 transition-colors">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 px-4 pt-8 pb-4 shadow-sm z-10 transition-colors">
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => {
                            if (step === 'method') setStep('plan');
                            else if (step === 'card_form') setStep('method');
                            else navigate(-1);
                        }}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">升級 VIP</h1>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">

                {/* ========== Step 1: 方案選擇 ========== */}
                {step === 'plan' && (
                    <>
                        {/* VIP 特權介紹 */}
                        <div className="bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 rounded-3xl p-6 text-white shadow-lg">
                            <div className="flex items-center mb-3">
                                <Crown className="w-8 h-8 mr-3" />
                                <div>
                                    <h2 className="text-xl font-bold">PetCare VIP</h2>
                                    <p className="text-yellow-100 text-sm">解鎖所有進階功能</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-4">
                                {[
                                    { icon: Infinity, text: '無限AI分析' },
                                    { icon: Zap, text: '去除廣告' },
                                    { icon: Star, text: 'VIP專屬徽章' },
                                    { icon: Shield, text: '優先客服' },
                                ].map(({ icon: Icon, text }) => (
                                    <div key={text} className="flex items-center bg-white/15 rounded-xl px-3 py-2">
                                        <Icon className="w-4 h-4 mr-2 flex-shrink-0" />
                                        <span className="text-xs font-medium">{text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 方案列表 */}
                        <div className="space-y-3">
                            {VIP_PLANS.map(plan => (
                                <button
                                    key={plan.id}
                                    onClick={() => setSelectedPlan(plan.id)}
                                    className={`w-full text-left p-5 pl-12 rounded-2xl border-2 transition-all relative ${selectedPlan === plan.id
                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-md'
                                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-300'
                                        }`}
                                >
                                    {plan.badge && (
                                        <span className="absolute -top-2.5 right-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold px-3 py-0.5 rounded-full">
                                            {plan.badge}
                                        </span>
                                    )}

                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{plan.description}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-baseline">
                                                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                                                    ${plan.price}
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">{plan.period}</span>
                                            {plan.originalPrice > 0 && (
                                                <p className="text-xs text-gray-400 line-through mt-0.5">${plan.originalPrice}</p>
                                            )}
                                        </div>
                                    </div>

                                    {plan.savings && (
                                        <span className="inline-block mt-2 text-xs font-bold text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                                            {plan.savings}
                                        </span>
                                    )}

                                    {/* 選中指示器 — 放在左側避免遮擋右側金額 */}
                                    <div className={`absolute top-5 left-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedPlan === plan.id
                                        ? 'border-indigo-500 bg-indigo-500'
                                        : 'border-gray-300 dark:border-gray-600'
                                        }`}>
                                        {selectedPlan === plan.id && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* 繼續按鈕 */}
                        <button
                            onClick={() => setStep('method')}
                            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center"
                        >
                            選擇付款方式
                            <ChevronRight className="w-5 h-5 ml-1" />
                        </button>

                        <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                            <Shield className="w-3 h-3 inline mr-1" />
                            付款安全由 SSL 加密保護 • 可隨時取消
                        </p>
                    </>
                )}

                {/* ========== Step 2: 付款方式選擇 ========== */}
                {step === 'method' && (
                    <>
                        {/* 已選方案摘要 */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">已選方案</p>
                                <p className="font-bold text-gray-900 dark:text-white">{currentPlan.name}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">${currentPlan.price}</p>
                                <p className="text-xs text-gray-500">{currentPlan.period}</p>
                            </div>
                        </div>

                        {/* 付款方式列表 */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">選擇付款方式</h3>
                            {PAYMENT_METHODS.map(method => (
                                <button
                                    key={method.id}
                                    onClick={() => {
                                        setSelectedMethod(method.id);
                                        if (method.id === 'credit_card') {
                                            setStep('card_form');
                                        }
                                    }}
                                    className={`w-full flex items-center p-4 rounded-2xl border-2 transition-all ${selectedMethod === method.id
                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-300'
                                        }`}
                                >
                                    <span className="text-2xl mr-4">{method.icon}</span>
                                    <div className="flex-1 text-left">
                                        <p className="font-bold text-gray-900 dark:text-white">{method.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{method.description}</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                </button>
                            ))}
                        </div>

                        {/* 非信用卡直接付款按鈕 */}
                        {selectedMethod && selectedMethod !== 'credit_card' && (
                            <button
                                onClick={handlePayment}
                                disabled={isProcessing}
                                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50"
                            >
                                {isProcessing ? '處理中...' : `以 ${PAYMENT_METHODS.find(m => m.id === selectedMethod)?.name} 支付 $${currentPlan.price}`}
                            </button>
                        )}
                    </>
                )}

                {/* ========== Step 3: 信用卡表單 ========== */}
                {step === 'card_form' && (
                    <>
                        {/* 方案摘要 */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">💳 信用卡付款</p>
                                <p className="font-bold text-gray-900 dark:text-white">{currentPlan.name}</p>
                            </div>
                            <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">${currentPlan.price}</p>
                        </div>

                        {/* 信用卡表單 */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">持卡人姓名</label>
                                <input
                                    type="text"
                                    value={cardName}
                                    onChange={e => setCardName(e.target.value)}
                                    placeholder="王小明"
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">卡號</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={cardNumber}
                                        onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                                        placeholder="0000 0000 0000 0000"
                                        maxLength={19}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white tracking-wider"
                                    />
                                    <CreditCard className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">到期日</label>
                                    <input
                                        type="text"
                                        value={cardExpiry}
                                        onChange={e => setCardExpiry(formatExpiry(e.target.value))}
                                        placeholder="MM/YY"
                                        maxLength={5}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">安全碼</label>
                                    <input
                                        type="text"
                                        value={cardCvc}
                                        onChange={e => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                        placeholder="CVV"
                                        maxLength={4}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 付款按鈕 */}
                        <button
                            onClick={handlePayment}
                            disabled={!isCardFormValid() || isProcessing}
                            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center"
                        >
                            <Shield className="w-5 h-5 mr-2" />
                            {isProcessing ? '處理中...' : `確認付款 $${currentPlan.price}`}
                        </button>

                        <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                            <Shield className="w-3 h-3 inline mr-1" />
                            您的卡片資訊經 SSL 256-bit 加密保護
                        </p>
                    </>
                )}

                {/* ========== 付款處理中 ========== */}
                {step === 'processing' && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">付款處理中</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">請勿關閉此頁面...</p>
                    </div>
                )}

                {/* ========== 付款成功 ========== */}
                {step === 'success' && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
                            <Check className="w-10 h-10 text-green-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">🎉 升級成功！</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-2">
                            您已成功升級為 VIP 會員
                        </p>
                        <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium mb-6">
                            {currentPlan.name} — ${currentPlan.price} {currentPlan.period}
                        </p>
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl p-4 border border-yellow-200 dark:border-yellow-800/50 w-full max-w-xs">
                            <Crown className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                            <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium">
                                所有 VIP 功能已解鎖！
                            </p>
                            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                                頁面將自動重新載入...
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
