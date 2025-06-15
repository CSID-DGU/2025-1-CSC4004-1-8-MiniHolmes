import React, { useState, useEffect } from 'react';
import { togglePostLike, addComment, deleteComment, getCommunityPost, deletePost } from '../services/communityService';
import RoomVisualizerModal from './RoomVisualizerModal';
import './CommunityPost.css';

const CommunityPost = ({ post, currentUser, onPostUpdate }) => {
  const [isLiked, setIsLiked] = useState(
    currentUser ? post.likes.includes(currentUser.id) : false
  );
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState(post.comments || []);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showVisualizerModal, setShowVisualizerModal] = useState(false);
  const [completePostData, setCompletePostData] = useState(null);
  const [loadingPostData, setLoadingPostData] = useState(false);
  const [userCache, setUserCache] = useState({});

  // Load user cache from localStorage on mount
  useEffect(() => {
    const savedCache = localStorage.getItem('communityUserCache');
    if (savedCache) {
      try {
        setUserCache(JSON.parse(savedCache));
      } catch (e) {
        console.error('Error loading user cache:', e);
      }
    }
  }, []);


  // Generate a temporary readable username until backend is fixed
  const getTemporaryUsername = (userId) => {
    if (userCache[userId]) {
      return userCache[userId];
    }

    // Generate a consistent readable name based on userId
    const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eva', 'Frank', 'Grace', 'Henry'];
    const index = parseInt(userId.substring(0, 2), 16) % names.length;
    const number = parseInt(userId.substring(2, 4), 16) % 99 + 1;
    const tempName = `${names[index]}${number}`;
    
    // Cache it
    const newCache = { ...userCache, [userId]: tempName };
    setUserCache(newCache);
    localStorage.setItem('communityUserCache', JSON.stringify(newCache));
    
    return tempName;
  };

  // Helper function to get the proper display username
  const getDisplayUsername = (username, postUserId) => {
    if (!username) return 'Anonymous';
    
    // If this is the current user's post, use their actual username from localStorage
    if (currentUser && postUserId === currentUser.id) {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          return userData.username || userData.userId || userData.name || userData.email || 'User';
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }
    }
    
    // Check if the username looks like a MongoDB ObjectId
    if (typeof username === 'string' && username.length === 24 && /^[0-9a-f]{24}$/.test(username)) {
      // Return a temporary readable username until backend is fixed
      return getTemporaryUsername(username);
    }
    
    // For regular usernames, return as-is
    return username;
  };

  const handleLike = async () => {
    if (!currentUser) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const response = await togglePostLike(post._id);
      setIsLiked(response.isLiked);
      setLikesCount(response.likesCount);
    } catch (error) {
      console.error('좋아요 처리 실패:', error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert('로그인이 필요합니다.');
      return;
    }
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      const response = await addComment(post._id, newComment.trim());
      setComments([...comments, response.comment]);
      setNewComment('');
      if (onPostUpdate) {
        onPostUpdate(post._id, { commentsCount: comments.length + 1 });
      }
    } catch (error) {
      console.error('댓글 추가 실패:', error);
      alert('댓글 추가에 실패했습니다.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;

    try {
      await deleteComment(post._id, commentId);
      setComments(comments.filter(comment => comment._id !== commentId));
      if (onPostUpdate) {
        onPostUpdate(post._id, { commentsCount: comments.length - 1 });
      }
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      alert('댓글 삭제에 실패했습니다.');
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('포스트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

    try {
      await deletePost(post._id);
      if (onPostUpdate) {
        onPostUpdate(post._id, { deleted: true });
      }
      alert('포스트가 삭제되었습니다.');
    } catch (error) {
      console.error('포스트 삭제 실패:', error);
      alert('포스트 삭제에 실패했습니다.');
    }
  };

  const handleViewLayout = async () => {
    console.log('Opening 3D modal for post:', post.title);
    
    // If we already have complete post data, use it
    if (completePostData && completePostData.placementData) {
      console.log('Using cached complete post data');
      setShowVisualizerModal(true);
      return;
    }
    
    // Fetch complete post data including placementData
    try {
      setLoadingPostData(true);
      console.log('Fetching complete post data for ID:', post._id);
      
      const fullPostData = await getCommunityPost(post._id);
      console.log('Received complete post data:', fullPostData);
      console.log('Furniture data:', fullPostData.placementData?.furniture);
      
      setCompletePostData(fullPostData);
      setShowVisualizerModal(true);
    } catch (error) {
      console.error('Failed to fetch complete post data:', error);
      alert('포스트 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoadingPostData(false);
    }
  };

  const handleCloseModal = () => {
    setShowVisualizerModal(false);
  };

  return (
    <div className="community-post">
      {/* 포스트 헤더 */}
      <div className="post-header">
        <div className="user-info">
          <div className="user-avatar">
            {getDisplayUsername(post.username, post.user).charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <span className="username">{getDisplayUsername(post.username, post.user)}</span>
            <span className="post-date">
              {new Date(post.createdAt).toLocaleDateString('ko-KR')}
            </span>
          </div>
        </div>
        {currentUser && post.user === currentUser.id && (
          <button 
            className="delete-post-btn"
            onClick={handleDeletePost}
            title="포스트 삭제"
          >
            🗑️
          </button>
        )}
      </div>

      {/* 포스트 이미지 영역 (3D 뷰어 대신 플레이스홀더) */}
      <div className="post-image">
        <div 
          className="layout-preview" 
          onClick={handleViewLayout}
          style={{ cursor: loadingPostData ? 'wait' : 'pointer' }}
        >
          <div className="preview-content">
            <h3>{post.title}</h3>
            <p>🏠 3D 미리보기 열기</p>
            <div className="layout-info">
              <span>방 크기: {post.roomDimensions?.width}x{post.roomDimensions?.depth}cm</span>
            </div>
          </div>
        </div>
      </div>

      {/* 포스트 액션 */}
      <div className="post-actions">
        <div className="action-buttons">
          <button 
            className={`like-btn ${isLiked ? 'liked' : ''}`}
            onClick={handleLike}
            disabled={!currentUser}
          >
            <span className="heart-icon">{isLiked ? '❤️' : '🤍'}</span>
          </button>
          <button 
            className="comment-btn"
            onClick={() => setShowComments(!showComments)}
          >
            💬
          </button>
          <button 
            className="view-btn" 
            onClick={handleViewLayout}
            disabled={loadingPostData}
          >
            {loadingPostData ? '⏳' : '👁️'}
          </button>
        </div>
        <div className="likes-count">
          좋아요 {likesCount}개
        </div>
      </div>

      {/* 포스트 내용 */}
      <div className="post-content">
        <div className="post-description">
          <span className="username">{getDisplayUsername(post.username, post.user)}</span>
          {post.description && <span className="description">{post.description}</span>}
        </div>
        {post.tags && post.tags.length > 0 && (
          <div className="post-tags">
            {post.tags.map((tag, index) => (
              <span key={index} className="tag">#{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* 댓글 영역 */}
      {showComments && (
        <div className="comments-section">
          <div className="comments-list">
            {comments.map((comment) => (
              <div key={comment._id} className="comment">
                <div className="comment-content">
                  <span className="comment-username">{getDisplayUsername(comment.username, comment.user)}</span>
                  <span className="comment-text">{comment.content}</span>
                </div>
                <div className="comment-meta">
                  <span className="comment-date">
                    {new Date(comment.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                  {currentUser && comment.user === currentUser.id && (
                    <button 
                      className="delete-comment-btn"
                      onClick={() => handleDeleteComment(comment._id)}
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {currentUser && (
            <form className="comment-form" onSubmit={handleAddComment}>
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="댓글을 입력하세요..."
                maxLength={500}
                disabled={isSubmittingComment}
              />
              <button 
                type="submit" 
                disabled={!newComment.trim() || isSubmittingComment}
                className="submit-comment-btn"
              >
                {isSubmittingComment ? '등록중...' : '등록'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* 3D 시각화 모달 */}
      <RoomVisualizerModal 
        post={completePostData || post}
        isOpen={showVisualizerModal}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default CommunityPost;
