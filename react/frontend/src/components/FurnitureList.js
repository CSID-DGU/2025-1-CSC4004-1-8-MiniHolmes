import React from 'react';

const FurnitureList = ({
  furniture,
  filteredFurniture,
  selectedItems,
  isRecommending,
  onSearch,
  onRecommendFurniture,
  onClearScene,
  onSelectFurniture
}) => {
  return (
    <div className="h-full p-4 bg-gray-100 overflow-y-auto">
      <div className="mb-4">
        <input
          type="text"
          placeholder="가구 검색..."
          className="w-full p-2 border rounded"
          onChange={(e) => {
            const searchTerm = e.target.value.toLowerCase();
            onSearch(searchTerm);
          }}
        />
      </div>
      
      <div className="mb-4 flex space-x-2">
        <button 
          className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded flex-1"
          onClick={onRecommendFurniture}
          disabled={isRecommending}
        >
          {isRecommending ? '추천 중...' : '가구 추천'}
        </button>
        <button 
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          onClick={onClearScene}
        >
          초기화
        </button>
      </div>

      {/* 카테고리별 가구 목록 */}
      <div className="space-y-4">
        {['bed', 'desk', 'wardrobe', 'bookshelf'].map(category => (
          <div key={category} className="border rounded p-2">
            <h3 className="font-bold mb-2 capitalize">{category}</h3>
            <div className="space-y-2">
              {filteredFurniture
                .filter(item => item.category === category)
                .map(item => (
                  <div 
                    key={item._id}
                    className={`p-2 rounded cursor-pointer transition-colors ${
                      selectedItems.includes(item._id) 
                        ? 'bg-blue-100 border-blue-500' 
                        : 'bg-white hover:bg-gray-50'
                    }`}
                    onClick={() => onSelectFurniture(item)}
                  >
                    <div className="font-bold text-sm">{item.name}</div>
                    <div className="text-xs text-gray-600">
                      {item.dimensions.width}cm x {item.dimensions.depth}cm
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FurnitureList; 