import mongoose from 'mongoose';

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vschool';
  console.log(`⏳ Connecting to MongoDB at ${mongoURI}...`);

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`\n❌ MongoDB connection error: ${error.message}`);
    console.error('👉 If running locally, please ensure MongoDB is running:');
    console.error('   Run: sudo systemctl start mongod\n');
    process.exit(1);
  }
};


export default connectDB;
