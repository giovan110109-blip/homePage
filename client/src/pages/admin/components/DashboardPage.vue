<template>
  <div class="w-full h-full flex flex-col overflow-auto">
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">仪表板</h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">欢迎回到管理后台</p>
    </div>

    <!-- Dashboard Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
      <el-card shadow="hover">
        <template #header>
          <div class="flex justify-between items-center font-semibold text-gray-900 dark:text-white">
            <span>总访问</span>
            <Eye class="w-5 h-5" />
          </div>
        </template>
        <div class="text-3xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent mb-2">24,563</div>
        <div class="text-sm text-green-600 dark:text-green-400 font-medium">↑ 12% 相比上周</div>
      </el-card>

      <el-card shadow="hover">
        <template #header>
          <div class="flex justify-between items-center font-semibold text-gray-900 dark:text-white">
            <span>活跃用户</span>
            <Users class="w-5 h-5" />
          </div>
        </template>
        <div class="text-3xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent mb-2">1,243</div>
        <div class="text-sm text-green-600 dark:text-green-400 font-medium">↑ 8% 相比上周</div>
      </el-card>

      <el-card shadow="hover">
        <template #header>
          <div class="flex justify-between items-center font-semibold text-gray-900 dark:text-white">
            <span>留言数</span>
            <MessageSquare class="w-5 h-5" />
          </div>
        </template>
        <div class="text-3xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent mb-2">563</div>
        <div class="text-sm text-green-600 dark:text-green-400 font-medium">↑ 24% 相比上周</div>
      </el-card>

      <el-card shadow="hover">
        <template #header>
          <div class="flex justify-between items-center font-semibold text-gray-900 dark:text-white">
            <span>项目数</span>
            <Briefcase class="w-5 h-5" />
          </div>
        </template>
        <div class="text-3xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent mb-2">45</div>
        <div class="text-sm text-green-600 dark:text-green-400 font-medium">↑ 5% 相比上周</div>
      </el-card>
    </div>

    <!-- Recent Activity -->
    <el-card shadow="hover">
      <template #header>
        <div class="flex items-center justify-between gap-4 font-semibold text-gray-900 dark:text-white">
          <span>最近活动</span>
          <Clock class="w-5 h-5" />
        </div>
      </template>

      <el-table :data="recentActivity" stripe>
        <el-table-column
          prop="title"
          label="标题"
          width="200"
        ></el-table-column>
        <el-table-column prop="type" label="类型" width="100">
          <template #default="scope">
            <el-tag :type="getTagType(scope.row.type)">{{
              scope.row.type
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="date" label="时间" width="180"></el-table-column>
        <el-table-column label="操作" width="100">
          <template #default>
            <AppButton variant="link-primary" size="none">查看</AppButton>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Eye, Users, MessageSquare, Briefcase, Clock } from "lucide-vue-next";
import AppButton from "@/components/ui/AppButton.vue";

const recentActivity = ref([
  { title: "新用户注册", type: "用户", date: "2026-01-26 10:30" },
  { title: "新留言", type: "留言", date: "2026-01-26 09:45" },
  { title: "项目更新", type: "项目", date: "2026-01-26 08:20" },
  { title: "系统维护", type: "系统", date: "2026-01-25 20:00" },
]);

const getTagType = (type: string) => {
  const typeMap: Record<string, string> = {
    用户: "success",
    留言: "info",
    项目: "warning",
    系统: "danger",
  };
  return typeMap[type] || "info";
};
</script>
