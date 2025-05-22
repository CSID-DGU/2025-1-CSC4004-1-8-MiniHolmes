const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT 시크릿 키
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 회원가입
router.post('/register', async (req, res) => {
  try {
    console.log('회원가입 요청 받음:', req.body);
    const { userId, username, email, password } = req.body;

    // 아이디 중복 체크
    console.log('아이디 중복 체크:', userId);
    const existingUserId = await User.findOne({ userId });
    if (existingUserId) {
      console.log('아이디 중복 발견:', userId);
      return res.status(400).json({ message: '이미 사용 중인 아이디입니다.' });
    }

    // 이메일 중복 체크
    console.log('이메일 중복 체크:', email);
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      console.log('이메일 중복 발견:', email);
      return res.status(400).json({ message: '이미 등록된 이메일입니다.' });
    }

    // 새 사용자 생성
    console.log('새 사용자 생성 시작');
    const user = new User({
      userId,
      username,
      email,
      password
    });

    console.log('사용자 저장 시도');
    await user.save();
    console.log('사용자 저장 성공:', user._id);

    // JWT 토큰 생성
    console.log('JWT 토큰 생성');
    const token = jwt.sign(
      { userId: user._id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('회원가입 완료');
    res.status(201).json({
      message: '회원가입이 완료되었습니다.',
      token,
      user: {
        id: user._id,
        userId: user.userId,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('회원가입 오류:', error);
    console.error('오류 상세:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      message: '서버 오류가 발생했습니다.', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 로그인
router.post('/login', async (req, res) => {
  try {
    console.log('로그인 요청 받음:', req.body);
    const { userId, password } = req.body;

    // 사용자 찾기
    console.log('사용자 검색:', userId);
    const user = await User.findOne({ userId });
    if (!user) {
      console.log('사용자를 찾을 수 없음:', userId);
      return res.status(401).json({ message: '존재하지 않는 아이디입니다.' });
    }

    // 비밀번호 검증
    console.log('비밀번호 검증');
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('비밀번호 불일치');
      return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
    }

    // JWT 토큰 생성
    console.log('JWT 토큰 생성');
    const token = jwt.sign(
      { userId: user._id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('로그인 성공');
    res.json({
      message: '로그인이 완료되었습니다.',
      token,
      user: {
        id: user._id,
        userId: user.userId,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('로그인 오류:', error);
    console.error('오류 상세:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      message: '서버 오류가 발생했습니다.', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router; 
