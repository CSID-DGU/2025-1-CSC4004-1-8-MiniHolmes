import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL 
  ? `${process.env.REACT_APP_BACKEND_URL}/api`
  : `${window.location.protocol}//${window.location.hostname}:3001/api`;

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

// 커뮤니티 포스트 목록 조회
export const getCommunityPosts = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(`/community/posts?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('커뮤니티 포스트 조회 오류:', error);
    throw error;
  }
};

// 특정 포스트 상세 조회
export const getCommunityPost = async (postId) => {
  try {
    const response = await api.get(`/community/posts/${postId}`);
    return response.data;
  } catch (error) {
    console.error('포스트 상세 조회 오류:', error);
    throw error;
  }
};

// 새 포스트 생성
export const createCommunityPost = async (postData) => {
  try {
    const response = await api.post('/community/posts', postData);
    return response.data;
  } catch (error) {
    console.error('포스트 생성 오류:', error);
    throw error;
  }
};

// 포스트 좋아요/좋아요 취소
export const togglePostLike = async (postId) => {
  try {
    const response = await api.post(`/community/posts/${postId}/like`);
    return response.data;
  } catch (error) {
    console.error('좋아요 처리 오류:', error);
    throw error;
  }
};

// 댓글 추가
export const addComment = async (postId, content) => {
  try {
    const response = await api.post(`/community/posts/${postId}/comments`, { content });
    return response.data;
  } catch (error) {
    console.error('댓글 추가 오류:', error);
    throw error;
  }
};

// 댓글 삭제
export const deleteComment = async (postId, commentId) => {
  try {
    const response = await api.delete(`/community/posts/${postId}/comments/${commentId}`);
    return response.data;
  } catch (error) {
    console.error('댓글 삭제 오류:', error);
    throw error;
  }
};

// 포스트 삭제
export const deletePost = async (postId) => {
  try {
    const token = localStorage.getItem('token');
    console.log('NEW Delete request - Token:', token ? 'exists' : 'missing');
    console.log('NEW Delete request - Post ID:', postId);
    console.log('NEW Delete request - API URL:', `${API_BASE_URL}/community/posts/${postId}`);
    
    // Hard refresh to ensure no caching issues
    const timestamp = Date.now();
    const response = await api.delete(`/community/posts/${postId}?_t=${timestamp}`);
    return response.data;
  } catch (error) {
    console.error('NEW 포스트 삭제 오류:', error);
    console.error('NEW Error response:', error.response?.data);
    console.error('NEW Error status:', error.response?.status);
    throw error;
  }
};

// 내 포스트 조회
export const getMyPosts = async () => {
  try {
    const response = await api.get('/community/my-posts');
    return response.data;
  } catch (error) {
    console.error('내 포스트 조회 오류:', error);
    throw error;
  }
};
