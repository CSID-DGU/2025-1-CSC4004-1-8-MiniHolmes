import React from 'react';

const SaveLoadPanel = ({
  isLoadingPlacements,
  savedPlacements,
  onSavePlacement,
  onLoadPlacements,
  onLoadPlacement,
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
    <div className="h-full p-4 bg-gray-50 border-l overflow-y-auto">
      <div className="space-y-4">
        {/* 현재 배치 저장 */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-bold mb-2">현재 배치 저장</h3>
          <button 
            onClick={onSavePlacement}
            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            저장하기
          </button>
        </div>

        {/* 카메라 컨트롤 */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-bold mb-2">카메라 컨트롤</h3>
          
          <div className="space-y-2">
            {/* 탑다운 뷰 버튼 */}
            <button 
              onClick={onTopDownView}
              className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              탑다운 뷰
            </button>
            
            {/* 카메라 회전 버튼 */}
            <button 
              onClick={onRotateCamera}
              disabled={isRotating || isOrbiting}
              className={`w-full font-bold py-2 px-4 rounded ${
                isRotating || isOrbiting
                  ? 'bg-orange-300 text-orange-700 cursor-not-allowed' 
                  : 'bg-orange-500 hover:bg-orange-700 text-white'
              }`}
            >
              {isRotating ? '회전 중...' : '🔄 카메라 회전'}
            </button>
            
            {/* 연속 궤도 회전 버튼 */}
            <button 
              onClick={onToggleOrbit}
              disabled={isRotating}
              className={`w-full font-bold py-2 px-4 rounded ${
                isRotating
                  ? 'bg-purple-300 text-purple-700 cursor-not-allowed'
                  : isOrbiting 
                    ? 'bg-purple-600 hover:bg-purple-800 text-white' 
                    : 'bg-purple-500 hover:bg-purple-700 text-white'
              }`}
            >
              {isOrbiting ? '🌀 궤도 중지' : '🌀 궤도 회전'}
            </button>
            
            {/* 방향별 뷰 버튼들 */}
            <div className="space-y-1">
              <div className="text-xs text-gray-600 mb-1">방향별 뷰:</div>
              
              {/* 북쪽 뷰 */}
              <div className="flex justify-center">
                <button 
                  onClick={onNorthView}
                  className="bg-green-500 hover:bg-green-700 text-white text-xs font-bold py-2 px-4 rounded"
                >
                  ↑ 북쪽
                </button>
              </div>
              
              {/* 동서 뷰 */}
              <div className="flex justify-center space-x-2">
                <button 
                  onClick={onWestView}
                  className="bg-green-500 hover:bg-green-700 text-white text-xs font-bold py-2 px-4 rounded"
                >
                  ← 서쪽
                </button>
                <button 
                  onClick={onEastView}
                  className="bg-green-500 hover:bg-green-700 text-white text-xs font-bold py-2 px-4 rounded"
                >
                  동쪽 →
                </button>
              </div>
              
              {/* 남쪽 뷰 */}
              <div className="flex justify-center">
                <button 
                  onClick={onSouthView}
                  className="bg-green-500 hover:bg-green-700 text-white text-xs font-bold py-2 px-4 rounded"
                >
                  ↓ 남쪽
                </button>
              </div>
            </div>
            
            {/* 카메라 리셋 버튼 */}
            <button 
              onClick={onResetCamera}
              className="w-full bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded mt-3"
            >
              카메라 리셋
            </button>
          </div>
        </div>

        {/* 저장된 배치 목록 */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">저장된 배치</h3>
            <button 
              onClick={onLoadPlacements}
              className="text-sm bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded"
            >
              새로고침
            </button>
          </div>
          
          {isLoadingPlacements ? (
            <p className="text-center text-gray-500">불러오는 중...</p>
          ) : savedPlacements.length > 0 ? (
            <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
              {savedPlacements.map((placement) => (
                <button
                  key={placement._id}
                  onClick={() => onLoadPlacement(placement)}
                  className="w-full text-left p-2 bg-gray-50 hover:bg-gray-100 rounded transition-colors"
                >
                  <div className="font-medium">{placement.name}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(placement.createdAt).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">저장된 배치가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SaveLoadPanel; 
