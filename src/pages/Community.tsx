import React, { useState, useEffect } from 'react';
import { Users, UserPlus } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useChatWebSocket } from '../hooks/useChatWebSocket';
import { User } from '../types';

import { PostCard } from '../components/community/PostCard';
import { CreatePostForm } from '../components/community/CreatePostForm';
import { FriendList } from '../components/community/FriendList';
import { ChatWindow } from '../components/community/ChatWindow';
import { SearchUsersModal } from '../components/community/SearchUsersModal';
import { ReportPostModal } from '../components/community/ReportPostModal';
import { BlockedUsersModal } from '../components/community/BlockedUsersModal';
import { ShieldAlert } from 'lucide-react';


export function Community() {
  const { user, posts, friends, token, fetchPosts, fetchFriends, addFriend, addPost, likePost, commentPost, showToast, deletePost } = useAppContext();
  const [activeTab, setActiveTab] = useState<'feed' | 'chat'>('feed');
  const [blockedUsers, setBlockedUsers] = useState<User[]>([]);


  // Modal States
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);
  const [reportTargetPostId, setReportTargetPostId] = useState<string | null>(null);

  // Chat States
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);

  // P0: WebSocket Hook
  const { connectionStatus, sendMessage, reconnect } = useChatWebSocket({
    token,
    enabled: activeTab === 'chat',
    onMessage: (data) => {
      if (data.type === 'chat') {
        setChatMessages(prev => [...prev, data.message]);
      }
    }
  });

  const selectedFriend = friends.find(f => f.id === selectedFriendId);

  // 初始化撈取資料
  useEffect(() => {
    if (token) {
      if (activeTab === 'feed') fetchPosts();
      if (activeTab === 'chat') fetchFriends();
    }
  }, [activeTab, token]);

  // 載入封鎖名單
  useEffect(() => {
    if (token) {
      fetch(import.meta.env.VITE_API_BASE_URL + '/api/users/blocked', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : [])
        .then(data => setBlockedUsers(data))
        .catch(() => { });
    }
  }, [token]);

  // 載入聊天紀錄
  useEffect(() => {
    if (activeTab === 'chat' && selectedFriendId && token) {
      fetch(import.meta.env.VITE_API_BASE_URL + `/api/messages?friendId=${selectedFriendId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setChatMessages(data))
        .catch(console.error);
    } else {
      setChatMessages([]);
    }
  }, [activeTab, selectedFriendId, token]);

  // Handlers
  const handleSendMessage = (content: string) => {
    if (selectedFriendId) {
      sendMessage({ type: 'chat', content, receiverId: selectedFriendId });
    }
  };

  const handleSearchUsers = async (query: string): Promise<User[]> => {
    const res = await fetch(import.meta.env.VITE_API_BASE_URL + `/api/users/search?q=${encodeURIComponent(query)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('搜尋失敗');
    return res.json();
  };

  const handleReportSubmit = async (reason: string, detail: string) => {
    if (!reportTargetPostId) return;
    try {
      const res = await fetch(import.meta.env.VITE_API_BASE_URL + `/api/posts/${reportTargetPostId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reason, detail }),
      });
      if (res.ok) {
        showToast('檢舉已提交，我們將儘速審核', 'success');
      } else {
        const data = await res.json();
        showToast(data.error || '檢舉失敗', 'error');
      }
    } catch {
      showToast('檢舉失敗，請稍後再試', 'error');
    } finally {
      setIsReportModalOpen(false);
      setReportTargetPostId(null);
    }
  };

  const handleBlockUser = async (userId: string) => {
    try {
      const res = await fetch(import.meta.env.VITE_API_BASE_URL + `/api/users/${userId}/block`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        // 先用 id 撈出對應的 user mock data 塞入 blockedUsers，或重新 fetch
        // 為了簡單，直接重新 fetch 封鎖名單
        const response = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/users/blocked', { headers: { 'Authorization': `Bearer ${token}` } });
        if (response.ok) {
          setBlockedUsers(await response.json());
        }
        showToast('已封鎖該使用者', 'info');
      }
    } catch {
      showToast('封鎖失敗', 'error');
    }
  };

  const handleUnblockUser = async (userId: string) => {
    try {
      const res = await fetch(import.meta.env.VITE_API_BASE_URL + `/api/users/${userId}/block`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        setBlockedUsers(prev => prev.filter(u => u.id !== userId));
        showToast('已解除封鎖', 'success');
      }
    } catch {
      showToast('解除封鎖失敗', 'error');
    }
  };

  const handleShare = (postId: string) => {
    const url = `${window.location.origin}/community?post=${postId}`;
    navigator.clipboard.writeText(url).then(() => {
      showToast('連結已複製到剪貼簿！', 'success');
    }).catch(() => {
      showToast('複製失敗，請手動複製', 'error');
    });
  };

  // 過濾已封鎖的使用者貼文
  const blockedUserIds = blockedUsers.map(u => u.id);
  const visiblePosts = posts.filter(p => !blockedUserIds.includes(p.userId || ''));

  return (
    <div className="flex flex-col h-[calc(100vh-80px-env(safe-area-inset-bottom))] bg-gray-50 dark:bg-gray-900 transition-colors relative">
      <div className="bg-white dark:bg-gray-800 px-4 pt-8 pb-4 shadow-sm z-10 transition-colors">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">寵物社群</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => setIsBlockedModalOpen(true)}
              className="p-2.5 bg-red-50 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400 relative hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors shadow-sm"
              aria-label="管理封鎖名單"
            >
              <ShieldAlert className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-full text-indigo-600 dark:text-indigo-400 relative hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors shadow-sm"
            >
              <UserPlus className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700/80 p-1.5 rounded-2xl mb-2 transition-colors shadow-inner">
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'feed'
              ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
          >
            動態牆
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'chat'
              ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
          >
            聊天室
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {activeTab === 'feed' ? (
          <>
            <CreatePostForm user={user} onSubmit={(content, imageUrl) => addPost({ content, imageUrl })} />

            <div className="space-y-4">
              {visiblePosts.length === 0 && (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 mx-2">
                  <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-indigo-300 dark:text-indigo-500" />
                  </div>
                  <p className="text-gray-900 dark:text-white font-bold text-lg mb-1">還沒有任何動態</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">成為第一個分享寵物可愛瞬間的人吧！</p>
                </div>
              )}
              {visiblePosts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUser={user}
                  onLike={likePost}
                  onComment={commentPost}
                  onShare={handleShare}
                  onReport={(id) => {
                    setReportTargetPostId(id);
                    setIsReportModalOpen(true);
                  }}
                  onBlock={handleBlockUser}
                  onDelete={deletePost}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="flex h-[calc(100vh-230px)] space-x-4">
            <FriendList
              friends={friends}
              selectedFriendId={selectedFriendId}
              onSelectFriend={setSelectedFriendId}
            />
            <ChatWindow
              currentUser={user}
              selectedFriend={selectedFriend}
              messages={chatMessages}
              connectionStatus={connectionStatus}
              onSendMessage={handleSendMessage}
              onReconnect={reconnect}
            />
          </div>
        )}
      </div>

      <SearchUsersModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        currentUser={user}
        friends={friends}
        onSearch={handleSearchUsers}
        onAddFriend={addFriend}
      />

      <ReportPostModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={handleReportSubmit}
      />

      <BlockedUsersModal
        isOpen={isBlockedModalOpen}
        onClose={() => setIsBlockedModalOpen(false)}
        blockedUsers={blockedUsers}
        onUnblock={handleUnblockUser}
      />
    </div>
  );
}
