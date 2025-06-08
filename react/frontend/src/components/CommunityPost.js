import React, { useState } from 'react';
import { togglePostLike, addComment, deleteComment, getCommunityPost } from '../services/communityService';
import RoomVisualizerModal from './RoomVisualizerModal';
import './CommunityPost.css';

const CommunityPost = ({ post, currentUser, onPostUpdate }) => {
  const [isLiked, setIsLiked] = useState(
    currentUser ? post.likes.includes(currentUser.userId) : false
  );
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState(post.comments || []);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showVisualizerModal, setShowVisualizerModal] = useState(false);
  const [completePostData, setCompletePostData] = useState(null);
  const [loadingPostData, setLoadingPostData] = useState(false);

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
            {post.username.charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <span className="username">{post.username}</span>
            <span className="post-date">
              {new Date(post.createdAt).toLocaleDateString('ko-KR')}
            </span>
          </div>
        </div>
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
          <span className="username">{post.username}</span>
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
                  <span className="comment-username">{comment.username}</span>
                  <span className="comment-text">{comment.content}</span>
                </div>
                <div className="comment-meta">
                  <span className="comment-date">
                    {new Date(comment.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                  {currentUser && comment.user === currentUser.userId && (
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
