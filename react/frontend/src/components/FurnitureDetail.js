import React from 'react';

const FurnitureDetail = ({ furniture, onClose }) => {
  if (!furniture) return null;

  return (
    <div className="fixed top-4 left-72 bg-white bg-opacity-95 p-4 rounded-lg shadow-lg w-80">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-lg">{furniture.name}</h3>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      <div className="space-y-2 text-sm">
        <p><span className="font-medium">카테고리:</span> {furniture.category}</p>
        <p><span className="font-medium">크기:</span> {furniture.dimensions.width}cm x {furniture.dimensions.depth}cm x {furniture.dimensions.height}cm</p>
        {furniture.style && (
          <p><span className="font-medium">스타일:</span> {furniture.style}</p>
        )}
        {furniture.price && (
          <p><span className="font-medium">가격:</span> {furniture.price.toLocaleString()}원</p>
        )}
      </div>
    </div>
  );
};

export default FurnitureDetail; 