import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import HomeView from '@/pages/HomeView.vue'
import AboutView from '@/pages/AboutView.vue'
// import ArticlesView from '@/pages/ArticlesView.vue'
// import PortfolioView from '@/pages/PortfolioView.vue'
// import SitesView from '@/pages/SitesView.vue'
// import SponsorView from '@/pages/SponsorView.vue'

// 定义路由配置
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: {
      title: '首页'
    }
  },
  {
    path: '/about',
    name: 'about',
    component: AboutView,
    meta: {
      title: '关于我'
    }
  },

  // {
  //   path: '/sponsor',
  //   name: 'sponsor',
  //   component: SponsorView,
  //   meta: {
  //     title: '赞助支持'
  //   }
  // },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: HomeView,
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

export default router
