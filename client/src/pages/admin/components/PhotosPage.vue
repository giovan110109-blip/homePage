<template>
  <div class="w-full h-full flex flex-col overflow-hidden">
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">相册管理</h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
        上传和管理照片
      </p>
    </div>

    <el-card
      shadow="never"
      class="flex-1 min-h-0 flex flex-col !border-0 !rounded-xl !bg-white dark:!bg-slate-800 !shadow-md"
      :body-style="{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px',
      }"
    >
      <div class="flex-1 min-h-0 overflow-auto">
        <el-tabs v-model="activeTab" class="mb-2">
          <el-tab-pane label="图片管理" name="photos">
            <!-- 上传区域 -->
            <div class="space-y-4 mb-8">
              <!-- 拖拽上传区域 -->
              <div
                class="border-2 border-dashed rounded-xl p-4 sm:p-8 text-center cursor-pointer transition-all duration-300 min-h-[180px] flex flex-col items-center justify-center bg-gray-50/50 dark:bg-gray-900/30 hover:bg-gray-100/50 dark:hover:bg-gray-900/50"
                :class="
                  isDragging
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                    : 'border-gray-300 dark:border-gray-600'
                "
                @dragover.prevent="isDragging = true"
                @dragleave="isDragging = false"
                @drop.prevent="handleDrop"
                @click="fileInput?.click()"
              >
                <Upload
                  class="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-400 dark:text-gray-500"
                />
                <p
                  class="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-2 font-medium px-2"
                >
                  点击或拖拽文件到这里上传
                </p>
                <p
                  class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 px-4"
                >
                  支持图片（JPG、PNG、HEIC）和视频（MOV、MP4）格式，单个文件最大
                  200MB
                </p>
                <input
                  ref="fileInput"
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  class="hidden"
                  @change="handleFileSelect"
                />
              </div>

              <!-- 移动端上传状态（轻量提示，不遮挡） -->
              <div class="md:hidden w-full" v-if="uploadingFiles.length > 0">
                <div
                  class="flex items-center gap-3 rounded-full border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-slate-900/70 px-3 py-2 shadow-sm backdrop-blur"
                >
                  <div class="flex items-center gap-2 min-w-0">
                    <span
                      class="inline-flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"
                    ></span>
                    <span
                      class="text-xs font-semibold text-gray-700 dark:text-gray-200"
                      >上传中</span
                    >
                  </div>
                  <div class="flex-1">
                    <div
                      class="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden"
                    >
                      <div
                        class="h-full rounded-full bg-gradient-to-r from-blue-500 via-sky-500 to-emerald-500 transition-all duration-300"
                        :style="{
                          width: `${mobileUploadProgress}%`,
                        }"
                      ></div>
                    </div>
                    <div
                      class="mt-1 text-[11px] text-gray-500 dark:text-gray-400"
                    >
                      队列 {{ queuedCount }} · 上传 {{ uploadingCount }} · 处理
                      {{ taskStats.processing }}
                    </div>
                  </div>
                  <div
                    class="text-xs font-semibold text-gray-700 dark:text-gray-200"
                  >
                    {{ queuedCount + uploadingCount + taskStats.processing }}
                  </div>
                </div>
              </div>
            </div>

            <!-- 任务队列统计 - 桌面端显示详细卡片，移动端显示进度球 -->
            <!-- 桌面端详细统计 -->
            <div class="hidden md:grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div
                class="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-600 shadow-sm hover:shadow-md transition-shadow"
              >
                <div class="text-center">
                  <p
                    class="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mb-3 font-medium"
                  >
                    队列中
                  </p>
                  <p
                    class="text-3xl sm:text-4xl font-bold text-gray-700 dark:text-gray-300"
                  >
                    {{ queuedCount }}
                  </p>
                  <p class="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    等待上传
                  </p>
                </div>
              </div>

              <div
                class="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 rounded-xl p-5 border border-blue-200 dark:border-blue-700/30 shadow-sm hover:shadow-md transition-shadow"
              >
                <div class="text-center">
                  <p
                    class="text-blue-600 dark:text-blue-400 text-xs sm:text-sm mb-3 font-medium"
                  >
                    上传中
                  </p>
                  <p
                    class="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400"
                  >
                    {{ uploadingCount }}
                  </p>
                  <p class="text-xs text-blue-500 dark:text-blue-400/70 mt-2">
                    1个/次
                  </p>
                </div>
              </div>

              <div
                class="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-900/30 rounded-xl p-5 border border-yellow-200 dark:border-yellow-700/30 shadow-sm hover:shadow-md transition-shadow"
              >
                <div class="text-center">
                  <p
                    class="text-yellow-600 dark:text-yellow-400 text-xs sm:text-sm mb-3 font-medium"
                  >
                    处理中
                  </p>
                  <p
                    class="text-3xl sm:text-4xl font-bold text-yellow-600 dark:text-yellow-400"
                  >
                    {{ taskStats.processing }}
                  </p>
                </div>
              </div>

              <div
                class="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/30 rounded-xl p-5 border border-green-200 dark:border-green-700/30 shadow-sm hover:shadow-md transition-shadow"
              >
                <div class="text-center">
                  <p
                    class="text-green-600 dark:text-green-400 text-xs sm:text-sm mb-3 font-medium"
                  >
                    完成/失败
                  </p>
                  <p class="text-3xl sm:text-4xl font-bold">
                    <span class="text-green-600 dark:text-green-400">{{
                      taskStats.completed
                    }}</span>
                    <span
                      class="text-gray-400 dark:text-gray-500 mx-1.5 text-2xl"
                      >/</span
                    >
                    <span class="text-red-600 dark:text-red-400">{{
                      taskStats.failed
                    }}</span>
                  </p>
                </div>
              </div>
            </div>

            <!-- 失败任务列表 -->
            <div v-if="taskStats.failed > 0" class="mb-6">
              <div class="flex items-center justify-between mb-4">
                <span class="font-semibold text-gray-900 dark:text-white">失败任务 ({{ taskStats.failed }})</span>
                <AppButton variant="primary" size="sm" @click="loadFailedTasks">刷新</AppButton>
              </div>

              <div v-if="failedLoading" class="text-sm text-gray-500 dark:text-gray-400">加载中...</div>
              <div v-else-if="failedTasks.length === 0" class="text-sm text-gray-500 dark:text-gray-400">暂无失败任务</div>
              <div v-else class="space-y-3">
                <div
                  v-for="task in failedTasks"
                  :key="task.taskId"
                  class="p-3 rounded-lg border border-red-200/60 dark:border-red-900/60 bg-red-50/60 dark:bg-red-900/10"
                >
                  <div class="flex items-center justify-between gap-3">
                    <div class="min-w-0">
                      <div class="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {{ task.originalFileName }}
                      </div>
                      <div class="text-xs text-red-600 dark:text-red-400 mt-1">
                        {{ task.error?.message || '处理失败' }}
                      </div>
                      <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        尝试 {{ task.attempts }}/{{ task.maxAttempts }} · {{ task.stage || 'unknown' }}
                      </div>
                    </div>
                    <AppButton variant="danger" size="sm" @click="retryFailedTask(task.taskId)">
                      重试
                    </AppButton>
                  </div>
                </div>
              </div>
            </div>

            <!-- 图片列表 -->
            <div class="space-y-4">
              <div
                class="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700"
              >
                <span
                  class="font-semibold text-lg text-gray-900 dark:text-white"
                  >图片列表</span
                >
                <div class="flex items-center gap-2">
                  <AppButton
                    v-if="selectedPhotos.length > 0"
                    variant="danger"
                    size="sm"
                    @click="batchDeletePhotos"
                  >
                    批量删除 ({{ selectedPhotos.length }})
                  </AppButton>
                  <AppButton variant="reset" size="sm" @click="loadPhotos"
                    >刷新</AppButton
                  >
                </div>
              </div>

              <div
                class="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm"
              >
                <el-table
                  :data="photoTableData"
                  stripe
                  v-loading="photoLoading"
                  style="width: 100%"
                  @selection-change="handleSelectionChange"
                  class="!border-0"
                >
                  <el-table-column type="selection" width="50" />
                  <el-table-column label="缩略图" width="90">
                    <template #default="scope">
                      <img
                        :src="getPhotoImageUrl(scope.row)"
                        :alt="scope.row.title || scope.row.originalFileName"
                        class="w-12 h-12 rounded-lg border border-slate-200 dark:border-slate-700 object-cover cursor-pointer hover:opacity-80 transition-opacity shadow-sm"
                        loading="lazy"
                        @click="openImagePreview(scope.row)"
                      />
                    </template>
                  </el-table-column>
                  <el-table-column prop="title" label="标题" min-width="160" />
                  <el-table-column
                    prop="originalFileName"
                    label="文件名"
                    min-width="200"
                  />
                  <el-table-column label="尺寸" width="110">
                    <template #default="scope">
                      {{ scope.row.width }}×{{ scope.row.height }}
                    </template>
                  </el-table-column>
                  <el-table-column label="大小" width="110">
                    <template #default="scope">
                      {{ formatFileSize(scope.row.fileSize) }}
                    </template>
                  </el-table-column>
                  <el-table-column label="可见性" width="110">
                    <template #default="scope">
                      {{ scope.row.visibility === "public" ? "可见" : "私密" }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="isLive" label="实况" width="90">
                    <template #default="scope">
                      <el-tag :type="getLiveTagType(scope.row.isLive)">
                        {{ getLiveLabel(scope.row.isLive) }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column
                    prop="createdAt"
                    label="上传时间"
                    width="180"
                  >
                    <template #default="scope">
                      {{ formatDate(scope.row.createdAt) }}
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="240" fixed="right">
                    <template #default="scope">
                      <div class="flex items-center gap-2">
                        <AppButton
                          variant="link-primary"
                          size="none"
                          @click="openPhotoDialog(scope.row)"
                          >编辑</AppButton
                        >
                        <el-dropdown
                          trigger="click"
                          @command="(cmd) => handlePhotoAction(cmd, scope.row)"
                          class="inline-flex items-center"
                        >
                          <AppButton
                            variant="link-primary"
                            size="none"
                            class="inline-flex items-center"
                          >
                            更多<span class="ml-0.5">▾</span>
                          </AppButton>
                          <template #dropdown>
                            <el-dropdown-menu>
                              <el-dropdown-item command="rotate-clockwise"
                                >⟳ 顺时针 90°</el-dropdown-item
                              >
                              <el-dropdown-item
                                command="rotate-counterclockwise"
                                >⟲ 逆时针 90°</el-dropdown-item
                              >
                              <li
                                class="el-dropdown-menu__item"
                                style="
                                  height: 1px;
                                  padding: 0;
                                  margin: 5px 0;
                                  background: #e4e7eb;
                                  cursor: default;
                                "
                              ></li>
                              <el-dropdown-item command="refresh-exif"
                                >🔄 重新获取EXIF</el-dropdown-item
                              >
                              <el-dropdown-item
                                command="refresh-geoinfo"
                                :disabled="!scope.row.location"
                                >📍 重新获取位置</el-dropdown-item
                              >
                              <el-dropdown-item command="set-location"
                                >🗺️ 设置位置</el-dropdown-item
                              >
                            </el-dropdown-menu>
                          </template>
                        </el-dropdown>
                        <AppButton
                          variant="link-danger"
                          size="none"
                          @click="deletePhoto(scope.row)"
                          >删除</AppButton
                        >
                        <AppButton
                          variant="link-primary"
                          size="none"
                          @click="
                            setVisibility(
                              scope.row,
                              scope.row.visibility === 'public'
                                ? 'private'
                                : 'public',
                            )
                          "
                          >{{
                            scope.row.visibility === "public" ? "私密" : "可见"
                          }}</AppButton
                        >
                      </div>
                    </template>
                  </el-table-column>
                </el-table>
              </div>

              <div class="mt-6 flex justify-center">
                <el-pagination
                  v-model:current-page="photoPagination.page"
                  v-model:page-size="photoPagination.pageSize"
                  :total="photoPagination.total"
                  layout="prev, pager, next, sizes"
                  @size-change="loadPhotos"
                  @current-change="loadPhotos"
                />
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="相册管理" name="albums">
            <div
              class="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700"
            >
              <span class="font-semibold text-lg text-gray-900 dark:text-white"
                >相册列表</span
              >
              <div class="flex items-center gap-2">
                <AppButton
                  variant="primary"
                  size="sm"
                  @click="openAlbumDialog()"
                  >新增相册</AppButton
                >
                <AppButton variant="reset" size="sm" @click="loadAlbums"
                  >刷新</AppButton
                >
              </div>
            </div>

            <div
              class="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm"
            >
              <el-table
                :data="albumTableData"
                stripe
                v-loading="albumLoading"
                style="width: 100%"
                class="!border-0"
              >
                <el-table-column prop="name" label="相册名称" min-width="180" />
                <el-table-column
                  prop="description"
                  label="描述"
                  min-width="200"
                />
                <el-table-column prop="type" label="类型" width="100">
                  <template #default="scope">
                    <el-tag
                      :type="scope.row.type === 'smart' ? 'warning' : 'info'"
                    >
                      {{ scope.row.type === "smart" ? "智能" : "普通" }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="createdAt" label="创建时间" width="180">
                  <template #default="scope">
                    {{ formatDate(scope.row.createdAt) }}
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="140">
                  <template #default="scope">
                    <div class="flex items-center gap-2">
                      <AppButton
                        variant="link-primary"
                        size="none"
                        @click="openAlbumDialog(scope.row)"
                        >编辑</AppButton
                      >
                      <AppButton
                        variant="link-danger"
                        size="none"
                        @click="deleteAlbum(scope.row)"
                        >删除</AppButton
                      >
                    </div>
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <div class="mt-6 flex justify-center">
              <el-pagination
                v-model:current-page="albumPagination.page"
                v-model:page-size="albumPagination.pageSize"
                :total="albumPagination.total"
                layout="prev, pager, next, sizes"
                @size-change="loadAlbums"
                @current-change="loadAlbums"
              />
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-card>

    <el-dialog
      v-model="albumDialogVisible"
      :title="albumForm._id ? '编辑相册' : '新增相册'"
      width="95%"
      :style="{ maxWidth: '1000px' }"
      :close-on-click-modal="false"
    >
      <div class="space-y-4">
        <!-- 基本信息 -->
        <div>
          <label
            class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block"
            >相册名称 *</label
          >
          <el-input
            v-model="albumForm.name"
            placeholder="输入相册名称"
            clearable
          />
        </div>

        <div>
          <label
            class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block"
            >相册介绍</label
          >
          <el-input
            v-model="albumForm.description"
            type="textarea"
            :rows="2"
            placeholder="简单介绍一下这个相册（可选）"
            clearable
          />
        </div>

        <!-- 选择图片 -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300"
              >选择相册照片</label
            >
            <span class="text-xs text-gray-500 dark:text-gray-400">
              {{ albumForm.photos?.length || 0 }} 张 | 点击图片选择
            </span>
          </div>

          <div
            class="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden"
          >
            <div
              class="max-h-[350px] overflow-y-auto p-3 bg-gray-50 dark:bg-gray-800/50"
            >
              <div
                v-if="availablePhotos.length === 0"
                class="text-center py-12 text-gray-500 dark:text-gray-400 text-sm"
              >
                暂无图片
              </div>
              <div
                v-else
                class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2"
              >
                <div
                  v-for="photo in availablePhotos"
                  :key="photo._id"
                  class="group relative cursor-pointer"
                  @click="togglePhotoSelection(photo._id)"
                >
                  <img
                    :src="getPhotoImageUrl(photo)"
                    :alt="photo.title || photo.originalFileName"
                    class="w-full aspect-square object-cover rounded transition-all duration-200"
                    :class="
                      isPhotoSelected(photo._id)
                        ? 'ring-2 ring-blue-500 brightness-75'
                        : 'group-hover:brightness-75'
                    "
                    loading="lazy"
                  />

                  <!-- 选中指示 -->
                  <div
                    v-if="isPhotoSelected(photo._id)"
                    class="absolute inset-0 flex items-center justify-center rounded"
                  >
                    <div
                      class="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    >
                      {{ getPhotoIndex(photo._id) + 1 }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 已选择照片预览 -->
        <div v-if="albumForm.photos && albumForm.photos.length > 0">
          <label
            class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block"
          >
            已选择 ({{ albumForm.photos.length }}) -
            拖拽可调整顺序，第一张为封面
          </label>
          <div class="flex gap-2 overflow-x-auto pb-2 pt-4">
            <div
              v-for="(photoId, index) in albumForm.photos"
              :key="photoId"
              class="relative shrink-0 group cursor-move"
              draggable="true"
              @dragstart="handleDragStart($event, index)"
              @dragover.prevent="handleDragOver($event, index)"
              @drop.prevent="handlePhotoOrderDrop($event, index)"
              @dragend="handleDragEnd"
            >
              <img
                :src="getPhotoImageUrlById(photoId)"
                :alt="`第 ${index + 1} 张`"
                class="h-16 w-16 object-cover rounded border-2 transition-all pointer-events-none"
                :class="[
                  index === 0
                    ? 'border-blue-500'
                    : 'border-gray-300 dark:border-gray-600 group-hover:border-gray-400',
                  dragOverIndex === index && dragFromIndex !== index
                    ? 'opacity-50'
                    : '',
                ]"
                loading="lazy"
              />
              <div
                v-if="index === 0"
                class="absolute top-0.5 left-0.5 bg-blue-500 text-white text-xs px-1 py-0.5 rounded text-[10px] font-medium z-20"
              >
                封面
              </div>
              <button
                type="button"
                class="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity z-30"
                @click.stop="removePhotoFromSelection(photoId)"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex gap-2 justify-end">
          <AppButton
            variant="reset"
            size="sm"
            @click="albumDialogVisible = false"
            >取消</AppButton
          >
          <AppButton
            variant="primary"
            size="sm"
            :disabled="savingAlbum || !albumForm.name"
            @click="saveAlbum"
          >
            {{ savingAlbum ? "保存中..." : "保存相册" }}
          </AppButton>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="photoDialogVisible" title="编辑照片" width="520px">
      <el-form :model="photoForm" label-width="90px">
        <el-form-item label="标题" required>
          <el-input v-model="photoForm.title" placeholder="请输入照片标题" />
        </el-form-item>
      </el-form>
      <template #footer>
        <AppButton variant="reset" size="sm" @click="photoDialogVisible = false"
          >取消</AppButton
        >
        <AppButton
          variant="primary"
          size="sm"
          :disabled="savingPhoto"
          @click="savePhoto"
          >保存</AppButton
        >
      </template>
    </el-dialog>

    <!-- 图片预览对话框 -->
    <el-dialog
      v-model="imagePreviewVisible"
      title="图片预览"
      width="95%"
      :style="{ maxWidth: '1000px' }"
      :close-on-click-modal="true"
      :show-close="true"
    >
      <div class="flex justify-center items-center">
        <img
          v-if="previewPhoto"
          :src="getPhotoImageUrl(previewPhoto)"
          :alt="previewPhoto.title || previewPhoto.originalFileName"
          class="max-w-full max-h-[600px] rounded-lg"
        />
      </div>
    </el-dialog>

    <!-- 地图位置选择对话框 -->
    <el-dialog
      v-model="locationDialogVisible"
      title="设置照片位置"
      width="95%"
      :style="{ maxWidth: '800px' }"
      :close-on-click-modal="false"
      :fullscreen="false"
    >
      <div class="space-y-3">
        <!-- 搜索栏 -->
        <div class="flex gap-2">
          <el-autocomplete
            v-model="searchAddress"
            :fetch-suggestions="handleSearchSuggestions"
            placeholder="搜索地址，如：北京天安门"
            @keyup.enter="selectFirstResult"
            @select="handleSelectLocation"
            clearable
            class="flex-1"
          >
            <template #prefix>
              <span class="text-gray-400">🔍</span>
            </template>
            <template #default="{ item }">
              <div class="flex justify-between">
                <span>{{ item.value }}</span>
                <span class="text-gray-400 text-xs">{{ item.label }}</span>
              </div>
            </template>
          </el-autocomplete>
          <AppButton
            variant="primary"
            size="sm"
            @click="searchLocation"
            :disabled="searchingLocation"
            class="shrink-0"
          >
            {{ searchingLocation ? "搜索中" : "搜索" }}
          </AppButton>
        </div>

        <!-- 地图容器 -->
        <div class="relative">
          <div
            ref="miniMapContainer"
            class="w-full rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600"
            :class="{
              'h-[400px] sm:h-[500px]': true,
            }"
          ></div>
          <div
            class="absolute top-3 left-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded px-2.5 py-1.5 shadow-md text-xs"
          >
            <div class="flex items-center gap-1.5">
              <span>📍</span>
              <span
                class="font-mono text-gray-700 dark:text-gray-300"
                v-if="locationForm.latitude && locationForm.longitude"
              >
                {{ locationForm.latitude.toFixed(4) }},
                {{ locationForm.longitude.toFixed(4) }}
              </span>
              <span class="text-gray-500 dark:text-gray-400" v-else
                >点击选择</span
              >
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex gap-2 justify-end">
          <AppButton
            variant="reset"
            size="sm"
            @click="locationDialogVisible = false"
            >取消</AppButton
          >
          <AppButton
            variant="primary"
            size="sm"
            :disabled="savingLocation"
            @click="saveLocation"
          >
            {{ savingLocation ? "保存中..." : "保存位置" }}
          </AppButton>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, watch, nextTick } from "vue";
import { Upload } from "lucide-vue-next";
import AppButton from "@/components/ui/AppButton.vue";
import { useUploadQueueStore } from "@/stores/uploadQueue";
import { storeToRefs } from "pinia";
import request from "@/api/request";
import { ElMessage, ElMessageBox } from "element-plus";
import { getPhotoOriginalUrl } from "@/utils";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const isDragging = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const activeTab = ref("photos");
const uploadQueueStore = useUploadQueueStore();
const {
  taskStats,
  failedTasks,
  failedLoading,
  queuedCount,
  uploadingCount,
  uploadingFiles,
} = storeToRefs(uploadQueueStore);

const photoTableData = ref<any[]>([]);
const photoLoading = ref(false);
const photoPagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
});

const albumTableData = ref<any[]>([]);
const albumLoading = ref(false);
const albumPagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});
const albumDialogVisible = ref(false);
const savingAlbum = ref(false);
const albumForm = ref({
  _id: "",
  name: "",
  description: "",
  photos: [],
  type: "normal",
  visibility: "public",
});
const availablePhotos = ref<any[]>([]);
const photoImageCache = ref<Map<string, string>>(new Map());
const dragFromIndex = ref(-1);
const dragOverIndex = ref(-1);
const selectedPhotos = ref<any[]>([]);

const photoDialogVisible = ref(false);
const savingPhoto = ref(false);
const photoForm = ref({
  _id: "",
  title: "",
});

const mobileUploadProgress = ref(0);

const imagePreviewVisible = ref(false);
const previewPhoto = ref<any>(null);

const locationDialogVisible = ref(false);
const savingLocation = ref(false);
const searchingLocation = ref(false);
const searchAddress = ref("");
const searchResults = ref<
  Array<{ latitude: number; longitude: number; displayName: string }>
>([]);
const miniMapContainer = ref<HTMLDivElement | null>(null);
const locationForm = ref({
  photoId: "",
  latitude: 0,
  longitude: 0,
});
let miniMap: any = null;
let miniMapMarker: any = null;

const GEOCODE_TIMEOUT_MS = 6000;
const geocodeCache = new Map<
  string,
  { lat: number; lon: number; display_name: string }
>();
const geocodeInFlight = new Map<
  string,
  Promise<{ lat: number; lon: number; display_name: string } | null>
>();

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files) {
    uploadFiles(Array.from(target.files));
  }
  target.value = "";
};

const handleDrop = (e: DragEvent) => {
  isDragging.value = false;
  const files = e.dataTransfer?.files;
  if (files) {
    uploadFiles(Array.from(files));
  }
};

/**
 * 将文件加入上传队列
 */
const uploadFiles = async (files: File[]) => {
  uploadQueueStore.enqueueFiles(files);
};

const loadFailedTasks = async () => {
  await uploadQueueStore.loadFailedTasks();
};

const retryFailedTask = async (taskId: string) => {
  await uploadQueueStore.retryFailedTask(taskId);
};

