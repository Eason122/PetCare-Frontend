import React, { useState, useRef } from 'react';
import { Send, Image as ImageIcon, X } from 'lucide-react';
import { User } from '../../types';
import { compressImage } from '../../utils/compressImage';
import { useAppContext } from '../../context/AppContext';

interface CreatePostFormProps {
    user: User | null;
    onSubmit: (content: string, imageUrl?: string) => void;
}

export function CreatePostForm({ user, onSubmit }: CreatePostFormProps) {
    const [content, setContent] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [isCompressing, setIsCompressing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { showToast } = useAppContext();

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsCompressing(true);
            // P2: 前端壓縮圖片
            const compressedBase64 = await compressImage(file);
            setImage(compressedBase64);
        } catch (err: any) {
            showToast(err.message || '圖片處理失敗', 'error');
        } finally {
            setIsCompressing(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (content.trim() || image) {
            onSubmit(content, image || undefined);
            setContent('');
            setImage(null);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
            <form onSubmit={handleSubmit}>
                <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold flex-shrink-0">
                        {user?.name.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1">
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="分享寵物的可愛瞬間..."
                            className="w-full bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-colors"
                            rows={3}
                        />

                        {isCompressing && (
                            <p className="text-xs text-indigo-500 mt-2">圖片處理中...</p>
                        )}

                        {image && (
                            <div className="relative mt-3 inline-block">
                                <img src={image} alt="Preview" className="h-24 rounded-xl object-cover border border-gray-200 dark:border-gray-600" />
                                <button
                                    type="button"
                                    onClick={() => setImage(null)}
                                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-md flex items-center justify-center transition-colors z-10"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        )}

                        <div className="flex justify-between items-center mt-3">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isCompressing}
                                className="p-2 text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/30 disabled:opacity-50"
                            >
                                <ImageIcon className="w-5 h-5" />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                accept="image/*"
                                className="hidden"
                            />
                            <button
                                type="submit"
                                disabled={(!content.trim() && !image) || isCompressing}
                                className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 flex items-center shadow-sm transition-all active:scale-95"
                            >
                                <Send className="w-4 h-4 mr-2" />
                                發佈
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
