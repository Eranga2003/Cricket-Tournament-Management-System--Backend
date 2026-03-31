const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cricket';
    
    await mongoose.connect(mongoURI, {
      connectTimeoutMS: 5000, // 5 second timeout
      serverSelectionTimeoutMS: 5000,
      retryWrites: true,
      w: 'majority'
    });
    
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('⚠️ MongoDB connection warning:', error.message);
    console.log('   Using Firebase as primary database. MongoDB is optional.');
    // Don't exit - allow Firebase to work as fallback
  }
};

module.exports = connectDB;
