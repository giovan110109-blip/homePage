<template>
  <el-container
    class="h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300"
  >
    <!-- 顶部导航栏：Glassmorphism 风格 -->
    <el-header
      class="sticky top-0 z-40 flex items-center justify-between h-16 px-4 lg:px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 shadow-sm"
    >
      <!-- 左侧：Logo + Title -->
      <div class="flex items-center gap-3 min-w-0 flex-1">
        <!-- 侧边栏折叠按钮（PC 端） -->
        <button
          @click="sidebarCollapsed = !sidebarCollapsed"
          class="hidden lg:flex items-center justify-center w-9 h-9 rounded-lg hover:bg-indigo-100 dark:hover:bg-slate-800 transition-colors duration-200 cursor-pointer text-slate-700 dark:text-slate-300"
          aria-label="切换侧边栏"
        >
          <component
            :is="sidebarCollapsed ? ChevronRight : ChevronLeft"
            class="w-5 h-5"
          />
        </button>

        <!-- Logo 和标题 -->
        <div class="hidden sm:block">
          <div
            class="text-base lg:text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
          >
            Dashboard
          </div>
          <div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            欢迎回来
          </div>
        </div>

        <!-- 移动端菜单按钮 -->
        <button
          @click="mobileMenuOpen = true"
          class="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-indigo-100 dark:hover:bg-slate-800 transition-colors duration-200 cursor-pointer"
          aria-label="打开菜单"
        >
          <Menu class="w-5 h-5 text-slate-700 dark:text-slate-300" />
        </button>
      </div>

      <!-- 右侧：用户菜单和操作 -->
      <div class="flex items-center gap-3">
        <!-- 用户名显示（大屏） -->
        <span
          class="hidden sm:inline text-sm text-slate-600 dark:text-slate-400"
        >
          {{ authStore.user?.nickname || "admin" }}
        </span>

        <!-- 头像下拉菜单 -->
        <el-dropdown
          trigger="click"
          placement="bottom-end"
          @command="handleCommand"
        >
          <div
            class="flex items-center justify-center w-9 h-9 rounded-lg cursor-pointer hover:shadow-lg transition-shadow duration-200 "
          >
            <img class="w-9 h-9  rounded-lg " :src="authStore.user?.avatar" />
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">
                <div class="flex items-center gap-2">
                  <User class="w-4 h-4" />
                  <span>个人信息</span>
                </div>
              </el-dropdown-item>
              <el-dropdown-item command="home">
                <div class="flex items-center gap-2">
                  <Home class="w-4 h-4" />
                  <span>前往首页</span>
                </div>
              </el-dropdown-item>
              <el-dropdown-item divided command="logout">
                <div class="flex items-center gap-2">
                  <LogOut class="w-4 h-4" />
                  <span>退出登录</span>
                </div>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>

    <!-- 主容器 -->
    <el-container class="flex-1 min-h-0">
      <!-- 侧边栏：响应式折叠 -->
      <el-aside
        class="hidden lg:block h-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-700/50 transition-all duration-300 ease-in-out overflow-hidden"
        :width="sidebarCollapsed ? '72px' : '240px'"
        :style="{ minWidth: sidebarCollapsed ? '72px' : '240px' }"
      >
        <el-scrollbar class="h-full">
          <el-menu
            class="border-r-0 bg-transparent"
            :default-active="activeMenu"
            :collapse="sidebarCollapsed"
            @select="syncActiveMenu($event)"
          >
            <el-menu-item
              v-for="item in menuItems"
              :key="item.id"
              :index="item.id"
              class="menu-item-custom transition-all duration-200"
            >
              <component :is="item.icon" class="w-5 h-5" />
              <template #title>
                <span class="ml-2">{{ item.label }}</span>
              </template>
            </el-menu-item>
          </el-menu>
        </el-scrollbar>
      </el-aside>

      <!-- 主内容区 -->
      <el-main
        class="flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto bg-transparent min-h-0"
      >
        <div class="w-full flex-1 flex flex-col h-full">
          <KeepAlive>
            <component :is="currentComponent" />
          </KeepAlive>
        </div>
      </el-main>
    </el-container>

    <!-- 底部栏：简洁设计 -->
    <el-footer
      class="h-12 flex items-center justify-center text-xs text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-900/50 border-t border-slate-200/50 dark:border-slate-700/50 backdrop-blur-xl"
    >
      <span>© 2026 Admin Dashboard. All rights reserved.</span>
    </el-footer>

    <!-- 移动端抽屉菜单 -->
    <el-drawer
      v-model="mobileMenuOpen"
      title="导航菜单"
      size="280px"
      direction="ltr"
      class="lg:hidden"
    >
      <el-menu
        :default-active="activeMenu"
        @select="handleMobileSelect"
        class="border-r-0"
      >
        <el-menu-item
          v-for="item in menuItems"
          :key="item.id"
          :index="item.id"
          class="menu-item-custom"
        >
          <component :is="item.icon" class="w-5 h-5" />
          <template #title>
            <span>{{ item.label }}</span>
          </template>
        </el-menu-item>
      </el-menu>
    </el-drawer>

    <!-- 个人信息弹窗 -->
    <ProfileDialog
      v-model="profileDialogVisible"
      @updated="handleProfileUpdated"
    />
  </el-container>
</template>

<script setup lang="ts">
import {
  LayoutDashboard,
  MessageSquare,
  Settings,
  Heart,
  Activity,
  Users,
  Menu,
  User,
  ChevronLeft,
  ChevronRight,
  Link,
  FileText,
  Home,
  LogOut,
  Image,
} from "lucide-vue-next";
import { ref, computed, onMounted, watch } from "vue";
import DashboardPage from "./components/DashboardPage.vue";
import UsersPage from "./components/UsersPage.vue";
import MessagesPage from "./components/MessagesPage.vue";
import AccessLogsPage from "./components/AccessLogsPage.vue";
import SettingsPage from "./components/SettingsPage.vue";
import SponsorsPage from "./components/SponsorsPage.vue";
import FriendLinksPage from "./components/FriendLinksPage.vue";
import ArticlesPage from "./components/ArticlesPage.vue";
import PhotosPage from "./components/PhotosPage.vue";
import ProfileDialog from "./components/ProfileDialog.vue";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";
import { getAssetURL } from "@/utils";

const sidebarCollapsed = ref(false);
const ACTIVE_MENU_KEY = "admin:active-menu";
const mobileMenuOpen = ref(false);
const profileDialogVisible = ref(false);
const authStore = useAuthStore();
const router = useRouter();

const menuItems = [
  { id: "dashboard", label: "仪表板", icon: LayoutDashboard },
  { id: "users", label: "用户管理", icon: Users },
  { id: "messages", label: "留言管理", icon: MessageSquare },
  { id: "articles", label: "文章管理", icon: FileText },
  { id: "photos", label: "相册管理", icon: Image },
  { id: "friendLinks", label: "友链管理", icon: Link },
  { id: "accessLogs", label: "访问记录", icon: Activity },
  { id: "sponsors", label: "赞助管理", icon: Heart },
  { id: "settings", label: "系统设置", icon: Settings },
];

// 动态组件映射
const componentMap: Record<string, any> = {
  dashboard: DashboardPage,
  users: UsersPage,
  messages: MessagesPage,
  articles: ArticlesPage,
  photos: PhotosPage,
  friendLinks: FriendLinksPage,
  accessLogs: AccessLogsPage,
  sponsors: SponsorsPage,
  settings: SettingsPage,
};

const getInitialMenu = () => {
  try {
    const saved = localStorage.getItem(ACTIVE_MENU_KEY);
    if (saved && componentMap[saved]) return saved;
  } catch (_) {
    // ignore
  }
  return "dashboard";
};

const activeMenu = ref(getInitialMenu());

// 根据activeMenu返回对应的组件
const currentComponent = computed(() => {
  return componentMap[activeMenu.value] || DashboardPage;
});

const syncActiveMenu = (value: string) => {
  activeMenu.value = value;
  localStorage.setItem(ACTIVE_MENU_KEY, value);
};

const handleMobileSelect = (value: string) => {
  syncActiveMenu(value);
  mobileMenuOpen.value = false;
};

const handleCommand = (command: string) => {
  if (command === "profile") {
    profileDialogVisible.value = true;
  } else if (command === "home") {
    router.push("/");
  } else if (command === "logout") {
    handleLogout();
  }
};

const handleProfileUpdated = () => {
  // 个人信息更新后，可以刷新用户信息
  // 如果需要更新显示的用户名等信息
};

const handleLogout = () => {
  authStore.logout();
  router.replace("/admin/login");
};

watch(activeMenu, (value) => {
  localStorage.setItem(ACTIVE_MENU_KEY, value);
});
</script>
<style scoped>
/* ============================================
   Glassmorphism Design System
   Color: Indigo (#6366F1) + Emerald (#10B981)
   Typography: Fira Code + Fira Sans
   Motion: 150-300ms smooth transitions
   ============================================ */

:deep(.el-menu) {
  background-color: transparent;
  border-right: none;
}

:deep(.el-menu-item) {
  background-color: transparent;
  color: #64748b;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.el-menu-item:hover) {
  background-color: #6366f1 !important;
  color: white !important;
}

:deep(.el-menu-item.is-active) {
  background-color: #6366f1 !important;
  color: white !important;
  border-right: 3px solid #10b981;
}

/* 自定义菜单项样式 */
.menu-item-custom {
  border-radius: 8px;
  margin: 4px 8px;
  padding-left: 16px !important;
  padding-right: 16px !important;
}

:deep(.el-menu-item.menu-item-custom) {
  height: 40px;
  line-height: 40px;
}

/* 折叠状态下的菜单项 */
:deep(.el-menu--collapse .el-menu-item) {
  padding-left: 22px !important;
  padding-right: 22px !important;
}

/* Header 样式 */
:deep(.el-header) {
  padding-left: 24px;
  padding-right: 24px;
}

/* Dropdown 菜单美化 */
:deep(.el-dropdown-menu) {
  background-color: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 12px;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

:deep(.el-dropdown-menu__item) {
  color: #334155;
  padding: 10px 16px;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 6px;
  margin: 4px 8px;
}

:deep(.el-dropdown-menu__item:hover) {
  background-color: #e0e7ff;
  color: #6366f1;
}

/* Dark mode 支持 */
@media (prefers-color-scheme: dark) {
  :deep(.el-menu) {
    background-color: transparent;
  }

  :deep(.el-menu-item) {
    color: #cbd5e1;
  }

  :deep(.el-menu-item:hover) {
    background-color: #6366f1 !important;
    color: white !important;
  }

  :deep(.el-dropdown-menu) {
    background-color: #1e293b;
    border-color: rgba(100, 116, 139, 0.2);
  }

  :deep(.el-dropdown-menu__item) {
    color: #cbd5e1;
  }

  :deep(.el-dropdown-menu__item:hover) {
    background-color: #312e81;
    color: #a5f3fc;
  }
}

/* 尊重用户的减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
  :deep(.el-menu-item),
  :deep(.el-dropdown-menu__item),
  button {
    transition: none !important;
  }
}

/* 响应式调整 */
@media (max-width: 640px) {
  :deep(.el-header) {
    padding-left: 16px;
    padding-right: 16px;
  }

  :deep(.el-main) {
    padding: 16px;
  }
}

/* 焦点状态（无障碍访问） */
:deep(.el-menu-item:focus),
button:focus {
  outline: 2px solid #6366f1;
  outline-offset: 2px;
}
</style>
