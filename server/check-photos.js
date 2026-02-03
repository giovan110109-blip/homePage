const path = require('path');
const fs = require('fs');

// 读取 .env 文件
const envPath = path.join(__dirname, '..', '.env');
const env = fs.readFileSync(envPath, 'utf-8');
const matches = env.match(/MONGODB_URI="([^"]+)"/);
const mongoUri = matches ? matches[1] : '';

console.log('MONGODB_URI:', mongoUri);

const mongoose = require('mongoose');
const Photo = require('./src/models/photo');

async function test() {
  try {
    await mongoose.connect(mongoUri);
    
    const photos = await Photo.find()
      .select('originalFileName storageKey mimeType originalUrl updatedAt')
      .sort({ createdAt: -1 })
      .limit(10);
    
    console.log('\n数据库中的照片:');
    photos.forEach(p => {
      console.log(`- ${p.originalFileName}`);
      console.log(`  MIME: ${p.mimeType}`);
      console.log(`  updatedAt: ${p.updatedAt}`);
      console.log(`  URL: ${p.originalUrl}`);
    });
    
    process.exit(0);
  } catch(e) {
    console.error('错误:', e.message);
    process.exit(1);
  }
}
test();
