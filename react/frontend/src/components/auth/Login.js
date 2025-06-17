import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './Login.module.css';

const Login = ({ onLoginSuccess, onShowRegister }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    userId: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || `${window.location.protocol}//${window.location.hostname}:3001`;
      const response = await axios.post(`${backendUrl}/api/auth/login`, formData);
      console.log('로그인 응답:', response.data);
      
      const token = response.data.token;
      if (!token) {
        throw new Error('토큰이 없습니다.');
      }
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      const savedToken = localStorage.getItem('token');
      console.log('저장된 토큰:', savedToken ? '있음' : '없음');
      
      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('로그인 에러:', error);
      const errorMessage = error.response?.data?.message || '로그인 중 오류가 발생했습니다.';
      setError(errorMessage);
    }
  };

  const handleRegisterClick = (e) => {
    e.preventDefault();
    if (onShowRegister) {
      onShowRegister();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <div>
          <h2 className={styles.title}>
            로그인
          </h2>
          <p className={styles.subtitle}>
          이메일을 입력하여 로그인하거나 계정을 만드세요.
          </p>
        </div>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="userId" className={styles.label}>
              아이디
            </label>
            <input
              id="userId"
              name="userId"
              type="text"
              required
              className={styles.input}
              placeholder="아이디를 입력하세요"
              value={formData.userId}
              onChange={handleChange}
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>
              비밀번호
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className={styles.input}
              placeholder="비밀번호를 입력하세요"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className={styles.button}
          >
            로그인
          </button>

          <div className={styles.linkContainer}>
            <p>
              계정이 없으신가요?{' '}
              <a href="#" onClick={handleRegisterClick} className={styles.link}>
                회원가입
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
