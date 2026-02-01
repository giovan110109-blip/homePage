<template>
  <div class="w-full h-full flex flex-col overflow-auto">
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">用户管理</h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">管理系统中的所有用户</p>
    </div>

    <el-card shadow="hover">
      <template #header>
        <div class="flex items-center justify-between font-semibold text-gray-900 dark:text-white">
          <span>用户列表</span>
          <AppButton variant="primary" size="sm">添加用户</AppButton>
        </div>
      </template>

      <el-table :data="users" stripe>
        <el-table-column prop="name" label="用户名" width="150"></el-table-column>
        <el-table-column prop="email" label="邮箱" width="200"></el-table-column>
        <el-table-column prop="role" label="角色" width="100">
          <template #default="scope">
            <el-tag>{{ scope.row.role }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === '活跃' ? 'success' : 'info'">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default>
            <AppButton variant="link-primary" size="none">编辑</AppButton>
            <AppButton variant="link-danger" size="none">删除</AppButton>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'

const users = ref([
  { name: 'Alice', email: 'alice@example.com', role: '管理员', status: '活跃' },
  { name: 'Bob', email: 'bob@example.com', role: '用户', status: '活跃' },
  { name: 'Charlie', email: 'charlie@example.com', role: '用户', status: '离线' },
  { name: 'Diana', email: 'diana@example.com', role: '编辑', status: '活跃' }
])
</script>
