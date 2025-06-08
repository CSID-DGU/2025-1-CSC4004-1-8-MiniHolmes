import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPlacements } from '../services/api';
import './style/MyPage.css';

const MyPage = ({ user, onLogout }) => {
  const [savedPlacements, setSavedPlacements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "마이페이지 - 미니홈즈";
    loadSavedPlacements();
  }, []);

  const loadSavedPlacements = async () => {
    try {
      setIsLoading(true);
      const placements = await getPlacements();
      setSavedPlacements(placements);
    } catch (error) {
      console.error('저장된 배치를 불러오는데 실패했습니다:', error);
      setSavedPlacements([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartNewDesign = () => {
    localStorage.removeItem('roomSize');
    localStorage.removeItem('placement');
    navigate('/miniholmes/step1');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/miniholmes/mypage');
  };

  const handleViewPlacement = (placement) => {
    // 저장된 배치를 localStorage에 저장하고 visualizer로 이동
    localStorage.setItem('placement', JSON.stringify(placement));
    
    // 저장된 배치에 roomConfiguration이 있다면 복원
    if (placement.roomConfiguration && placement.roomConfiguration.roomSize) {
      localStorage.setItem('roomSize', JSON.stringify({
        width: placement.roomConfiguration.roomSize.width || 400,
        length: placement.roomConfiguration.roomSize.depth || 400,
        height: placement.roomConfiguration.roomSize.height || 240
      }));
      localStorage.setItem('doorSizes', JSON.stringify(placement.roomConfiguration.doors || []));
      localStorage.setItem('windowSizes', JSON.stringify(placement.roomConfiguration.windows || []));
      localStorage.setItem('partitionZones', JSON.stringify(placement.roomConfiguration.partitions || []));
    }
    
    navigate('/miniholmes/visualizer');
  };

  return (
    <div className="mypage-container">
      <div className="mypage-content">
        {/* 프로필 섹션 */}
        <div className="profile-section">
          <div className="profile-header">
            <div className="profile-info">
              <h1 className="mypage-title">
                안녕하세요, <span className="username">{user.userId || user.name || user.email}</span>님!
              </h1>
              <p className="welcome-text">미니홈즈에서 나만의 완벽한 공간을 만들어보세요.</p>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              로그아웃
            </button>
          </div>
        </div>

        {/* 퀵 액션 섹션 */}
        <div className="quick-actions">
          <button onClick={handleStartNewDesign} className="action-btn primary">
            새로운 방 디자인 시작하기
          </button>
          <button onClick={() => navigate('/miniholmes/about')} className="action-btn secondary">
            서비스 소개 보기
          </button>
        </div>

        {/* 저장된 배치 섹션 */}
        <div className="saved-layouts-section">
          <h2 className="section-title">저장된 방 배치</h2>
          
          {isLoading ? (
            <div className="loading-state">
              <p>저장된 배치를 불러오는 중...</p>
            </div>
          ) : savedPlacements.length > 0 ? (
            <div className="layouts-grid">
              {savedPlacements.map((placement) => (
                <div key={placement._id} className="layout-card">
                  <div className="layout-info">
                    <h3 className="layout-name">{placement.name}</h3>
                    <p className="layout-date">
                      {new Date(placement.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                    <p className="layout-description">
                      {placement.furniture?.length || 0}개의 가구
                    </p>
                  </div>
                  <button 
                    onClick={() => handleViewPlacement(placement)}
                    className="view-btn"
                  >
                    보기
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>아직 저장된 방 배치가 없습니다.</p>
              <p>새로운 디자인을 시작해보세요!</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default MyPage;