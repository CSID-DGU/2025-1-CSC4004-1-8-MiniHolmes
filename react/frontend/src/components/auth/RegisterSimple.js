import React, { useState } from 'react';
import axios from 'axios';
import styles from './Login.module.css';

const RegisterSimple = ({ onShowLogin }) => {
  const [formData, setFormData] = useState({
    userId: '',
    username: '',
    email: '',
    password: '',
    passwordConfirm: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (formData.userId.length < 4) {
      newErrors.userId = '아이디는 4자 이상이어야 합니다.';
    } else if (!/^[a-zA-Z0-9]+$/.test(formData.userId)) {
      newErrors.userId = '아이디는 영문자와 숫자만 사용할 수 있습니다.';
    }
    if (formData.username.length < 3) {
      newErrors.username = '이름은 3자 이상이어야 합니다.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '유효한 이메일 주소를 입력해주세요.';
    }
    if (formData.password.length < 6) {
      newErrors.password = '비밀번호는 6자 이상이어야 합니다.';
    }
    if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호가 일치하지 않습니다.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      const newErrors = { ...errors };
      delete newErrors[name];
      setErrors(newErrors);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      await axios.post('http://localhost:3001/api/auth/register', {
        userId: formData.userId,
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      alert('회원가입이 완료되었습니다. 로그인해주세요.');
      if (onShowLogin) {
        onShowLogin(); // 로그인 폼으로 전환
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || '회원가입 중 오류가 발생했습니다.';
      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginClick = (e) => {
    e.preventDefault();
    if (onShowLogin) {
      onShowLogin();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <div>
          <h2 className={styles.title}>
            회원가입
          </h2>
        </div>
        <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.inputGroup}>
            <label htmlFor="userId" className={styles.label}>아이디</label>
            <input
              id="userId"
              name="userId"
              type="text"
              required
              className={styles.input}
              placeholder="4-20자의 영문, 숫자 조합"
              value={formData.userId}
              onChange={handleChange}
            />
            {errors.userId && <div className={styles.error}>{errors.userId}</div>}
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="username" className={styles.label}>이름</label>
            <input
              id="username"
              name="username"
              type="text"
              required
              className={styles.input}
              placeholder="이름을 입력하세요"
              value={formData.username}
              onChange={handleChange}
            />
            {errors.username && <div className={styles.error}>{errors.username}</div>}
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>이메일</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className={styles.input}
              placeholder="이메일을 입력하세요"
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && <div className={styles.error}>{errors.email}</div>}
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>비밀번호</label>
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
            {errors.password && <div className={styles.error}>{errors.password}</div>}
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="passwordConfirm" className={styles.label}>비밀번호 확인</label>
            <input
              id="passwordConfirm"
              name="passwordConfirm"
              type="password"
              required
              className={styles.input}
              placeholder="비밀번호를 한 번 더 입력하세요"
              value={formData.passwordConfirm}
              onChange={handleChange}
            />
            {errors.passwordConfirm && <div className={styles.error}>{errors.passwordConfirm}</div>}
          </div>
          {errors.submit && <div className={styles.error}>{errors.submit}</div>}
          <button
            type="submit"
            className={styles.button}
            disabled={isSubmitting}
          >
            {isSubmitting ? '처리 중...' : '회원가입'}
          </button>

          <div className={styles.linkContainer}>
            <p>
              이미 계정이 있으신가요?{' '}
              <a href="#" onClick={handleLoginClick} className={styles.link}>
                로그인
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterSimple;
