const express = require('express');
const router = express.Router();
const Placement = require('../models/Placement');
const auth = require('../middleware/auth');

// 배치 저장
router.post('/', auth, async (req, res) => {
  try {
    console.log('🗄️ BACKEND: 배치 저장 요청 Raw Body:', JSON.stringify(req.body, null, 2));
    console.log('🗄️ BACKEND: roomConfiguration in request:', req.body.roomConfiguration);

    // 스키마 구조에 맞게 가구 배열을 명시적으로 매핑
    const mappedFurniture = req.body.furniture.map(f => ({
      furnitureId: f.furnitureId,
      position: f.position,    // 숫자 배열인지 확인
      rotation: f.rotation,    // 숫자 배열인지 확인
      scale: f.scale           // 숫자 배열인지 확인
    }));

    const placement = new Placement({
      userId: req.user._id,
      name: req.body.name,
      furniture: mappedFurniture, // 명시적으로 매핑된 배열 사용
      roomConfiguration: req.body.roomConfiguration // Add room configuration
    });

    console.log('생성된 배치 객체 (매핑 후):', JSON.stringify(placement.toObject(), null, 2));

    await placement.save();
    console.log('배치 저장 성공:', placement);
    res.status(201).json(placement);
  } catch (error) {
    console.error('배치 저장 실패:', error);
    res.status(400).json({ message: error.message });
  }
});

// 사용자의 모든 배치 불러오기
router.get('/', auth, async (req, res) => {
  try {
    console.log('배치 불러오기 요청:', {
      user: req.user
    });

    const placements = await Placement.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    
    console.log('불러온 배치 수:', placements.length);
    res.json(placements);
  } catch (error) {
    console.error('배치 불러오기 실패:', error);
    res.status(500).json({ message: error.message });
  }
});

// 특정 배치 불러오기
router.get('/:id', auth, async (req, res) => {
  try {
    console.log('특정 배치 불러오기 요청:', {
      user: req.user,
      placementId: req.params.id
    });

    const placement = await Placement.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!placement) {
      return res.status(404).json({ message: '배치를 찾을 수 없습니다.' });
    }

    console.log('배치 찾음:', placement);
    res.json(placement);
  } catch (error) {
    console.error('특정 배치 불러오기 실패:', error);
    res.status(500).json({ message: error.message });
  }
});

// 배치 삭제
router.delete('/:id', auth, async (req, res) => {
  try {
    console.log('배치 삭제 요청:', {
      user: req.user,
      placementId: req.params.id
    });

    const placement = await Placement.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!placement) {
      return res.status(404).json({ message: '배치를 찾을 수 없습니다.' });
    }

    console.log('배치 삭제 성공:', placement);
    res.json({ message: '배치가 삭제되었습니다.' });
  } catch (error) {
    console.error('배치 삭제 실패:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 
