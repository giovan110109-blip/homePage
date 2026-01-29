<template>
  <el-container class="h-screen bg-gradient-to-br from-blue-50 via-blue-50 to-slate-100 transition-all duration-300 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
    <!-- 顶部导航栏 -->
    <el-header class="flex items-center justify-between h-16 px-6 bg-white border-b border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-700">
      <div class="flex items-center gap-3">
        <el-button
          type="primary"
          plain
          size="small"
          @click="mobileMenuOpen = true"
          class="lg:hidden"
        >
          菜单
        </el-button>
        <div>
          <div class="text-lg font-bold text-gray-900 dark:text-white">管理后台</div>
          <div class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
            欢迎回来，{{ authStore.user?.username || "admin" }}
          </div>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <el-button type="danger" plain size="small" @click="handleLogout"
          >退出登录</el-button
        >
      </div>
    </el-header>

    <!-- 主容器 -->
    <el-container class="flex-1 min-h-0">
      <!-- 侧边栏 -->
      <el-aside
        class="hidden lg:block h-full bg-white/95 border-r border-slate-200 backdrop-blur-md transition-all duration-300 dark:bg-slate-900/95 dark:border-slate-700"
        :width="sidebarCollapsed ? '64px' : '240px'"
      >
        <el-scrollbar class="h-full">
          <el-menu
            class="border-r-0"
            :default-active="activeMenu"
            :collapse="sidebarCollapsed"
            @select="activeMenu = $event"
          >
            <el-menu-item
              v-for="item in menuItems"
              :key="item.id"
              :index="item.id"
              class="transition-all duration-200"
            >
              <component :is="item.icon" class="w-4.5 h-4.5" />
              <span class="ml-2.5">{{ item.label }}</span>
            </el-menu-item>
          </el-menu>
        </el-scrollbar>
      </el-aside>

      <!-- 主内容区 -->
      <el-main class="flex flex-col p-4 lg:p-4 overflow-y-auto bg-transparent min-h-0">
        <div class="w-full flex-1 flex flex-col h-full">
          <KeepAlive>
            <component :is="currentComponent" />
          </KeepAlive>
        </div>
      </el-main>
    </el-container>

    <!-- 底部栏 -->
    <el-footer class="h-12 flex items-center justify-center text-xs text-gray-600 bg-white border-t border-slate-200 dark:text-gray-400 dark:bg-slate-900 dark:border-slate-700">
      <span>© 2026 管理后台</span>
    </el-footer>

    <!-- 移动端抽屉菜单 -->
    <el-drawer
      v-model="mobileMenuOpen"
      title="菜单"
      size="70%"
      direction="ltr"
      class="lg:hidden"
    >
      <el-menu
        :default-active="activeMenu"
        @select="handleMobileSelect"
      >
        <el-menu-item v-for="item in menuItems" :key="item.id" :index="item.id">
          <component :is="item.icon" class="w-4.5 h-4.5" />
          <span class="ml-2.5">{{ item.label }}</span>
        </el-menu-item>
      </el-menu>
    </el-drawer>
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
} from "lucide-vue-next";
import DashboardPage from "./components/DashboardPage.vue";
import UsersPage from "./components/UsersPage.vue";
import MessagesPage from "./components/MessagesPage.vue";
import AccessLogsPage from "./components/AccessLogsPage.vue";
import SettingsPage from "./components/SettingsPage.vue";
import SponsorsPage from "./components/SponsorsPage.vue";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";

const sidebarCollapsed = ref(false);
const activeMenu = ref("dashboard");
const mobileMenuOpen = ref(false);
const authStore = useAuthStore();
const router = useRouter();

const menuItems = [
  { id: "dashboard", label: "仪表板", icon: LayoutDashboard },
  { id: "users", label: "用户管理", icon: Users },
  { id: "messages", label: "留言管理", icon: MessageSquare },
  { id: "accessLogs", label: "访问记录", icon: Activity },
  { id: "sponsors", label: "赞助管理", icon: Heart },
  { id: "settings", label: "系统设置", icon: Settings },
];

// 动态组件映射
const componentMap: Record<string, any> = {
  dashboard: DashboardPage,
  users: UsersPage,
  messages: MessagesPage,
  accessLogs: AccessLogsPage,
  sponsors: SponsorsPage,
  settings: SettingsPage,
};

// 根据activeMenu返回对应的组件
const currentComponent = computed(() => {
  return componentMap[activeMenu.value] || DashboardPage;
});

const handleMobileSelect = (value: string) => {
  activeMenu.value = value;
  mobileMenuOpen.value = false;
};

const handleLogout = () => {
  authStore.logout();
  router.replace("/admin/login");
};
</script>
