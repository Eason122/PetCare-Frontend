import React from 'react';
import { User } from '../../types';

interface FriendListProps {
    friends: User[];
    selectedFriendId: string | null;
    onSelectFriend: (id: string) => void;
}

export function FriendList({ friends, selectedFriendId, onSelectFriend }: FriendListProps) {
    return (
        <div className="w-1/3 bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 overflow-y-auto flex flex-col transition-colors">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">好友列表</h2>
            {friends.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">目前沒有好友</p>
            ) : (
                <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                    {friends.map(friend => (
                        <button
                            key={friend.id}
                            onClick={() => onSelectFriend(friend.id)}
                            className={`w-full flex items-center space-x-3 p-3 rounded-2xl transition-all ${selectedFriendId === friend.id
                                    ? 'bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 shadow-sm'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-transparent'
                                }`}
                        >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/50 dark:to-indigo-800/50 flex flex-shrink-0 items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold border border-white dark:border-gray-800 shadow-sm">
                                {friend.name.charAt(0)}
                            </div>
                            <div className="text-left flex-1 overflow-hidden">
                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{friend.name}</p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
