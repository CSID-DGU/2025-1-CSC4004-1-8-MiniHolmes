// src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

// axios 인스턴스 생성
const api = axios.create({
  baseURL: API_BASE_URL
});

// 요청 인터셉터 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 모든 가구 목록 가져오기
export const getAllFurniture = async () => {
  try {
    const response = await api.get('/furniture');
    return response.data;
  } catch (error) {
    console.error('API 오류:', error);
    return [];
  }
};

// 특정 ID의 가구 정보 가져오기
export const getFurnitureById = async (id) => {
  try {
    const response = await api.get(`/furniture/${id}`);
    return response.data;
  } catch (error) {
    console.error('API 오류:', error);
    return null;
  }
};

// 카테고리별 가구 목록 가져오기
export const getFurnitureByCategory = async (category) => {
  try {
    const response = await api.get(`/furniture/category/${category}`);
    return response.data;
  } catch (error) {
    console.error('API 오류:', error);
    return [];
  }
};

// 가구 추천 API 호출
export const getRecommendedFurniture = async (payload) => {
  try {
    const response = await api.post('/furniture-placement', payload);
    return response.data;
  } catch (error) {
    console.error('API 오류 (getRecommendedFurniture):', error);
    throw error;
  }
};

export const savePlacement = async (placementData) => {
  try {
    const response = await api.post('/placements', placementData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getPlacements = async () => {
  try {
    const response = await api.get('/placements');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getPlacementById = async (placementId) => {
  try {
    const response = await api.get(`/placements/${placementId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
