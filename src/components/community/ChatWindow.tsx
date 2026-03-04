import React, { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { Send, Wifi, WifiOff, Loader2, MessageCircle } from 'lucide-react';
import { User, Message } from '../../types';

interface ChatWindowProps {
    currentUser: User | null;
    selectedFriend: User | undefined;
    messages: Message[];
    connectionStatus: 'connecting' | 'connected' | 'disconnected';
    onSendMessage: (content: string) => void;
    onReconnect: () => void;
}

export function ChatWindow({
    currentUser,
    selectedFriend,
    messages,
    connectionStatus,
    onSendMessage,
    onReconnect
}: ChatWindowProps) {
    const [newChatMessage, setNewChatMessage] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newChatMessage.trim() && connectionStatus === 'connected') {
            onSendMessage(newChatMessage);
            setNewChatMessage('');
        }
    };

    if (!selectedFriend) {
        return (
            <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 items-center justify-center text-gray-500 dark:text-gray-400 transition-colors">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                    <MessageCircle className="w-8 h-8 text-gray-300 dark:text-gray-500" />
                </div>
                <p>請選擇左側好友開始聊天</p>
            </div>
        );
    }

    // P0: 狀態指示器
    const StatusIndicator = () => {
        switch (connectionStatus) {
            case 'connected':
                return (
                    <div className="flex items-center text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></span>
                        已連線
                    </div>
                );
            case 'connecting':
                return (
                    <div className="flex items-center text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-full">
                        <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                        連線中...
                    </div>
                );
            case 'disconnected':
            default:
                return (
                    <button
                        onClick={onReconnect}
                        className="flex items-center text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors cursor-pointer border border-transparent hover:border-red-200 dark:hover:border-red-800"
                    >
                        <WifiOff className="w-3 h-3 mr-1.5" />
                        離線，點此重連
                    </button>
                );
        }
    };

    return (
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm flex justify-between items-center z-10 transition-colors">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/50 dark:to-indigo-800/50 flex flex-shrink-0 items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold border border-white dark:border-gray-800 shadow-sm">
                        {selectedFriend.name.charAt(0)}
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white">
                        {selectedFriend.name}
                    </h3>
                </div>
                <StatusIndicator />
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
                        尚無聊天紀錄
                    </div>
                ) : (
                    messages.map(msg => {
                        const currentSenderId = (msg as any).sender_id || msg.senderId;
                        const isMe = currentSenderId === currentUser?.id;

                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end group`}>
                                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-xs shadow-sm ${isMe ? 'ml-2 bg-gradient-to-br from-indigo-500 to-indigo-600 mb-5' : 'mr-2 bg-gradient-to-br from-gray-400 to-gray-500 mb-5'
                                        }`}>
                                        {msg.senderName?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        {!isMe && <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1 ml-1 font-medium">{msg.senderName}</p>}
                                        <div className={`px-4 py-2.5 rounded-2xl text-[15px] shadow-sm relative ${isMe
                                                ? 'bg-indigo-600 text-white rounded-br-sm'
                                                : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-100 dark:border-gray-600 rounded-bl-sm'
                                            }`}>
                                            {msg.content}
                                        </div>
                                        <p className={`text-[10px] text-gray-400 dark:text-gray-500 mt-1 ${isMe ? 'text-right mr-1' : 'ml-1'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                                            {formatDistanceToNow(new Date(msg.date), { addSuffix: true, locale: zhTW })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors">
                <form onSubmit={handleSubmit} className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={newChatMessage}
                        onChange={(e) => setNewChatMessage(e.target.value)}
                        disabled={connectionStatus !== 'connected'}
                        placeholder={connectionStatus === 'connected' ? "輸入訊息..." : "連線已中斷"}
                        className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-full px-4 py-2.5 text-[15px] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 border border-transparent focus:border-indigo-100 dark:focus:border-indigo-900/50"
                    />
                    <button
                        type="submit"
                        disabled={!newChatMessage.trim() || connectionStatus !== 'connected'}
                        className="p-3 bg-indigo-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors flex-shrink-0 shadow-sm"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
}
