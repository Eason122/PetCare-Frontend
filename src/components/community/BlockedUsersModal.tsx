import React, { useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';
import { User } from '../../types';

interface BlockedUsersModalProps {
    isOpen: boolean;
    onClose: () => void;
    blockedUsers: User[];
    onUnblock: (userId: string) => Promise<void>;
}

export function BlockedUsersModal({
    isOpen,
    onClose,
    blockedUsers,
    onUnblock
}: BlockedUsersModalProps) {
    const [unblockingId, setUnblockingId] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleUnblock = async (userId: string) => {
        setUnblockingId(userId);
        await onUnblock(userId);
        setUnblockingId(null);
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-opacity">
            <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md overflow-hidden shadow-xl flex flex-col max-h-[80vh] border border-gray-100 dark:border-gray-700">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                        <ShieldAlert className="w-5 h-5 text-gray-500 mr-2" />管理封鎖名單
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors p-1 flex-shrink-0 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 flex-1 overflow-y-auto">
                    {blockedUsers.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500 dark:text-gray-400">目前沒有封鎖任何人</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {blockedUsers.map(user => (
                                <div key={user.id} className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-colors">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold shadow-sm">
                                            {user.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">{user.name}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleUnblock(user.id)}
                                        disabled={unblockingId === user.id}
                                        className="px-4 py-1.5 rounded-full text-xs font-bold transition-all bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {unblockingId === user.id ? '處理中...' : '解除封鎖'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
