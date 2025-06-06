import React from 'react';

const SaveLoadPanel = ({
  isLoadingPlacements,
  savedPlacements,
  onSavePlacement,
  onLoadPlacements,
  onLoadPlacement
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
