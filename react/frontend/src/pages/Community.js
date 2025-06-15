import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import CommunityPost from '../components/CommunityPost';
import { getCommunityPosts, createCommunityPost } from '../services/communityService';
import { getPlacements, getFurnitureById } from '../services/api';
import './style/Community.css';

const Community = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({
        title: '',
        description: '',
        tags: '',
        selectedPlacement: null
    });
    const [myPlacements, setMyPlacements] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "커뮤니티 - 미니홈즈";
        
        // 사용자 정보 확인
        const userData = localStorage.getItem('user');
        if (userData) {
            setCurrentUser(JSON.parse(userData));
        }

        loadPosts();
    }, []);

    const loadPosts = async (page = 1) => {
        try {
            setLoading(true);
            const response = await getCommunityPosts(page, 10);
            
            if (page === 1) {
                setPosts(response.posts);
            } else {
                setPosts(prev => [...prev, ...response.posts]);
            }
            
            setHasMore(response.pagination.page < response.pagination.pages);
            setCurrentPage(page);
        } catch (error) {
            console.error('포스트 로딩 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMorePosts = () => {
        if (!loading && hasMore) {
            loadPosts(currentPage + 1);
        }
    };

    const handleCreatePost = () => {
        if (!currentUser) {
            alert('로그인이 필요합니다.');
            navigate('/miniholmes/mypage');
            return;
        }
        
        loadMyPlacements();
        setShowCreateModal(true);
    };

    const loadMyPlacements = async () => {
        try {
            const placements = await getPlacements();
            setMyPlacements(placements);
        } catch (error) {
            console.error('내 배치 불러오기 실패:', error);
            setMyPlacements([]);
        }
    };

    const handleSubmitPost = async (e) => {
        e.preventDefault();
        
        if (!createForm.title.trim() || !createForm.selectedPlacement) {
            alert('제목과 배치를 선택해주세요.');
            return;
        }

        try {
            // Get complete room configuration from localStorage
            const roomSize = JSON.parse(localStorage.getItem('roomSize') || '{}');
            const doorSizes = JSON.parse(localStorage.getItem('doorSizes') || '[]');
            const windowSizes = JSON.parse(localStorage.getItem('windowSizes') || '[]');
            const partitionZones = JSON.parse(localStorage.getItem('partitionZones') || '[]');
            
            // Ensure numeric types for room dimensions
            const roomDimensions = {
                width: Number(roomSize.width) || 400,
                depth: Number(roomSize.length || roomSize.depth) || 400,
                height: Number(roomSize.height) || 240
            };

            // Expand furniture data with full furniture details
            const furnitureData = createForm.selectedPlacement.furniture || [];
            const expandedFurniture = await Promise.all(
                furnitureData.map(async (furnitureItem) => {
                    try {
                        // Get full furniture details using furnitureId
                        const furnitureDetails = await getFurnitureById(furnitureItem.furnitureId);
                        if (furnitureDetails) {
                            return {
                                ...furnitureItem,
                                ...furnitureDetails,
                                // Preserve positioning data from placement
                                position: furnitureItem.position,
                                rotation: furnitureItem.rotation,
                                scale: furnitureItem.scale || [1, 1, 1]
                            };
                        } else {
                            console.warn('Could not fetch furniture details for ID:', furnitureItem.furnitureId);
                            return furnitureItem;
                        }
                    } catch (error) {
                        console.error('Error fetching furniture details:', error);
                        return furnitureItem;
                    }
                })
            );

            const postData = {
                title: createForm.title.trim(),
                description: createForm.description.trim(),
                placementData: {
                    furniture: expandedFurniture,
                    name: createForm.selectedPlacement.name
                },
                roomDimensions,
                roomConfiguration: {
                    roomSize: roomDimensions,
                    doors: doorSizes.map(door => ({
                        ...door,
                        width: Number(door.width),
                        height: Number(door.height),
                        offset: Number(door.offset)
                    })),
                    windows: windowSizes.map(window => ({
                        ...window,
                        width: Number(window.width),
                        height: Number(window.height),
                        altitude: Number(window.altitude),
                        offset: Number(window.offset)
                    })),
                    partitions: partitionZones
                },
                tags: createForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
            };

            console.log('Sending complete room data:', postData);

            await createCommunityPost(postData);
            
            // 폼 초기화 및 모달 닫기
            setCreateForm({
                title: '',
                description: '',
                tags: '',
                selectedPlacement: null
            });
            setShowCreateModal(false);
            
            // 포스트 목록 새로고침
            loadPosts();
        } catch (error) {
            console.error('포스트 생성 실패:', error);
            alert('포스트 생성에 실패했습니다.');
        }
    };

    const handlePostUpdate = (postId, updates) => {
        if (updates.deleted) {
            // Remove the post from the list if it was deleted
            setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
        } else {
            // Update the post with new data
            setPosts(prevPosts => 
                prevPosts.map(post => 
                    post._id === postId ? { ...post, ...updates } : post
                )
            );
        }
    };

    return (
        <div className="community-container">
            <div className="community-header">
                <h1 className="community-title">커뮤니티</h1>
                <p className="community-subtitle">다른 사용자들의 멋진 방 배치를 구경하고 영감을 받아보세요</p>
                
                {currentUser && (
                    <button 
                        className="create-post-btn"
                        onClick={handleCreatePost}
                    >
                        내 배치 공유하기
                    </button>
                )}
            </div>

            <div className="community-feed">
                {posts.map((post) => (
                    <CommunityPost 
                        key={post._id} 
                        post={post} 
                        currentUser={currentUser}
                        onPostUpdate={handlePostUpdate}
                    />
                ))}
                
                {loading && (
                    <div className="loading-state">
                        포스트를 불러오는 중...
                    </div>
                )}
                
                {!loading && posts.length === 0 && (
                    <div className="empty-state">
                        <p>아직 공유된 배치가 없습니다.</p>
                        <p>첫 번째로 배치를 공유해보세요!</p>
                    </div>
                )}
                
                {!loading && hasMore && posts.length > 0 && (
                    <button 
                        className="load-more-btn"
                        onClick={loadMorePosts}
                    >
                        더 보기
                    </button>
                )}
            </div>

            {/* 포스트 생성 모달 */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>배치 공유하기</h2>
                            <button 
                                className="close-btn"
                                onClick={() => setShowCreateModal(false)}
                            >
                                ✕
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmitPost} className="create-form">
                            <div className="form-group">
                                <label>제목 *</label>
                                <input
                                    type="text"
                                    value={createForm.title}
                                    onChange={(e) => setCreateForm({...createForm, title: e.target.value})}
                                    placeholder="배치에 대한 제목을 입력하세요"
                                    maxLength={100}
                                    required
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>설명</label>
                                <textarea
                                    value={createForm.description}
                                    onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                                    placeholder="배치에 대한 설명을 입력하세요"
                                    maxLength={500}
                                    rows={3}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>태그</label>
                                <input
                                    type="text"
                                    value={createForm.tags}
                                    onChange={(e) => setCreateForm({...createForm, tags: e.target.value})}
                                    placeholder="태그를 쉼표로 구분하여 입력 (예: 모던, 심플, 원룸)"
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>공유할 배치 선택 *</label>
                                <div className="placement-list">
                                    {myPlacements.map((placement) => (
                                        <div 
                                            key={placement._id}
                                            className={`placement-item ${
                                                createForm.selectedPlacement?._id === placement._id ? 'selected' : ''
                                            }`}
                                            onClick={() => setCreateForm({...createForm, selectedPlacement: placement})}
                                        >
                                            <h4>{placement.name}</h4>
                                            <p>{new Date(placement.createdAt).toLocaleDateString('ko-KR')}</p>
                                        </div>
                                    ))}
                                    
                                    {myPlacements.length === 0 && (
                                        <p className="no-placements">
                                            저장된 배치가 없습니다. 먼저 방 배치를 저장해주세요.
                                        </p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="form-actions">
                                <button 
                                    type="button" 
                                    className="cancel-btn"
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    취소
                                </button>
                                <button 
                                    type="submit" 
                                    className="submit-btn"
                                    disabled={!createForm.title.trim() || !createForm.selectedPlacement}
                                >
                                    공유하기
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Community;
