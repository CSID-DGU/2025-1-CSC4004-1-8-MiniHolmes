// [설명]
// 이 파일은 프론트엔드에서 가구 관련 REST API(목록, 상세, 카테고리, 추천 등)를 호출하는 헬퍼 함수들을 제공합니다.
// 실제 추천/배치 알고리즘 등 비즈니스 로직은 백엔드(Python)에서 실행되며,
// 이 파일은 API 통신만 담당합니다.

// src/services/api.js
const API_BASE_URL = 'http://localhost:3001/api';

// 모든 가구 목록 가져오기
export const getAllFurniture = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/furniture`);
    if (!response.ok) {
      throw new Error('가구 데이터를 가져오는데 실패했습니다');
    }
    return await response.json();
  } catch (error) {
    console.error('API 오류:', error);
    return [];
  }
};

// 특정 ID의 가구 정보 가져오기
export const getFurnitureById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/furniture/${id}`);
    if (!response.ok) {
      throw new Error('가구 정보를 가져오는데 실패했습니다');
    }
    return await response.json();
  } catch (error) {
    console.error('API 오류:', error);
    return null;
  }
};

// 카테고리별 가구 목록 가져오기
export const getFurnitureByCategory = async (category) => {
  try {
    const response = await fetch(`${API_BASE_URL}/furniture/category/${category}`);
    if (!response.ok) {
      throw new Error('카테고리별 가구 데이터를 가져오는데 실패했습니다');
    }
    return await response.json();
  } catch (error) {
    console.error('API 오류:', error);
    return [];
  }
};

// 가구 추천 API 호출
export const getRecommendedFurniture = async (userWeights, maxBudget, perimeter) => {
  try {
    const response = await fetch(`${API_BASE_URL}/furniture/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_weights: userWeights, max_budget: maxBudget, perimeter })
    });
    
    if (!response.ok) {
      throw new Error('가구 추천을 가져오는데 실패했습니다');
    }
    
    const data = await response.json();
    return data.recommendedIds;
  } catch (error) {
    console.error('API 오류:', error);
    return [];
  }
};
