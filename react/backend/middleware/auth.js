const jwt = require('jsonwebtoken');

// JWT 시크릿 키
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const auth = async (req, res, next) => {
  try {
    // Authorization 헤더 확인
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ message: '인증 토큰이 필요합니다.' });
    }

    // Bearer 토큰 형식 확인
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '잘못된 토큰 형식입니다.' });
    }

    // 토큰 추출 및 검증
    const token = authHeader.replace('Bearer ', '');
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      // decoded.userId를 _id로 설정
      req.user = { _id: decoded.userId };
      next();
    } catch (jwtError) {
      console.error('JWT 검증 에러:', jwtError);
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ message: '토큰이 만료되었습니다.' });
      }
      return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
    }
  } catch (error) {
    console.error('인증 미들웨어 에러:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

module.exports = auth; 
