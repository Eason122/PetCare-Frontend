import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ReportPostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string, detail: string) => Promise<void>;
}

export function ReportPostModal({ isOpen, onClose, onSubmit }: ReportPostModalProps) {
    const [reportReason, setReportReason] = useState('');
    const [reportDetail, setReportDetail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!reportReason) return;
        setIsSubmitting(true);
        await onSubmit(reportReason, reportDetail);
        setIsSubmitting(false);
        setReportReason('');
        setReportDetail('');
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-opacity">
            <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-xl border border-gray-100 dark:border-gray-700">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                        <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />檢舉貼文
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-gray-200 dark:bg-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-5 space-y-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">請選擇檢舉原因：</p>
                    <div className="space-y-2.5">
                        {[
                            { id: 'inappropriate', label: '不當內容' },
                            { id: 'harassment', label: '騷擾或霸凌' },
                            { id: 'spam', label: '垃圾訊息或廣告' },
                            { id: 'other', label: '其他' },
                        ].map(option => (
                            <button
                                key={option.id}
                                onClick={() => setReportReason(option.id)}
                                className={`w-full text-left p-3.5 rounded-xl border-[1.5px] text-sm font-medium transition-all ${reportReason === option.id
                                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 shadow-sm'
                                        : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-red-300 dark:hover:border-red-800 hover:bg-red-50/50 dark:hover:bg-red-900/10'
                                    }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>

                    {reportReason === 'other' && (
                        <textarea
                            value={reportDetail}
                            onChange={e => setReportDetail(e.target.value)}
                            placeholder="請說明具體原因..."
                            className="w-full bg-gray-50 dark:bg-gray-700/80 rounded-xl p-3.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none transition-shadow border border-transparent focus:border-red-100 dark:focus:border-red-900/50 mt-2"
                            rows={3}
                        />
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={!reportReason || isSubmitting}
                        className="w-full py-3.5 bg-red-600 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-700 transition-all active:scale-95 shadow-sm mt-4 tracking-wide"
                    >
                        {isSubmitting ? '提交中...' : '提交檢舉'}
                    </button>
                </div>
            </div>
        </div>
    );
}
