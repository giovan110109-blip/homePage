const fs = require('fs');
const path = require('path');

/**
 * 自动注册路由
 * @param {Koa} app Koa实例
 */
function registerRoutes(app) {
    const modulesPath = path.join(__dirname, 'modules');
    
    // 如果modules目录不存在，创建它
    if (!fs.existsSync(modulesPath)) {
        fs.mkdirSync(modulesPath);
    }

    // 读取modules目录下的所有文件
    const files = fs.readdirSync(modulesPath);
    
    const allowList = new Set([
        'health.js',
        'message.js',
        'upload.js',
        'monitor.js',
        'adminAuth.js',
        'adminUsers.js',
        'adminMessages.js',
        'siteInfo.js',
        'adminSiteInfo.js',
        'sponsor.js',
        'adminSponsors.js',
        'adminSponsorMethods.js',
        'adminAccessLogs.js',
        'accessLogs.js',
        'friendLink.js',
        'adminFriendLinks.js',
        'adminAlbums.js',
        'articles.js',
        'adminArticles.js',
        'profile.js',
        'photos.js',
        'dashboard.js',
        'geo.js',
        'comment.js',
        'adminComments.js',
        'wechatAuth.js'
    ]);

    // 过滤出路由文件
    const routeFiles = files.filter(file => 
        !file.startsWith('.') && // 排除隐藏文件
        file.endsWith('.js') && // 只处理js文件
        allowList.has(file)
    );

    // 注册每个路由文件
    routeFiles.forEach(file => {
        const router = require(path.join(modulesPath, file));
        // 注册路由
        app.use(router.routes());
        app.use(router.allowedMethods());
        
        // 输出路由注册信息
        console.log(`✅ 已注册路由模块: ${file}`);
    });
}

module.exports = registerRoutes; 