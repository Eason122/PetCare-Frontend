import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { User as UserType } from '../../types';

interface SearchUsersModalProps {
    currentUser: UserType | null;
    friends: UserType[];
    isOpen: boolean;
    onClose: () => void;
    onSearch: (query: string) => Promise<UserType[]>;
    onAddFriend: (friendId: string) => Promise<void>;
}

export function SearchUsersModal({
    currentUser,
    friends,
    isOpen,
    onClose,
    onSearch,
    onAddFriend
}: SearchUsersModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UserType[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    if (!isOpen) return null;

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const results = await onSearch(searchQuery);
            setSearchResults(results);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSearching(false);
        }
    };

    const handleAddClick = async (friendId: string) => {
        await onAddFriend(friendId);
        setSearchResults(prev => prev.map(u => u.id === friendId ? { ...u, isFriend: true } : u));
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-opacity">
            <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md overflow-hidden shadow-xl flex flex-col max-h-[80vh] border border-gray-100 dark:border-gray-700">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">尋找好友</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-5">
                    <div className="flex space-x-2 mb-4">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="輸入用戶名稱..."
                            className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-transparent dark:border-gray-600 transition-colors"
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <button
                            onClick={handleSearch}
                            disabled={isSearching || !searchQuery.trim()}
                            className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                            <Search className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-3 overflow-y-auto max-h-64 pr-2 custom-scrollbar">
                        {isSearching ? (
                            <p className="text-center text-gray-500 dark:text-gray-400 py-4 animate-pulse">搜尋中...</p>
                        ) : (
                            searchResults.map(resultUser => {
                                const isAlreadyFriend = friends.some(f => f.id === resultUser.id) || (resultUser as any).isFriend;
                                const isSelf = resultUser.id === currentUser?.id;

                                return (
                                    <div key={resultUser.id} className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-colors">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/50 dark:to-indigo-800/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold border border-white dark:border-gray-700 shadow-sm">
                                                {resultUser.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 dark:text-white">{resultUser.name}</p>
                                                {isSelf && <p className="text-xs text-indigo-500">你自己</p>}
                                            </div>
                                        </div>
                                        {!isSelf && (
                                            <button
                                                onClick={() => !isAlreadyFriend && handleAddClick(resultUser.id)}
                                                disabled={isAlreadyFriend}
                                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${isAlreadyFriend
                                                        ? 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                                        : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 hover:scale-105 active:scale-95'
                                                    }`}
                                            >
                                                {isAlreadyFriend ? '已是好友' : '加好友'}
                                            </button>
                                        )}
                                    </div>
                                );
                            })
                        )}
                        {!isSearching && searchResults.length === 0 && searchQuery && (
                            <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">找不到相關用戶</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
