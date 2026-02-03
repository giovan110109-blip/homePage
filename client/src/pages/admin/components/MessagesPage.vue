<template>
  <div class="w-full h-full flex flex-col overflow-auto">
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">留言管理</h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
        管理所有的留言内容
      </p>
    </div>

    <el-card shadow="hover" class="h-full flex flex-col">
      <template #header>
        <div
          class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <span class="font-semibold text-gray-900 dark:text-white"
            >留言列表</span
          >
          <div class="flex gap-3 flex-wrap">
            <el-input
              v-model="filter.form.keyword"
              placeholder="搜索留言内容..."
              clearable
              style="width: 220px; height: 32px"
              @change="handleFetch"
            />
            <el-select
              v-model="filter.form.status"
              placeholder="状态"
              clearable
              style="width: 120px"
              @change="handleFetch"
            >
              <el-option label="已审核" value="approved" />
              <el-option label="待审核" value="pending" />
            </el-select>
            <AppButton variant="primary" size="sm" @click="handleFetch"
              >查询</AppButton
            >
            <AppButton variant="reset" size="sm" @click="handleReset"
              >重置</AppButton
            >
          </div>
        </div>
      </template>

      <el-table :data="filteredMessages" stripe v-loading="loading">
        <el-table-column label="头像" width="70">
          <template #default="scope">
            <div
              v-if="scope.row.avatar"
              class="avatar-html"
              v-html="scope.row.avatar"
            ></div>
            <el-avatar :size="36" v-else>{{
              scope.row.name?.slice(0, 1) || "访"
            }}</el-avatar>
          </template>
        </el-table-column>
        <el-table-column
          prop="name"
          label="留言者"
          width="120"
        ></el-table-column>
        <el-table-column
          prop="email"
          label="邮箱"
          min-width="200"
        ></el-table-column>
        <el-table-column
          prop="content"
          label="内容"
          min-width="320"
        ></el-table-column>
        <el-table-column prop="browser" label="浏览器" width="160">
          <template #default="scope">
            <span class="inline-flex items-center gap-1.5">
              <Globe class="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
              {{ scope.row.browser || "-" }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="os" label="操作系统" width="160">
          <template #default="scope">
            <span class="inline-flex items-center gap-1.5">
              <component
                :is="getOsIcon(scope.row.os)"
                class="w-3.5 h-3.5 text-gray-500 dark:text-gray-400"
              />
              {{ scope.row.os || "-" }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="deviceType" label="设备" width="120">
          <template #default="scope">
            <span class="inline-flex items-center gap-1.5">
              <component
                :is="getDeviceIcon(scope.row.deviceType)"
                class="w-3.5 h-3.5 text-gray-500 dark:text-gray-400"
              />
              {{ scope.row.deviceType || "-" }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="定位" width="200">
          <template #default="scope">
            <span class="inline-flex items-center gap-1.5">
              <MapPin class="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
              {{ formatLocation(scope.row.location) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag
              :type="scope.row.status === 'approved' ? 'success' : 'warning'"
            >
              {{ scope.row.status === "approved" ? "已审核" : "待审核" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <AppButton
              variant="link-primary"
              size="none"
              @click="handleView(scope.row)"
              >查看</AppButton
            >

            <AppButton
              variant="link-danger"
              size="none"
              @click="handleDelete(scope.row)"
              >删除</AppButton
            >
          </template>
        </el-table-column>
      </el-table>

      <div class="mt-6 flex justify-center">
        <el-pagination
          v-model:current-page="filter.form.page"
          v-model:page-size="filter.form.pageSize"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          :total="total"
          @size-change="handleFetch"
          @current-change="handleFetch"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="drawerVisible"
      title="留言详情"
      width="95%"
      :style="{ maxWidth: '600px' }"
      :close-on-click-modal="false"
    >
      <div v-if="currentRow" class="message-detail-container space-y-6">
        <!-- 用户信息卡片 -->
        <div
          class="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800/50 dark:to-slate-700/50 rounded-lg p-5 border border-indigo-200/50 dark:border-slate-600/50"
        >
          <div class="flex items-center gap-4">
            <div
              v-if="currentRow.avatar"
              class="avatar-html flex-shrink-0 w-14 h-14 rounded-full overflow-hidden border-2 border-indigo-200 dark:border-slate-500"
              v-html="currentRow.avatar"
            ></div>
            <el-avatar
              v-else
              :size="56"
              class="flex-shrink-0 border-2 border-indigo-200 dark:border-slate-500"
            >
              {{ currentRow.name?.slice(0, 1) || "访" }}
            </el-avatar>
            <div class="flex-1 min-w-0">
              <h3
                class="text-lg font-bold text-slate-900 dark:text-white truncate"
              >
                {{ currentRow.name }}
              </h3>
              <p class="text-sm text-slate-600 dark:text-slate-300 truncate">
                {{ currentRow.email }}
              </p>
              <div class="flex items-center gap-2 mt-2">
                <el-tag
                  :type="
                    currentRow.status === 'approved' ? 'success' : 'warning'
                  "
                  size="small"
                >
                  {{ currentRow.status === "approved" ? "已审核" : "待审核" }}
                </el-tag>
                <span class="text-xs text-slate-500 dark:text-slate-400">
                  {{ formatDate(currentRow.createdAt) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 联系方式 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            class="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700"
          >
            <div
              class="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-1"
            >
              网站
            </div>
            <div class="text-sm text-slate-900 dark:text-slate-100 break-all">
              <a
                v-if="currentRow.website"
                :href="currentRow.website"
                target="_blank"
                rel="noopener noreferrer"
                class="text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {{ currentRow.website }}
              </a>
              <span v-else class="text-slate-400">-</span>
            </div>
          </div>
          <div
            class="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700"
          >
            <div
              class="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-1"
            >
              IP地址
            </div>
            <div class="text-sm text-slate-900 dark:text-slate-100 font-mono">
              {{ currentRow.ip || "-" }}
            </div>
          </div>
        </div>

        <!-- 设备信息 -->
        <div
          class="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700"
        >
          <div
            class="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-3"
          >
            设备信息
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="flex items-center gap-2">
              <Globe class="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <div>
                <div class="text-xs text-slate-500 dark:text-slate-400">
                  浏览器
                </div>
                <div class="text-sm text-slate-900 dark:text-slate-100">
                  {{ currentRow.browser || "-" }}
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <component
                :is="getOsIcon(currentRow.os)"
                class="w-4 h-4 text-indigo-500 flex-shrink-0"
              />
              <div>
                <div class="text-xs text-slate-500 dark:text-slate-400">
                  操作系统
                </div>
                <div class="text-sm text-slate-900 dark:text-slate-100">
                  {{ currentRow.os || "-" }}
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <component
                :is="getDeviceIcon(currentRow.deviceType)"
                class="w-4 h-4 text-indigo-500 flex-shrink-0"
              />
              <div>
                <div class="text-xs text-slate-500 dark:text-slate-400">
                  设备类型
                </div>
                <div class="text-sm text-slate-900 dark:text-slate-100">
                  {{ currentRow.deviceType || "-" }}
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <MapPin class="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <div>
                <div class="text-xs text-slate-500 dark:text-slate-400">
                  地址
                </div>
                <div class="text-sm text-slate-900 dark:text-slate-100">
                  {{ formatLocation(currentRow.location) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 留言内容 -->
        <div
          class="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700"
        >
          <div
            class="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-3"
          >
            留言内容
          </div>
          <p
            class="text-sm text-slate-900 dark:text-slate-100 leading-relaxed whitespace-pre-wrap break-words"
          >
            {{ currentRow.content }}
          </p>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <AppButton variant="reset" size="sm" @click="drawerVisible = false"
            >关闭</AppButton
          >
          <AppButton
            variant="success"
            size="sm"
            :disabled="currentRow?.status === 'approved'"
            @click="handleApproveFromDialog"
          >
            审核通过
          </AppButton>
          <AppButton variant="danger" size="sm" @click="handleDeleteFromDialog"
            >删除</AppButton
          >
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import request from "@/api/request";
import AppButton from "@/components/ui/AppButton.vue";
import { useMessageFilterForm } from "@/composables/useMessageFilterForm";
import { useTableFetch } from "@/composables/useTableFetch";
import {
  Globe,
  Monitor,
  Smartphone,
  MapPin,
  Apple,
  Laptop,
} from "lucide-vue-next";

interface MessageItem {
  _id: string;
  name: string;
  email: string;
  website?: string;
  avatar?: string;
  content: string;
  status: "approved" | "pending";
  createdAt: string;
  browser?: string;
  os?: string;
  deviceType?: string;
  ip?: string;
  location?: {
    city?: string;
    region?: string;
    country?: string;
    isp?: string;
  };
}

const filter = useMessageFilterForm({ keyword: "", status: "", pageSize: 10 });
const {
  data: messages,
  total,
  loading,
  fetch: fetchMessages,
} = useTableFetch<MessageItem, Record<string, any>>((params) =>
  request.get("/admin/messages", { params }),
);
const drawerVisible = ref(false);
const currentRow = ref<MessageItem | null>(null);

const filteredMessages = computed(() => {
  const keyword = (filter.form.keyword || "").trim();
  if (!keyword) return messages.value;
  return messages.value.filter((item) => item.content?.includes(keyword));
});

const handleFetch = async () => {
  try {
    await fetchMessages(filter.toParams());
  } catch (error: any) {
    ElMessage.error(error?.message || "加载留言失败");
  }
};

const handleReset = () => {
  filter.reset();
  handleFetch();
};

const handleView = (row: MessageItem) => {
  currentRow.value = row;
  drawerVisible.value = true;
};

const handleApprove = async (row: MessageItem) => {
  try {
    await ElMessageBox.confirm("确认审核通过该留言吗？", "提示", {
      type: "warning",
    });
    await request.patch(`/admin/messages/${row._id}/approve`);
    ElMessage.success("已审核");
    handleFetch();
  } catch (error: any) {
    if (error?.message) ElMessage.error(error.message);
  }
};

const handleDelete = async (row: MessageItem) => {
  try {
    await ElMessageBox.confirm("确认删除该留言吗？此操作不可恢复。", "提示", {
      type: "warning",
    });
    await request.delete(`/admin/messages/${row._id}`);
    ElMessage.success("已删除");
    handleFetch();
  } catch (error: any) {
    if (error?.message) ElMessage.error(error.message);
  }
};

const handleApproveFromDialog = async () => {
  if (!currentRow.value) return;
  try {
    await ElMessageBox.confirm("确认审核通过该留言吗？", "提示", {
      type: "warning",
    });
    await request.patch(`/admin/messages/${currentRow.value._id}/approve`);
    ElMessage.success("已审核");
    drawerVisible.value = false;
    handleFetch();
  } catch (error: any) {
    if (error?.message) ElMessage.error(error.message);
  }
};

const handleDeleteFromDialog = async () => {
  if (!currentRow.value) return;
  try {
    await ElMessageBox.confirm("确认删除该留言吗？此操作不可恢复。", "提示", {
      type: "warning",
    });
    await request.delete(`/admin/messages/${currentRow.value._id}`);
    ElMessage.success("已删除");
    drawerVisible.value = false;
    handleFetch();
  } catch (error: any) {
    if (error?.message) ElMessage.error(error.message);
  }
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const formatLocation = (location?: MessageItem["location"]) => {
  if (!location) return "-";
  const parts = [location.country, location.region, location.city].filter(
    Boolean,
  );
  return parts.length ? parts.join(" / ") : "-";
};

const getOsIcon = (os?: string) => {
  const value = (os || "").toLowerCase();
  if (value.includes("mac") || value.includes("os x") || value.includes("ios"))
    return Apple;
  if (value.includes("windows") || value.includes("win")) return Laptop;
  return Monitor;
};

const getDeviceIcon = (device?: string) => {
  const value = (device || "").toLowerCase();
  if (value.includes("mobile") || value.includes("phone")) return Smartphone;
  if (value.includes("desktop") || value.includes("pc")) return Monitor;
  return Monitor;
};

onMounted(() => {
  handleFetch();
});
</script>

<style scoped>
:deep(.avatar-html) {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #e5e7eb;
}

:deep(.avatar-html svg) {
  width: 36px;
  height: 36px;
}

:deep(.el-table .cell),
:deep(.el-table__body-wrapper .cell) {
  white-space: normal !important;
  word-break: break-word;
}

:deep(.el-table__body td) {
  white-space: normal;
}

:deep(.el-table__fixed-right) {
  background: #ffffff;
}

.dark :deep(.el-table__fixed-right) {
  background: #111827;
}
</style>
