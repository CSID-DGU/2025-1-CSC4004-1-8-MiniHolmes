const express = require('express');
const router = express.Router();
const CommunityPost = require('../models/CommunityPost');
const auth = require('../middleware/auth');

// 모든 커뮤니티 포스트 조회 (최신순)
router.get('/posts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await CommunityPost.find({ isPublic: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-placementData'); // 목록에서는 placementData 제외 (무거움)

    const total = await CommunityPost.countDocuments({ isPublic: true });

    res.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('포스트 조회 오류:', error);
    res.status(500).json({ message: '포스트를 불러오는데 실패했습니다.' });
  }
});

// 특정 포스트 상세 조회
router.get('/posts/:id', async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: '포스트를 찾을 수 없습니다.' });
    }

    if (!post.isPublic) {
      return res.status(403).json({ message: '비공개 포스트입니다.' });
    }

    res.json(post);
  } catch (error) {
    console.error('포스트 상세 조회 오류:', error);
    res.status(500).json({ message: '포스트를 불러오는데 실패했습니다.' });
  }
});

// 새 포스트 생성
router.post('/posts', auth, async (req, res) => {
  try {
    console.log('Community post creation request:', req.body);
    console.log('User from auth middleware:', req.user);
    
    const { title, description, placementData, roomDimensions, tags } = req.body;

    if (!title || !placementData) {
      console.log('Missing required fields:', { title, placementData });
      return res.status(400).json({ message: '제목과 배치 데이터는 필수입니다.' });
    }

    const post = new CommunityPost({
      user: req.user._id,
      username: req.user._id,
      title,
      description,
      placementData,
      roomDimensions,
      tags: tags || []
    });

    await post.save();

    res.status(201).json({
      message: '포스트가 성공적으로 생성되었습니다.',
      post: {
        ...post.toObject(),
        placementData: undefined // 응답에서 placementData 제외
      }
    });
  } catch (error) {
    console.error('포스트 생성 오류:', error);
    res.status(500).json({ message: '포스트 생성에 실패했습니다.' });
  }
});

// 포스트 좋아요/좋아요 취소
router.post('/posts/:id/like', auth, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: '포스트를 찾을 수 없습니다.' });
    }

    const userId = req.user._id;
    const likeIndex = post.likes.indexOf(userId);

    if (likeIndex > -1) {
      // 좋아요 취소
      post.likes.splice(likeIndex, 1);
      post.likesCount = Math.max(0, post.likesCount - 1);
    } else {
      // 좋아요 추가
      post.likes.push(userId);
      post.likesCount += 1;
    }

    await post.save();

    res.json({
      message: likeIndex > -1 ? '좋아요를 취소했습니다.' : '좋아요를 추가했습니다.',
      likesCount: post.likesCount,
      isLiked: likeIndex === -1
    });
  } catch (error) {
    console.error('좋아요 처리 오류:', error);
    res.status(500).json({ message: '좋아요 처리에 실패했습니다.' });
  }
});

// 댓글 추가
router.post('/posts/:id/comments', auth, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: '댓글 내용을 입력해주세요.' });
    }

    const post = await CommunityPost.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: '포스트를 찾을 수 없습니다.' });
    }

    const comment = {
      user: req.user._id,
      username: req.user._id,
      content: content.trim()
    };

    post.comments.push(comment);
    post.commentsCount += 1;

    await post.save();

    res.status(201).json({
      message: '댓글이 추가되었습니다.',
      comment: post.comments[post.comments.length - 1]
    });
  } catch (error) {
    console.error('댓글 추가 오류:', error);
    res.status(500).json({ message: '댓글 추가에 실패했습니다.' });
  }
});

// 댓글 삭제
router.delete('/posts/:postId/comments/:commentId', auth, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ message: '포스트를 찾을 수 없습니다.' });
    }

    const comment = post.comments.id(req.params.commentId);
    
    if (!comment) {
      return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
    }

    // 댓글 작성자만 삭제 가능
    if (comment.user.toString() !== req.user._id) {
      return res.status(403).json({ message: '댓글을 삭제할 권한이 없습니다.' });
    }

    comment.remove();
    post.commentsCount = Math.max(0, post.commentsCount - 1);

    await post.save();

    res.json({ message: '댓글이 삭제되었습니다.' });
  } catch (error) {
    console.error('댓글 삭제 오류:', error);
    res.status(500).json({ message: '댓글 삭제에 실패했습니다.' });
  }
});

// 내 포스트 조회
router.get('/my-posts', auth, async (req, res) => {
  try {
    const posts = await CommunityPost.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select('-placementData');

    res.json(posts);
  } catch (error) {
    console.error('내 포스트 조회 오류:', error);
    res.status(500).json({ message: '포스트를 불러오는데 실패했습니다.' });
  }
});

module.exports = router;
