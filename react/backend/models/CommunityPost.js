const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const communityPostSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  placementData: {
    type: Object,
    required: true
  },
  roomDimensions: {
    width: Number,
    depth: Number,
    height: Number
  },
  roomConfiguration: {
    roomSize: {
      width: Number,
      depth: Number,
      height: Number
    },
    doors: [{
      wall: String,
      width: Number,
      height: Number,
      offset: Number
    }],
    windows: [{
      wall: String,
      width: Number,
      height: Number,
      altitude: Number,
      offset: Number
    }],
    partitions: [Object]
  },
  tags: [{
    type: String,
    maxlength: 30
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likesCount: {
    type: Number,
    default: 0
  },
  comments: [commentSchema],
  commentsCount: {
    type: Number,
    default: 0
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 인덱스 설정
communityPostSchema.index({ createdAt: -1 });
communityPostSchema.index({ likesCount: -1 });
communityPostSchema.index({ user: 1 });

module.exports = mongoose.model('CommunityPost', communityPostSchema);
