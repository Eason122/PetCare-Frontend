import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Heart, MessageCircle, Share2, Image as ImageIcon, Send, UserPlus, X, Search, Users, MoreVertical, Flag, Ban, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';

export default function Community() {
  const { user, posts, addPost, likePost, commentPost, token, addFriend, friends, showToast } = useAppContext();
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'feed' | 'chat'>('feed');
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const [commentContent, setCommentContent] = useState('');

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // NOTE: UGC 檢舉/封鎖狀態（Apple/Google 審核合規必要功能）
  const [actionMenuPostId, setActionMenuPostId] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportTargetPostId, setReportTargetPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDetail, setReportDetail] = useState('');
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);

  useEffect(() => {
    if (activeTab === 'chat' && token && !wsRef.current) {
      // Connect WS
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'auth', token }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'chat') {
          setChatMessages(prev => [...prev, data.message]);
        }
      };

      wsRef.current = ws;
    }

    return () => {
      if (wsRef.current && activeTab !== 'chat') {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [activeTab, token]);

  // 載入封鎖名單
  useEffect(() => {
    if (token) {
      fetch(import.meta.env.VITE_API_BASE_URL + '/api/users/blocked', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : [])
        .then(data => setBlockedUserIds(data.map((u: any) => u.id)))
        .catch(() => { });
    }
  }, [token]);

  useEffect(() => {
    if (activeTab === 'chat' && selectedFriendId && token) {
      // Fetch history for selected friend
      fetch(`/api/messages?friendId=${selectedFriendId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setChatMessages(data))
        .catch(console.error);
    } else {
      setChatMessages([]);
    }
  }, [activeTab, selectedFriendId, token]);

  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPostContent.trim() || newPostImage) {
      addPost({ content: newPostContent, imageUrl: newPostImage || undefined });
      setNewPostContent('');
      setNewPostImage(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPostImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newChatMessage.trim() && wsRef.current?.readyState === WebSocket.OPEN && selectedFriendId) {
      wsRef.current.send(JSON.stringify({
        type: 'chat',
        content: newChatMessage,
        receiverId: selectedFriendId
      }));
      setNewChatMessage('');
    }
  };

  const handleLike = (postId: string) => {
    likePost(postId);
  };

  const handleCommentSubmit = (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    if (commentContent.trim()) {
      commentPost(postId, commentContent);
      setCommentContent('');
      setCommentingOn(null);
    }
  };

  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSearchResults(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddFriend = async (friendId: string) => {
    await addFriend(friendId);
    setSearchResults(searchResults.map(u => u.id === friendId ? { ...u, isFriend: true } : u));
  };

  const handleShare = (postId: string) => {
    const url = `${window.location.origin}/community?post=${postId}`;
    navigator.clipboard.writeText(url).then(() => {
      showToast('連結已複製到剪貼簿！', 'success');
    }).catch(() => {
      showToast('複製失敗，請手動複製', 'error');
    });
  };

  /**
   * 檢舉貼文（Apple/Google UGC 審核要求）
   */
  const handleReportPost = async () => {
    if (!reportTargetPostId || !reportReason) return;
    try {
      const res = await fetch(`/api/posts/${reportTargetPostId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: reportReason, detail: reportDetail }),
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
      setReportReason('');
      setReportDetail('');
    }
  };

  /**
   * 封鎖使用者（Apple/Google UGC 審核要求）
   */
  const handleBlockUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}/block`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        setBlockedUserIds(prev => [...prev, userId]);
        showToast('已封鎖該使用者', 'info');
      }
    } catch {
      showToast('封鎖失敗', 'error');
    }
    setActionMenuPostId(null);
  };

  // NOTE: 過濾已封鎖用戶的貼文
  const visiblePosts = posts.filter(p => !blockedUserIds.includes(p.userId || ''));

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 transition-colors relative">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 px-4 pt-8 pb-4 shadow-sm z-10 transition-colors">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">寵物社群</h1>
          <button
            onClick={() => setIsSearchModalOpen(true)}
            className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-full text-indigo-600 dark:text-indigo-400 relative hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
          >
            <UserPlus className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-2xl mb-4 transition-colors">
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-all ${activeTab === 'feed'
              ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
          >
            動態牆
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-all ${activeTab === 'chat'
              ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
          >
            聊天室
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {activeTab === 'feed' ? (
          <>
            {/* Create Post */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
              <form onSubmit={handlePostSubmit}>
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold flex-shrink-0">
                    {user?.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      placeholder="分享寵物的可愛瞬間..."
                      className="w-full bg-gray-50 dark:bg-gray-700 rounded-2xl p-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-colors"
                      rows={3}
                    />
                    {newPostImage && (
                      <div className="relative mt-2 inline-block">
                        <img src={newPostImage} alt="Preview" className="h-24 rounded-xl object-cover" />
                        <button
                          type="button"
                          onClick={() => setNewPostImage(null)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <div className="flex justify-between items-center mt-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-gray-400 dark:text-gray-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
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
                        disabled={!newPostContent.trim() && !newPostImage}
                        className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors flex items-center"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        發佈
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Feed */}
            <div className="space-y-4">
              {visiblePosts.length === 0 && (
                <div className="text-center py-10">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">還沒有任何動態</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">成為第一個分享寵物可愛瞬間的人吧！</p>
                </div>
              )}
              {visiblePosts.map(post => (
                <div key={post.id} className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold">
                      {post.userName?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">{post.userName}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDistanceToNow(new Date(post.date), { addSuffix: true, locale: zhTW })}
                      </p>
                    </div>

                    {/* 檢舉/封鎖選單按鈕（不顯示自己的貼文） */}
                    {post.userId !== user?.id && (
                      <div className="relative">
                        <button
                          onClick={() => setActionMenuPostId(actionMenuPostId === post.id ? null : post.id)}
                          className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* 下拉選單 */}
                        {actionMenuPostId === post.id && (
                          <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-30 min-w-[140px]">
                            <button
                              onClick={() => {
                                setReportTargetPostId(post.id);
                                setIsReportModalOpen(true);
                                setActionMenuPostId(null);
                              }}
                              className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              <Flag className="w-4 h-4 mr-2" />檢舉貼文
                            </button>
                            <button
                              onClick={() => handleBlockUser(post.userId || '')}
                              className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              <Ban className="w-4 h-4 mr-2" />封鎖此用戶
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed mb-4">{post.content}</p>

                  {post.imageUrl && (
                    <div className="rounded-2xl overflow-hidden mb-4">
                      <img src={post.imageUrl} alt="Post content" className="w-full h-auto object-cover" />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center space-x-2 transition-colors ${post.likedBy?.includes(user?.id || '') ? 'text-red-500' : 'text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400'}`}
                    >
                      <Heart className={`w-5 h-5 ${post.likedBy?.includes(user?.id || '') ? 'fill-current' : ''}`} />
                      <span className="text-sm">{post.likes}</span>
                    </button>
                    <button
                      onClick={() => setCommentingOn(commentingOn === post.id ? null : post.id)}
                      className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span className="text-sm">{post.comments}</span>
                    </button>
                    <button
                      onClick={() => handleShare(post.id)}
                      className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400 transition-colors"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>

                  {commentingOn === post.id && (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <div className="space-y-3 mb-3">
                        {post.commentsList?.map((comment: any) => (
                          <div key={comment.id} className="flex space-x-2">
                            <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                              {comment.userName?.charAt(0)}
                            </div>
                            <div className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-2xl px-3 py-2">
                              <p className="text-xs font-bold text-gray-900 dark:text-white">{comment.userName}</p>
                              <p className="text-sm text-gray-800 dark:text-gray-200">{comment.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <form onSubmit={(e) => handleCommentSubmit(e, post.id)} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={commentContent}
                          onChange={(e) => setCommentContent(e.target.value)}
                          placeholder="留言..."
                          className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-full px-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                        />
                        <button
                          type="submit"
                          disabled={!commentContent.trim()}
                          className="p-2 bg-indigo-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex h-full space-x-4">
            {/* Friends List */}
            <div className="w-1/3 bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 overflow-y-auto flex flex-col">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">好友列表</h2>
              {friends.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">目前沒有好友</p>
              ) : (
                <div className="space-y-2 flex-1 overflow-y-auto">
                  {friends.map(friend => (
                    <button
                      key={friend.id}
                      onClick={() => setSelectedFriendId(friend.id)}
                      className={`w-full flex items-center space-x-3 p-3 rounded-2xl transition-colors ${selectedFriendId === friend.id
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent'
                        }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold flex-shrink-0">
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

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              {selectedFriendId ? (
                <>
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      與 {friends.find(f => f.id === selectedFriendId)?.name} 聊天
                    </h3>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {chatMessages.map(msg => {
                      const isMe = msg.sender_id === user?.id;
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`flex max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-xs ${isMe ? 'ml-2 bg-indigo-500' : 'mr-2 bg-gray-400'}`}>
                              {msg.senderName?.charAt(0) || 'U'}
                            </div>
                            <div>
                              {!isMe && <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 ml-1">{msg.senderName}</p>}
                              <div className={`p-3 rounded-2xl text-sm ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-tl-none'}`}>
                                {msg.content}
                              </div>
                              <p className={`text-[10px] text-gray-400 mt-1 ${isMe ? 'text-right mr-1' : 'ml-1'}`}>
                                {formatDistanceToNow(new Date(msg.date), { addSuffix: true, locale: zhTW })}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatEndRef} />
                  </div>

                  <div className="p-3 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <form onSubmit={handleChatSubmit} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newChatMessage}
                        onChange={(e) => setNewChatMessage(e.target.value)}
                        placeholder="輸入訊息..."
                        className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-full px-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                      />
                      <button
                        type="submit"
                        disabled={!newChatMessage.trim()}
                        className="p-2 bg-indigo-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors flex-shrink-0"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  請選擇左側好友開始聊天
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Search Users Modal */}
      {isSearchModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md overflow-hidden shadow-xl flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">尋找好友</h2>
              <button onClick={() => setIsSearchModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4">
              <div className="flex space-x-2 mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="輸入用戶名稱..."
                  className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
                />
                <button
                  onClick={handleSearchUsers}
                  className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-64">
                {searchResults.map(resultUser => {
                  const isAlreadyFriend = friends.some(f => f.id === resultUser.id) || resultUser.isFriend;
                  const isSelf = resultUser.id === user?.id;

                  return (
                    <div key={resultUser.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                          {resultUser.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{resultUser.name}</p>
                        </div>
                      </div>
                      {!isSelf && (
                        <button
                          onClick={() => !isAlreadyFriend && handleAddFriend(resultUser.id)}
                          disabled={isAlreadyFriend}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium ${isAlreadyFriend
                            ? 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                            : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50'
                            }`}
                        >
                          {isAlreadyFriend ? '已是好友' : '加好友'}
                        </button>
                      )}
                    </div>
                  );
                })}
                {searchResults.length === 0 && searchQuery && (
                  <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">找不到相關用戶</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 檢舉貼文彈窗（Apple/Google UGC 合規） */}
      {isReportModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-xl">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />檢舉貼文
              </h2>
              <button onClick={() => setIsReportModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">請選擇檢舉原因：</p>
              {[
                { id: 'inappropriate', label: '不當內容' },
                { id: 'harassment', label: '騷擾或霸凌' },
                { id: 'spam', label: '垃圾訊息或廣告' },
                { id: 'other', label: '其他' },
              ].map(option => (
                <button
                  key={option.id}
                  onClick={() => setReportReason(option.id)}
                  className={`w-full text-left p-3 rounded-xl border-2 text-sm transition-colors ${reportReason === option.id
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 font-medium'
                      : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-red-300'
                    }`}
                >
                  {option.label}
                </button>
              ))}

              {reportReason === 'other' && (
                <textarea
                  value={reportDetail}
                  onChange={e => setReportDetail(e.target.value)}
                  placeholder="請說明具體原因..."
                  className="w-full bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  rows={3}
                />
              )}

              <button
                onClick={handleReportPost}
                disabled={!reportReason}
                className="w-full py-3 bg-red-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-700 transition-colors"
              >
                提交檢舉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
