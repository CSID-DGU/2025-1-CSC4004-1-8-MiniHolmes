// 250615 배치 저장 개수 제한 및 제거 기능 추가

import React from 'react';

const SaveLoadPanel = ({
  isLoadingPlacements,
  savedPlacements,
  onSavePlacement,
  onLoadPlacements,
  onLoadPlacement,
  onDeletePlacement,
  onResetCamera,
  onTopDownView,
  onEastView,
  onWestView,
  onSouthView,
  onNorthView,
  onRotateCamera,
  isRotating,
  onToggleOrbit,
  isOrbiting
}) => {
  return (
    <div style={{ 
      padding: '1rem'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* 현재 배치 저장 */}
        <div style={{
          padding: '1rem',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          border: '1px solid #ddd',
          fontSize: '0.85rem'
        }}>
          <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#333' }}>💾 배치 저장</strong>
          <button 
            onClick={onSavePlacement}
            disabled={savedPlacements.length >= 5}
            style={{
              width: '100%',
              padding: '0.6rem 0.8rem',
              backgroundColor: savedPlacements.length >= 5 ? '#cccccc' : '#4CAF50',
              color: savedPlacements.length >= 5 ? '#666666' : 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: 'bold',
              cursor: savedPlacements.length >= 5 ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => {
              if (savedPlacements.length < 5) {
                e.target.style.backgroundColor = '#45a049';
              }
            }}
            onMouseOut={(e) => {
              if (savedPlacements.length < 5) {
                e.target.style.backgroundColor = '#4CAF50';
              }
            }}
            title={savedPlacements.length >= 5 ? '최대 5개의 배치만 저장할 수 있습니다' : ''}
          >
            {savedPlacements.length >= 5 ? '🚫 저장 불가 (최대 5개)' : '✅ 현재 배치 저장하기'}
          </button>
        </div>

        {/* 저장된 배치 목록 */}
        <div style={{
          padding: '1rem',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          border: '1px solid #ddd',
          fontSize: '0.85rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <strong style={{ color: '#333' }}>📂 저장된 배치</strong>
              <span style={{ 
                fontSize: '0.7rem', 
                color: savedPlacements.length >= 5 ? '#f44336' : '#666',
                fontWeight: savedPlacements.length >= 5 ? 'bold' : 'normal'
              }}>
                ({savedPlacements.length}/5)
                {savedPlacements.length >= 5 && ' - 최대 개수 도달'}
              </span>
            </div>
            <button 
              onClick={onLoadPlacements}
              style={{
                padding: '0.25rem 0.5rem',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              🔄 새로고침
            </button>
          </div>
          
          {isLoadingPlacements ? (
            <p style={{ textAlign: 'center', color: '#888', fontSize: '0.8rem' }}>불러오는 중...</p>
          ) : savedPlacements.length > 0 ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.5rem', 
              maxHeight: 'calc(100vh - 300px)', 
              overflowY: 'auto' 
            }}>
              {savedPlacements.map((placement) => (
                <div 
                  key={placement._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    width: '100%'
                  }}
                >
                  <button
                    onClick={() => onLoadPlacement(placement)}
                    style={{
                      flex: '1',
                      textAlign: 'left',
                      padding: '0.6rem 0.8rem',
                      backgroundColor: '#fff',
                      border: '1px solid #eee',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#fff'}
                  >
                    <div style={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#333' }}>
                      📋 {placement.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#888' }}>
                      {new Date(placement.createdAt).toLocaleDateString()}
                    </div>
                  </button>
                  <button
                    onClick={() => onDeletePlacement(placement._id)}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      minWidth: '30px',
                      height: '30px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#d32f2f'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#f44336'}
                    title="배치 삭제"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#888', fontSize: '0.8rem' }}>저장된 배치가 없습니다.</p>
          )}
        </div>

        {/* 카메라 컨트롤 */}
        <div style={{
          padding: '1rem',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          border: '1px solid #ddd',
          fontSize: '0.85rem'
        }}>
          <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#333' }}>📷 카메라 컨트롤</strong>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {/* 주요 카메라 컨트롤 */}
            <div style={{
              padding: '0.6rem 0.8rem',
              backgroundColor: '#fff',
              border: '1px solid #eee',
              borderRadius: '6px'
            }}>
              <button 
                onClick={onTopDownView}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  marginBottom: '0.25rem'
                }}
              >
                🔝 탑다운 뷰
              </button>
              
              <button 
                onClick={onRotateCamera}
                disabled={isRotating || isOrbiting}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  backgroundColor: isRotating || isOrbiting ? '#ffcc80' : '#FF9800',
                  color: isRotating || isOrbiting ? '#e65100' : 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  cursor: isRotating || isOrbiting ? 'not-allowed' : 'pointer',
                  marginBottom: '0.25rem'
                }}
              >
                {isRotating ? '🔄 회전 중...' : '🔄 카메라 회전'}
              </button>
              
              <button 
                onClick={onToggleOrbit}
                disabled={isRotating}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  backgroundColor: isRotating ? '#ce93d8' : isOrbiting ? '#7B1FA2' : '#9C27B0',
                  color: isRotating ? '#4a148c' : 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  cursor: isRotating ? 'not-allowed' : 'pointer'
                }}
              >
                {isOrbiting ? '🌀 궤도 중지' : '🌀 궤도 회전'}
              </button>
            </div>
            
            {/* 방향별 뷰 컨트롤 */}
            <div style={{
              padding: '0.6rem 0.8rem',
              backgroundColor: '#fff',
              border: '1px solid #eee',
              borderRadius: '6px'
            }}>
              <div style={{ fontSize: '0.8rem', color: '#555', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                🧭 방향별 뷰
              </div>
              
              {/* 북쪽 뷰 */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.25rem' }}>
                <button 
                  onClick={onNorthView}
                  style={{
                    padding: '0.4rem 0.8rem',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  ↑ 북쪽
                </button>
              </div>
              
              {/* 동서 뷰 */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <button 
                  onClick={onWestView}
                  style={{
                    padding: '0.4rem 0.8rem',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  ← 서쪽
                </button>
                <button 
                  onClick={onEastView}
                  style={{
                    padding: '0.4rem 0.8rem',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  동쪽 →
                </button>
              </div>
              
              {/* 남쪽 뷰 */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button 
                  onClick={onSouthView}
                  style={{
                    padding: '0.4rem 0.8rem',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  ↓ 남쪽
                </button>
              </div>
            </div>
            
            {/* 카메라 리셋 */}
            <button 
              onClick={onResetCamera}
              style={{
                width: '100%',
                padding: '0.5rem',
                backgroundColor: '#757575',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              🔄 카메라 리셋
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaveLoadPanel; 
