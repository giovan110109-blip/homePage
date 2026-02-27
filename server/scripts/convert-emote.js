const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputBase = path.join(__dirname, '../../client/public/emote');
const outputBase = path.join(__dirname, '../../client/public/emote-webp');

if (!fs.existsSync(outputBase)) {
  fs.mkdirSync(outputBase, { recursive: true });
}

const groups = ['抽象', '牛牛', '高雅人士'];

async function convertGifToWebp() {
  for (const group of groups) {
    const groupInput = path.join(inputBase, group);
    const groupOutput = path.join(outputBase, group);
    
    if (!fs.existsSync(groupOutput)) {
      fs.mkdirSync(groupOutput, { recursive: true });
    }

    if (!fs.existsSync(groupInput)) {
      console.log(`Skipping ${group}: directory not found`);
      continue;
    }

    const files = fs.readdirSync(groupInput)
      .filter(f => f.endsWith('.gif'));

    console.log(`Processing ${group}: ${files.length} files`);

    for (const file of files) {
      const inputPath = path.join(groupInput, file);
      const outputPath = path.join(groupOutput, file.replace('.gif', '.webp'));

      try {
        await sharp(inputPath)
          .webp({ quality: 80 })
          .toFile(outputPath);
        
        console.log(`Converted: ${file}`);
      } catch (error) {
        console.error(`Error converting ${file}:`, error.message);
      }
    }
  }
}

convertGifToWebp().then(() => {
  console.log('Conversion complete!');
});
