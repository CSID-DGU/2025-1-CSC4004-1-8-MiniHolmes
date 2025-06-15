const mongoose = require('mongoose');
const CommunityPost = require('../models/CommunityPost');
const User = require('../models/User');

async function fixUsernames() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/miniholmes', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Get all posts
    const posts = await CommunityPost.find({});
    console.log(`Found ${posts.length} posts to update`);

    // Create a map of user IDs to usernames
    const userIdToUsername = new Map();
    const users = await User.find({});
    users.forEach(user => {
      userIdToUsername.set(user._id.toString(), user.username);
    });

    // Update each post and its comments
    for (const post of posts) {
      const username = userIdToUsername.get(post.user.toString());
      if (username) {
        post.username = username;
        
        // Update comments
        post.comments.forEach(comment => {
          const commentUsername = userIdToUsername.get(comment.user.toString());
          if (commentUsername) {
            comment.username = commentUsername;
          }
        });

        await post.save();
        console.log(`Updated post ${post._id}`);
      }
    }

    console.log('Username update completed');
    process.exit(0);
  } catch (error) {
    console.error('Error updating usernames:', error);
    process.exit(1);
  }
}

fixUsernames(); 
