const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// 创建一个测试 webp 文件
async function test() {
  const testDir = '/tmp/sharp-test';
  const testFile = path.join(testDir, 'test.webp');
  
  // 创建测试目录
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  // 创建一个简单的 webp 图像
  await sharp({
    create: {
      width: 100,
      height: 100,
      channels: 3,
      background: { r: 255, g: 0, b: 0 }
    }
  }).webp().toFile(testFile);
  
  console.log('✓ 创建测试文件成功');
  
  // 测试旋转
  try {
    await sharp(testFile)
      .rotate(90)
      .webp({ quality: 90 })
      .toFile(testFile + '.rotated');
    console.log('✓ webp 旋转成功');
    
    // 检查旋转后文件的元数据
    const metadata = await sharp(testFile + '.rotated').metadata();
    console.log('✓ 旋转后元数据:', { width: metadata.width, height: metadata.height });
  } catch(e) {
    console.error('✗ webp 旋转失败:', e.message);
  }
}

test().catch(console.error);
