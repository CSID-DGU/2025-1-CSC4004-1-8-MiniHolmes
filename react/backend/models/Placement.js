const mongoose = require('mongoose');

const placementSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  furniture: [{
    furnitureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Furniture',
      required: true
    },
    position: {
      type: [Number],
      default: [0,0,0]
    },
    rotation: {
      type: [Number],
      default: [0,0,0,1]
    },
    scale: {
      type: [Number],
      default: [1,1,1]
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Placement', placementSchema); 
