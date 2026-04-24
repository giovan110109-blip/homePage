import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

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

})

export default router
