import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { Heart, MessageCircle, Share2, MoreVertical, Flag, Ban, Trash2, Send } from 'lucide-react';
import { Post, User } from '../../types';

interface PostCardProps {
    post: Post;
    currentUser: User | null;
    onLike: (postId: string) => void;
    onComment: (postId: string, content: string) => void;
    onShare: (postId: string) => void;
    onReport: (postId: string) => void;
    onBlock: (userId: string) => void;
    onDelete?: (postId: string) => void;
}

export function PostCard({
    post,
    currentUser,
    onLike,
    onComment,
    onShare,
    onReport,
    onBlock,
    onDelete
}: PostCardProps) {
    const [showComments, setShowComments] = useState(false);
    const [commentContent, setCommentContent] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [likeAnimate, setLikeAnimate] = useState(false);
    const [showAllComments, setShowAllComments] = useState(false);

    const isLiked = post.likedBy?.includes(currentUser?.id || '');
    const isMine = post.userId === currentUser?.id;

    const handleLikeClick = () => {
        if (!isLiked) {
            setLikeAnimate(true);
            setTimeout(() => setLikeAnimate(false), 500); // 移除動畫狀態
        }
        onLike(post.id);
    };

    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (commentContent.trim()) {
            onComment(post.id, commentContent);
            setCommentContent('');
        }
    };

    // 留言收合邏輯：如果沒展開全部，只顯示最後 2 則
    const displayComments = showAllComments
        ? post.commentsList
        : post.commentsList?.slice(-2);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
            <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {post.userName?.charAt(0) || 'U'}
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">{post.userName}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDistanceToNow(new Date(post.date), { addSuffix: true, locale: zhTW })}
                    </p>
                </div>

                {/* ⋯ 選單 */}
                <div className="relative">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 transition-colors"
                    >
                        <MoreVertical className="w-4 h-4" />
                    </button>

                    {isMenuOpen && (
                        <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-30 min-w-[140px]">
                            {isMine ? (
                                <button
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        onDelete?.(post.id);
                                    }}
                                    className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />刪除貼文
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            onReport(post.id);
                                        }}
                                        className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    >
                                        <Flag className="w-4 h-4 mr-2" />檢舉貼文
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            onBlock(post.userId);
                                        }}
                                        className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <Ban className="w-4 h-4 mr-2" />封鎖此用戶
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed mb-4 whitespace-pre-wrap">
                {post.content}
            </p>

            {post.imageUrl && (
                <div className="rounded-2xl overflow-hidden mb-4">
                    <img src={post.imageUrl} alt="Post image" className="w-full h-auto object-cover max-h-[500px]" loading="lazy" />
                </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                    onClick={handleLikeClick}
                    className={`flex items-center space-x-2 transition-colors ${isLiked ? 'text-red-500' : 'text-gray-500 dark:text-gray-400 hover:text-red-500'
                        }`}
                >
                    {/* P1: 按讚動畫 */}
                    <Heart
                        className={`w-5 h-5 transition-transform duration-300 ${isLiked ? 'fill-current' : ''
                            } ${likeAnimate ? 'scale-125' : 'scale-100'}`}
                    />
                    <span className="text-sm font-medium">{post.likes}</span>
                </button>
                <button
                    onClick={() => setShowComments(!showComments)}
                    className={`flex items-center space-x-2 transition-colors ${showComments ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-indigo-500'
                        }`}
                >
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">{post.comments}</span>
                </button>
                <button
                    onClick={() => onShare(post.id)}
                    className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-green-500 transition-colors"
                >
                    <Share2 className="w-5 h-5" />
                </button>
            </div>

            {showComments && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="space-y-3 mb-4">
                        {/* P1: 留言收合 */}
                        {(post.commentsList?.length || 0) > 2 && !showAllComments && (
                            <button
                                onClick={() => setShowAllComments(true)}
                                className="text-sm text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 p-1 w-full text-left font-medium"
                            >
                                查看全部 {post.commentsList?.length} 則留言
                            </button>
                        )}

                        {displayComments?.map((comment) => (
                            <div key={comment.id} className="flex space-x-2">
                                <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 flex-shrink-0 mt-1">
                                    {comment.userName?.charAt(0)}
                                </div>
                                <div className="flex-1 bg-gray-50 dark:bg-gray-700/50 rounded-2xl px-3 py-2">
                                    <p className="text-xs font-bold text-gray-900 dark:text-white mb-0.5">{comment.userName}</p>
                                    <p className="text-sm text-gray-800 dark:text-gray-200">{comment.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <form onSubmit={handleCommentSubmit} className="flex items-center space-x-2">
                        <input
                            type="text"
                            value={commentContent}
                            onChange={(e) => setCommentContent(e.target.value)}
                            placeholder="新增留言..."
                            className="flex-1 bg-gray-50 dark:bg-gray-700/80 rounded-full px-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                        />
                        <button
                            type="submit"
                            disabled={!commentContent.trim()}
                            className="p-2 bg-indigo-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors flex-shrink-0 shadow-sm"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
