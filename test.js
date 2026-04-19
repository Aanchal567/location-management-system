require('dotenv').config();
const mongoose = require('mongoose');

console.log('Testing MongoDB connection...');
console.log('MongoDB URI:', process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
})
.then(() => {
    console.log('✅ Connected successfully!');
    console.log('Database:', mongoose.connection.name);
    process.exit(0);
})
.catch(err => {
    console.log('❌ Connection failed:', err.message);
    process.exit(1);
});