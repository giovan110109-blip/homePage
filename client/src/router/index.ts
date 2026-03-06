import { createRouter, createWebHashHistory, type RouteRecordRaw, START_LOCATION } from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { useAuthStore } from '@/stores/auth'
import request from '@/api/request'

NProgress.configure({
  showSpinner: false,
  speed: 300,
  minimum: 0.1,
  trickleSpeed: 200,
})
const { VITE_SITE_TITLE, VITE_SITE_DESCRIPTION } = import.meta.env
// 定义路由配置
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/pages/HomeView.vue'),
    meta: {
      title: '首页'
    }
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('@/pages/AboutView.vue'),
    meta: {
      title: '关于我'
    }
  },
    {
    path: '/sites',
    name: 'sites',
    component: () => import('@/pages/WebsiteStatusView.vue'),
    meta: {
      title: '网站'
    }
  },
    {
    path: '/note',
    name: 'note',
    component: () => import('@/pages/GuestbookView.vue'),
    meta: {
      title: '留言板'
    }
  },
  {
    path: '/friends',
    name: 'friends',
    component: () => import('@/pages/FriendLinksView.vue'),
    meta: {
      title: '朋友圈'
    }
  },
  {
    path: '/articles',
    name: 'articles',
    component: () => import('@/pages/ArticlesView.vue'),
    meta: {
      title: '文章列表'
    }
  },
  {
    path: '/articles/:id',
    name: 'article-detail',
    component: () => import('@/pages/ArticleDetailView.vue'),
    meta: {
      title: '文章详情'
    }
  },
  {
    path: '/moments',
    name: 'moments',
    component: () => import('@/pages/MomentsView.vue'),
    meta: {
      title: '说说'
    }
  },
  {
    path: '/gallery',
    name: 'gallery',
    component: () => import('@/pages/GalleryView.vue'),
    meta: {
      title: '相册'
    }
  },
  {
    path: '/map',
    name: 'map',
    component: () => import('@/pages/MapView.vue'),
    meta: {
      title: '地图'
    }
  },
  {
    path: '/go',
    name: 'external-link',
    component: () => import('@/pages/ExternalLinkView.vue'),
    meta: {
      title: '跳转提示'
    }
  },
    {
    path: '/admin',
    name: 'admin',
    component: () => import('@/pages/admin/AdminLayout.vue'),
    meta: {
        title: '后台管理',
        requiresAuth: true
    },
    children: [
      {
        path: '',
        name: 'admin-dashboard',
        component: () => import('@/pages/admin/DashboardPage.vue'),
        meta: { title: '仪表板', icon: 'LayoutDashboard', showInMenu: true, requiresAuth: true }
      },
      {
        path: 'users',
        name: 'admin-users',
        component: () => import('@/pages/admin/UsersPage.vue'),
        meta: { title: '用户管理', icon: 'Users', showInMenu: true, requiresAuth: true }
      },
      {
        path: 'roles',
        name: 'admin-roles',
        component: () => import('@/pages/admin/RolesPage.vue'),
        meta: { title: '角色管理', icon: 'Shield', showInMenu: true, requiresAuth: true }
      },
      {
        path: 'menus',
        name: 'admin-menus',
        component: () => import('@/pages/admin/MenusPage.vue'),
        meta: { title: '菜单管理', icon: 'Menu', showInMenu: true, requiresAuth: true }
      },
      {
        path: 'messages',
        name: 'admin-messages',
        component: () => import('@/pages/admin/MessagesPage.vue'),
        meta: { title: '留言管理', icon: 'MessageSquare', showInMenu: true, requiresAuth: true }
      },
      {
        path: 'articles',
        name: 'admin-articles',
        component: () => import('@/pages/admin/ArticlesPage.vue'),
        meta: { title: '文章管理', icon: 'FileText', showInMenu: true, requiresAuth: true }
      },
      {
        path: 'photos',
        name: 'admin-photos',
        component: () => import('@/pages/admin/PhotosPage.vue'),
        meta: { title: '相册管理', icon: 'Image', showInMenu: true, requiresAuth: true }
      },
      {
        path: 'moments',
        name: 'admin-moments',
        component: () => import('@/pages/admin/MomentsPage.vue'),
        meta: { title: '说说管理', icon: 'Sparkles', showInMenu: true, requiresAuth: true }
      },
      {
        path: 'friend-links',
        name: 'admin-friend-links',
        component: () => import('@/pages/admin/FriendLinksPage.vue'),
        meta: { title: '友链管理', icon: 'Link', showInMenu: true, requiresAuth: true }
      },
      {
        path: 'access-logs',
        name: 'admin-access-logs',
        component: () => import('@/pages/admin/AccessLogsPage.vue'),
        meta: { title: '访问记录', icon: 'Activity', showInMenu: true, requiresAuth: true }
      },
      {
        path: 'sponsors',
        name: 'admin-sponsors',
        component: () => import('@/pages/admin/SponsorsPage.vue'),
        meta: { title: '赞助管理', icon: 'Heart', showInMenu: true, requiresAuth: true }
      },
      {
        path: 'settings',
        name: 'admin-settings',
        component: () => import('@/pages/admin/SettingsPage.vue'),
        meta: { title: '系统设置', icon: 'Settings', showInMenu: true, requiresAuth: true }
      }
    ]
  },
    {
      path: '/admin/login',
      name: 'admin-login',
      component: () => import('@/pages/admin/AdminLogin.vue'),
      meta: {
        title: '后台登录'
      }
    },
  {
    path: '/sponsor',
    name: 'sponsor',
    component: () => import('@/pages/SponsorView.vue'),
    meta: {
      title: '赞助支持'
    }
  },
  {
    path: '/emote-test',
    name: 'emote-test',
    component: () => import('@/pages/EmoteTestView.vue'),
    meta: {
      title: '表情包测试'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/pages/HomeView.vue'),
    meta: {
      title: '首页'
    }
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach(async (to, _from, next) => {
  NProgress.start()
  const authStore = useAuthStore()
  
  if (to.meta?.requiresAuth && !authStore.isLoggedIn) {
    next({ name: 'admin-login', query: { redirect: to.fullPath } })
    return
  }

  if (to.path.startsWith('/admin') && to.path !== '/admin/login') {
    await authStore.fetchMenus()
    
    if (to.path !== '/admin' && !authStore.hasMenuPath(to.path)) {
      next({ name: 'admin-dashboard' })
      return
    }
  }
  
  next()
})

router.afterEach((to, from) => {
  NProgress.done()
  const pageTitle = to.meta?.title ? `${to.meta.title} - ${VITE_SITE_TITLE ?? ''}`.replace(/\s-\s$/, '') : VITE_SITE_TITLE
  if (pageTitle) {
    document.title = pageTitle
  }

  const description = (to.meta?.description as string | undefined) ?? VITE_SITE_DESCRIPTION
  if (description) {
    let metaDescription = document.querySelector('meta[name="description"]')
    if (!metaDescription) {
      metaDescription = document.createElement('meta')
      metaDescription.setAttribute('name', 'description')
      document.head.appendChild(metaDescription)
    }
    metaDescription.setAttribute('content', description)
  }

  if (to.path.startsWith('/admin')) return
  if (import.meta.env.DEV) return
  const isInitialNavigation = from === START_LOCATION
  if (!isInitialNavigation) return
  if (to.path !== '/') return
  const key = 'access-log:home'
  if (sessionStorage.getItem(key)) return
  sessionStorage.setItem(key, '1')
  request.post('/access-logs/ping', { path: to.fullPath, title: to.meta?.title }).catch(() => undefined)
})

export default router
