const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Sponsor = require('../models/sponsor');
const SponsorMethod = require('../models/sponsorMethod');

(() => {
  const rootEnv = path.resolve(__dirname, '../../../.env');
  const serverEnv = path.resolve(__dirname, '../.env');
  if (fs.existsSync(rootEnv)) {
    dotenv.config({ path: rootEnv });
    console.log('Loaded env from project root .env');
    return;
  }
  if (fs.existsSync(serverEnv)) {
    dotenv.config({ path: serverEnv });
    console.log('Loaded env from server/.env');
    return;
  }
  dotenv.config();
  console.log('Loaded env from process environment');
})();

const seedMethods = [
  {
    name: '微信支付',
    icon: 'https://dummyimage.com/64x64/07c160/ffffff&text=WeChat',
    qrCode: 'https://dummyimage.com/300x300/07c160/ffffff&text=WeChat+QR',
    description: '扫一扫，请我喝杯咖啡',
    sort: 1,
    enabled: true,
  },
  {
    name: '支付宝',
    icon: 'https://dummyimage.com/64x64/1677ff/ffffff&text=Alipay',
    qrCode: 'https://dummyimage.com/300x300/1677ff/ffffff&text=Alipay+QR',
    description: '扫一扫，请我喝杯咖啡',
    sort: 2,
    enabled: true,
  },
];

const seedSponsors = [
  {
    name: '星之守护者',
    amount: 20,
    message: '继续加油！',
    date: '2024-06-01',
    methodName: '微信支付',
  },
  {
    name: '小鹿',
    amount: 50,
    message: '很喜欢你的作品',
    date: '2024-07-12',
    methodName: '支付宝',
  },
  {
    name: '匿名赞助',
    amount: 10,
    message: '支持一下',
    date: '2024-08-03',
    methodName: '微信支付',
  },
];

async function run() {
  try {
    await connectDB();

    const methodDocs = {};
    for (const method of seedMethods) {
      const doc = await SponsorMethod.findOneAndUpdate(
        { name: method.name },
        method,
        { new: true, upsert: true, setDefaultsOnInsert: true, lean: true }
      );
      methodDocs[method.name] = doc;
    }

    const sponsorCount = await Sponsor.countDocuments();
    if (sponsorCount === 0) {
      const docs = seedSponsors.map((item) => ({
        name: item.name,
        amount: item.amount,
        message: item.message,
        date: item.date,
        method: methodDocs[item.methodName]?._id,
      }));
      await Sponsor.insertMany(docs);
      console.log(`Seeded ${docs.length} sponsors`);
    } else {
      console.log('Sponsors already exist, skip seeding sponsors');
    }

    console.log('Sponsor methods seeded');
  } catch (error) {
    console.error('Seed failed', error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

run();
