/**
 * 种子数据脚本：友情链接
 * 用于开发和测试环境初始化数据
 * 运行: node src/scripts/seedFriendLinks.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const FriendLink = require('../models/friendLink');

const seedData = [
    {
        name: '技术博客 - 阿超',
        url: 'https://www.achao.tech',
        description: '分享前端技术、Vue、React、TypeScript等最新技术栈',
        avatar: 'https://avatars.githubusercontent.com/u/12345?v=4',
        email: 'achao@example.com',
        rss: 'https://www.achao.tech/feed',
        category: 'tech',
        tags: ['前端', 'Vue', 'TypeScript'],
        status: 'approved',
        isActive: true,
        sort: 100,
        clicks: 42,
        reviewedAt: new Date(),
        reviewedBy: 'admin'
    },
    {
        name: '设计笔记 - 小设',
        url: 'https://design.example.com',
        description: 'UI/UX设计分享，包含设计思路和实践经验',
        avatar: 'https://via.placeholder.com/150?text=Design',
        email: 'design@example.com',
        rss: 'https://design.example.com/feed',
        category: 'design',
        tags: ['UI', 'UX', '设计'],
        status: 'approved',
        isActive: true,
        sort: 90,
        clicks: 28,
        reviewedAt: new Date(),
        reviewedBy: 'admin'
    },
    {
        name: '生活博客 - 旅行者',
        url: 'https://blog.travel.com',
        description: '记录旅行见闻、摄影和生活感悟',
        avatar: 'https://via.placeholder.com/150?text=Travel',
        email: 'travel@example.com',
        category: 'life',
        tags: ['旅行', '摄影', '生活'],
        status: 'approved',
        isActive: true,
        sort: 80,
        clicks: 15,
        reviewedAt: new Date(),
        reviewedBy: 'admin'
    },
    {
        name: '开源工具库',
        url: 'https://github.com/awesome-tools',
        description: '收集和整理各种实用的开源工具和库',
        avatar: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
        email: 'tools@example.com',
        rss: 'https://github.com/awesome-tools/releases.atom',
        category: 'tools',
        tags: ['开源', '工具', 'GitHub'],
        status: 'approved',
        isActive: true,
        sort: 85,
        clicks: 56,
        reviewedAt: new Date(),
        reviewedBy: 'admin'
    },
    {
        name: 'Node.js 中文社区',
        url: 'https://nodejs-community.cn',
        description: 'Node.js 学习资源、最佳实践和开发工具分享',
        avatar: 'https://nodejs.org/static/images/logo.svg',
        email: 'nodejs@example.com',
        rss: 'https://nodejs-community.cn/feed',
        category: 'tech',
        tags: ['Node.js', 'JavaScript', 'Backend'],
        status: 'approved',
        isActive: true,
        sort: 95,
        clicks: 89,
        reviewedAt: new Date(),
        reviewedBy: 'admin'
    },
    {
        name: '待审核友链示例',
        url: 'https://pending.example.com',
        description: '这是一个待审核的友情链接示例',
        email: 'pending@example.com',
        category: 'other',
        status: 'pending',
        isActive: true,
        sort: 0,
        clicks: 0
    },
    {
        name: '已拒绝友链示例',
        url: 'https://rejected.example.com',
        description: '这是一个已拒绝的友情链接示例',
        email: 'rejected@example.com',
        category: 'other',
        status: 'rejected',
        reason: '网站内容不符合要求',
        isActive: false,
        sort: 0,
        clicks: 0,
        reviewedAt: new Date(),
        reviewedBy: 'admin'
    }
];

async function seedFriendLinks() {
    try {
        // 连接数据库
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB 已连接');

        // 清空现有数据（可选）
        const count = await FriendLink.countDocuments();
        if (count > 0) {
            const answer = await new Promise((resolve) => {
                process.stdout.write('数据库中已存在 ' + count + ' 条友情链接记录，是否清空后重新导入? (y/n): ');
                process.stdin.once('data', (data) => {
                    resolve(data.toString().trim().toLowerCase() === 'y');
                });
            });

            if (answer) {
                await FriendLink.deleteMany({});
                console.log('✅ 已清空现有数据');
            } else {
                console.log('⚠️  保留现有数据，只追加新数据');
                // 只导入不存在的数据
                for (const item of seedData) {
                    const exists = await FriendLink.findOne({ email: item.email });
                    if (!exists) {
                        await FriendLink.create(item);
                    }
                }
                console.log('✅ 数据导入完成（仅追加新数据）');
                process.exit(0);
            }
        }

        // 导入种子数据
        await FriendLink.insertMany(seedData);
        console.log(`✅ 成功导入 ${seedData.length} 条友情链接数据`);

        // 显示统计信息
        const stats = await FriendLink.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        console.log('\n📊 数据统计:');
        stats.forEach(stat => {
            const statusLabel = {
                'approved': '✅ 已通过',
                'pending': '⏳ 待审核',
                'rejected': '❌ 已拒绝'
            };
            console.log(`  ${statusLabel[stat._id] || stat._id}: ${stat.count} 条`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ 导入失败:', error.message);
        process.exit(1);
    }
}

seedFriendLinks();
