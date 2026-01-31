/**
 * 文章数据初始化脚本
 */

const mongoose = require('mongoose')
const Article = require('../models/article')
const path = require('path')

// 加载环境变量 - 从项目根目录加载
require('dotenv').config({ path: path.join(__dirname, '../../../.env') })

const { MONGODB_URI } = process.env

const sampleArticles = [
  {
    title: 'Vue 3 Composition API 深度解析',
    content: `<h2>什么是 Composition API</h2>
<p>Composition API 是 Vue 3 中引入的一种新的 API 风格，它提供了更灵活的代码组织方式。</p>

<h3>核心概念</h3>
<p>Composition API 主要包括以下几个核心概念：</p>
<ul>
  <li><code>ref</code> 和 <code>reactive</code>：响应式数据</li>
  <li><code>computed</code>：计算属性</li>
  <li><code>watch</code> 和 <code>watchEffect</code>：侦听器</li>
  <li><code>生命周期钩子</code>：如 onMounted、onUpdated 等</li>
</ul>

<pre><code>import { ref, computed, onMounted } from 'vue'

export default {
  setup() {
    const count = ref(0)
    const doubleCount = computed(() => count.value * 2)
    
    onMounted(() => {
      console.log('组件已挂载')
    })
    
    return { count, doubleCount }
  }
}</code></pre>

<h3>优势</h3>
<p>相比 Options API，Composition API 具有以下优势：</p>
<ol>
  <li>更好的代码组织和复用</li>
  <li>更好的类型推导</li>
  <li>更小的打包体积</li>
</ol>

<blockquote>
  <p>Composition API 不是为了替代 Options API，而是提供了另一种选择。</p>
</blockquote>`,
    coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
    summary: '深入探讨 Vue 3 Composition API 的核心概念、使用方式和最佳实践',
    category: '前端开发',
    tags: ['Vue', 'JavaScript', 'Composition API'],
    status: 'published',
    author: {
      name: '张三',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhang',
      bio: '全栈开发工程师，专注于前端技术'
    },
    views: 1234,
    likes: 89,
    isTop: true,
    allowComment: true
  },
  {
    title: 'TypeScript 类型体操实战指南',
    content: `<h2>TypeScript 类型系统</h2>
<p>TypeScript 的类型系统非常强大，通过类型编程可以实现很多复杂的类型推导。</p>

<h3>基础类型工具</h3>
<pre><code>type Partial&lt;T&gt; = {
  [P in keyof T]?: T[P]
}

type Required&lt;T&gt; = {
  [P in keyof T]-?: T[P]
}</code></pre>

<h3>高级类型技巧</h3>
<p>利用条件类型、映射类型和模板字面量类型，我们可以实现更复杂的类型操作。</p>

<img src="https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800" alt="TypeScript" />`,
    coverImage: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800',
    summary: 'TypeScript 高级类型技巧和实战案例，从基础到进阶的完整指南',
    category: '编程语言',
    tags: ['TypeScript', 'JavaScript', '类型系统'],
    status: 'published',
    author: {
      name: '李四',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=li',
      bio: 'TypeScript 专家'
    },
    views: 892,
    likes: 67,
    isTop: false,
    allowComment: true
  },
  {
    title: 'Node.js 性能优化最佳实践',
    content: `<h2>性能优化策略</h2>
<p>Node.js 应用的性能优化需要从多个层面入手。</p>

<h3>关键优化点</h3>
<ul>
  <li>使用流处理大文件</li>
  <li>合理使用缓存</li>
  <li>避免阻塞事件循环</li>
  <li>优化数据库查询</li>
</ul>

<pre><code>// 使用流处理
const fs = require('fs')
const readStream = fs.createReadStream('large-file.txt')
readStream.on('data', (chunk) => {
  console.log(chunk)
})</code></pre>`,
    coverImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800',
    summary: 'Node.js 应用性能优化的实战技巧，提升应用响应速度和吞吐量',
    category: '后端开发',
    tags: ['Node.js', '性能优化', 'JavaScript'],
    status: 'published',
    author: {
      name: '王五',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang',
      bio: '后端架构师'
    },
    views: 756,
    likes: 54,
    isTop: false,
    allowComment: true
  },
  {
    title: 'MongoDB 聚合管道完全指南',
    content: `<h2>聚合框架</h2>
<p>MongoDB 的聚合框架提供了强大的数据处理能力。</p>

<h3>常用阶段</h3>
<ol>
  <li>$match - 过滤文档</li>
  <li>$group - 分组聚合</li>
  <li>$sort - 排序</li>
  <li>$project - 投影</li>
</ol>

<pre><code>db.articles.aggregate([
  { $match: { status: 'published' } },
  { $group: { _id: '$category', count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])</code></pre>`,
    coverImage: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800',
    summary: '深入理解 MongoDB 聚合管道的使用方法和高级技巧',
    category: '数据库',
    tags: ['MongoDB', '数据库', 'NoSQL'],
    status: 'published',
    author: {
      name: '赵六',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhao',
      bio: '数据库专家'
    },
    views: 634,
    likes: 42,
    isTop: false,
    allowComment: true
  },
  {
    title: 'React Hooks 进阶指南',
    content: `<h2>自定义 Hooks</h2>
<p>自定义 Hooks 是 React 代码复用的重要方式。</p>

<h3>useLocalStorage Hook</h3>
<pre><code>function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : initialValue
  })
  
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])
  
  return [value, setValue]
}</code></pre>`,
    coverImage: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=800',
    summary: 'React Hooks 的高级用法和自定义 Hooks 开发实践',
    category: '前端开发',
    tags: ['React', 'JavaScript', 'Hooks'],
    status: 'published',
    author: {
      name: '孙七',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sun',
      bio: 'React 开发者'
    },
    views: 523,
    likes: 38,
    isTop: false,
    allowComment: true
  },
  {
    title: 'CSS Grid 布局完全指南',
    content: `<h2>Grid 布局基础</h2>
<p>CSS Grid 是现代网页布局的强大工具。</p>

<h3>基本语法</h3>
<pre><code>.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.item {
  grid-column: span 2;
}</code></pre>

<h3>响应式设计</h3>
<p>结合媒体查询，Grid 可以轻松实现响应式布局。</p>`,
    coverImage: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=800',
    summary: '从基础到高级的 CSS Grid 布局教程，掌握现代网页布局技术',
    category: '前端开发',
    tags: ['CSS', 'Grid', '布局'],
    status: 'published',
    author: {
      name: '周八',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhou',
      bio: 'CSS 设计师'
    },
    views: 467,
    likes: 31,
    isTop: false,
    allowComment: true
  },
  {
    title: 'Docker 容器化部署实战',
    content: `<h2>Docker 基础</h2>
<p>容器化技术改变了应用部署的方式。</p>

<h3>Dockerfile 示例</h3>
<pre><code>FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]</code></pre>

<h3>Docker Compose</h3>
<p>使用 Docker Compose 编排多容器应用。</p>`,
    coverImage: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800',
    summary: 'Docker 容器化技术从入门到实战的完整教程',
    category: '运维部署',
    tags: ['Docker', '容器化', 'DevOps'],
    status: 'published',
    author: {
      name: '吴九',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wu',
      bio: 'DevOps 工程师'
    },
    views: 389,
    likes: 27,
    isTop: false,
    allowComment: true
  },
  {
    title: 'Git 工作流最佳实践',
    content: `<h2>Git Flow</h2>
<p>Git Flow 是一种广泛使用的分支管理策略。</p>

<h3>分支类型</h3>
<ul>
  <li>master - 生产环境</li>
  <li>develop - 开发环境</li>
  <li>feature - 功能分支</li>
  <li>release - 发布分支</li>
  <li>hotfix - 热修复分支</li>
</ul>

<pre><code># 创建功能分支
git checkout -b feature/new-feature develop

# 合并到开发分支
git checkout develop
git merge --no-ff feature/new-feature</code></pre>`,
    coverImage: 'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=800',
    summary: 'Git 分支管理和团队协作的最佳实践指南',
    category: '工具效率',
    tags: ['Git', '版本控制', '团队协作'],
    status: 'published',
    author: {
      name: '郑十',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zheng',
      bio: '技术负责人'
    },
    views: 298,
    likes: 22,
    isTop: false,
    allowComment: true
  },
  {
    title: 'WebSocket 实时通信技术',
    content: `<h2>WebSocket 协议</h2>
<p>WebSocket 提供了双向通信能力。</p>

<h3>服务端实现</h3>
<pre><code>const WebSocket = require('ws')
const wss = new WebSocket.Server({ port: 8080 })

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    console.log('received: %s', message)
  })
  ws.send('Welcome!')
})</code></pre>

<h3>客户端使用</h3>
<pre><code>const ws = new WebSocket('ws://localhost:8080')
ws.onmessage = (event) => {
  console.log(event.data)
}</code></pre>`,
    coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800',
    summary: 'WebSocket 实时通信技术的原理和实战应用',
    category: '前端开发',
    tags: ['WebSocket', '实时通信', 'JavaScript'],
    status: 'published',
    author: {
      name: '钱十一',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=qian',
      bio: '全栈工程师'
    },
    views: 212,
    likes: 18,
    isTop: false,
    allowComment: true
  },
  {
    title: 'Webpack 5 配置指南',
    content: `<h2>Webpack 5 新特性</h2>
<p>Webpack 5 带来了许多改进和新功能。</p>

<h3>模块联邦</h3>
<p>模块联邦允许多个独立的构建共享代码。</p>

<pre><code>new ModuleFederationPlugin({
  name: 'app1',
  remotes: {
    app2: 'app2@http://localhost:3002/remoteEntry.js'
  },
  shared: ['react', 'react-dom']
})</code></pre>

<h3>持久化缓存</h3>
<p>改进的缓存机制大幅提升构建速度。</p>`,
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
    summary: 'Webpack 5 的新特性和配置优化技巧',
    category: '前端开发',
    tags: ['Webpack', '构建工具', 'JavaScript'],
    status: 'published',
    author: {
      name: '孙十二',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sun12',
      bio: '前端架构师'
    },
    views: 176,
    likes: 14,
    isTop: false,
    allowComment: true
  },
  {
    title: 'Nginx 反向代理配置详解',
    content: `<h2>反向代理</h2>
<p>Nginx 作为反向代理服务器的配置方法。</p>

<h3>基础配置</h3>
<pre><code>server {
  listen 80;
  server_name example.com;
  
  location / {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}</code></pre>

<h3>负载均衡</h3>
<pre><code>upstream backend {
  server backend1.example.com;
  server backend2.example.com;
}

server {
  location / {
    proxy_pass http://backend;
  }
}</code></pre>`,
    coverImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800',
    summary: 'Nginx 反向代理和负载均衡的配置实践',
    category: '运维部署',
    tags: ['Nginx', '反向代理', '负载均衡'],
    status: 'published',
    author: {
      name: '李十三',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=li13',
      bio: '运维工程师'
    },
    views: 145,
    likes: 11,
    isTop: false,
    allowComment: true
  },
  {
    title: 'RESTful API 设计原则',
    content: `<h2>REST 架构风格</h2>
<p>设计优雅的 RESTful API 需要遵循一定的原则。</p>

<h3>URL 设计</h3>
<ul>
  <li>使用名词而非动词</li>
  <li>使用复数形式</li>
  <li>层级清晰</li>
</ul>

<pre><code>GET    /articles       获取文章列表
GET    /articles/:id   获取单篇文章
POST   /articles       创建文章
PUT    /articles/:id   更新文章
DELETE /articles/:id   删除文章</code></pre>

<h3>状态码</h3>
<p>正确使用 HTTP 状态码表达响应状态。</p>`,
    coverImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800',
    summary: 'RESTful API 设计的核心原则和最佳实践',
    category: '后端开发',
    tags: ['RESTful', 'API', '架构设计'],
    status: 'published',
    author: {
      name: '周十四',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhou14',
      bio: 'API 架构师'
    },
    views: 123,
    likes: 9,
    isTop: false,
    allowComment: true
  },
  {
    title: 'Redis 缓存策略与实践',
    content: `<h2>缓存策略</h2>
<p>Redis 作为缓存的常见使用场景和策略。</p>

<h3>缓存模式</h3>
<ol>
  <li>Cache-Aside - 旁路缓存</li>
  <li>Read-Through - 读穿透</li>
  <li>Write-Through - 写穿透</li>
  <li>Write-Behind - 写回</li>
</ol>

<pre><code>// Cache-Aside 模式
async function getUser(id) {
  let user = await redis.get(\`user:\${id}\`)
  if (!user) {
    user = await db.users.findById(id)
    await redis.set(\`user:\${id}\`, JSON.stringify(user))
  }
  return JSON.parse(user)
}</code></pre>`,
    coverImage: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800',
    summary: 'Redis 缓存的使用策略和最佳实践指南',
    category: '数据库',
    tags: ['Redis', '缓存', '性能优化'],
    status: 'published',
    author: {
      name: '吴十五',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wu15',
      bio: '缓存专家'
    },
    views: 98,
    likes: 7,
    isTop: false,
    allowComment: true
  },
  {
    title: 'GraphQL 入门与实践',
    content: `<h2>GraphQL 简介</h2>
<p>GraphQL 是一种 API 查询语言。</p>

<h3>定义 Schema</h3>
<pre><code>type Query {
  user(id: ID!): User
  articles: [Article]
}

type User {
  id: ID!
  name: String!
  email: String!
  articles: [Article]
}

type Article {
  id: ID!
  title: String!
  content: String!
  author: User!
}</code></pre>

<h3>查询示例</h3>
<pre><code>query {
  user(id: "1") {
    name
    articles {
      title
    }
  }
}</code></pre>`,
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
    summary: 'GraphQL 的基础概念和实战应用教程',
    category: '后端开发',
    tags: ['GraphQL', 'API', 'JavaScript'],
    status: 'published',
    author: {
      name: '郑十六',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zheng16',
      bio: 'GraphQL 开发者'
    },
    views: 87,
    likes: 6,
    isTop: false,
    allowComment: true
  },
  {
    title: 'Tailwind CSS 实用技巧',
    content: `<h2>实用优先的 CSS 框架</h2>
<p>Tailwind CSS 提供了丰富的实用类。</p>

<h3>自定义配置</h3>
<pre><code>module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981'
      },
      spacing: {
        '128': '32rem'
      }
    }
  }
}</code></pre>

<h3>响应式设计</h3>
<pre><code>&lt;div class="w-full md:w-1/2 lg:w-1/3"&gt;
  响应式布局
&lt;/div&gt;</code></pre>`,
    coverImage: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=800',
    summary: 'Tailwind CSS 的高效使用技巧和最佳实践',
    category: '前端开发',
    tags: ['Tailwind CSS', 'CSS', '样式框架'],
    status: 'published',
    author: {
      name: '王十七',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang17',
      bio: 'UI 开发者'
    },
    views: 76,
    likes: 5,
    isTop: false,
    allowComment: true
  }
]

async function seedArticles() {
  try {
    // 连接数据库
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    console.log('✅ 数据库连接成功')

    // 清空现有文章
    await Article.deleteMany({})
    console.log('✅ 已清空现有文章')

    // 插入示例文章
    const articles = await Article.insertMany(sampleArticles)
    console.log(`✅ 成功插入 ${articles.length} 篇文章`)

    // 显示插入的文章
    articles.forEach((article, index) => {
      console.log(`${index + 1}. ${article.title} - ${article.category} - ${article.views} 阅读`)
    })

    process.exit(0)
  } catch (error) {
    console.error('❌ 错误:', error)
    process.exit(1)
  }
}

// 执行脚本
seedArticles()
