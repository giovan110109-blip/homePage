<template>
  <div class="w-full h-full flex flex-col overflow-auto">
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">系统设置</h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">配置系统参数和选项</p>
    </div>

    <el-card shadow="hover">

      <el-form label-width="120px">
        <el-tabs v-model="activeTab" class="mb-2">
          <el-tab-pane label="个人信息" name="profile">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
              <div>
                <el-form-item label="名称">
                  <el-input v-model="form.name" />
                </el-form-item>
                <el-form-item label="标题">
                  <el-input v-model="form.title" />
                </el-form-item>
                <el-form-item label="简介">
                  <el-input v-model="form.bio" type="textarea" :rows="3" />
                </el-form-item>
                <el-form-item label="头像">
                  <div class="flex items-center gap-3">
                    <el-upload
                      class="inline-flex w-24 h-24 rounded-lg border border-dashed border-blue-200 items-center justify-center cursor-pointer overflow-hidden bg-slate-50"
                      :action="`${apiBaseUrl}/api/upload`"
                      :show-file-list="false"
                      :on-success="handleAvatarSuccess"
                    >
                      <el-image v-if="form.avatar" :src="form.avatar" class="w-full h-full object-cover" fit="cover" />
                      <div v-else class="text-xs text-slate-500">上传头像</div>
                    </el-upload>

                    <div class="flex flex-col">
                      <el-button v-if="form.avatar" type="danger" size="small" @click="confirmDeleteAvatar">删除头像</el-button>
                      <div v-else class="text-sm text-gray-500">未设置头像</div>
                    </div>
                  </div>
                </el-form-item>
              </div>
              <div>
                <el-form-item label="邮箱">
                  <el-input v-model="form.email" />
                </el-form-item>
                <el-form-item label="微信">
                  <el-input v-model="form.wechat" />
                </el-form-item>
                <el-form-item label="所在地">
                  <el-input v-model="form.location" />
                </el-form-item>
                <el-form-item label="网站">
                  <el-input v-model="form.website" />
                </el-form-item>
                <el-form-item label="社交链接">
                  <el-input v-model="socialLinksText" type="textarea" :rows="4" placeholder='JSON 数组，如 [{"platform":"GitHub","url":"...","icon":"github"}]' />
                </el-form-item>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="网站信息" name="site">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
              <div>
                <el-form-item label="网站名称">
                  <el-input v-model="form.siteName" />
                </el-form-item>
                <el-form-item label="网站标题">
                  <el-input v-model="form.siteTitle" />
                </el-form-item>
              </div>
              <div>
                <el-form-item label="网站描述">
                  <el-input v-model="form.siteDescription" type="textarea" :rows="2" />
                </el-form-item>
                <el-form-item label="网站 Logo">
                  <el-input v-model="form.siteLogo" placeholder="Logo URL" />
                </el-form-item>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="备案与底部" name="footer">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
              <div>
                <el-form-item label="ICP备案号">
                  <el-input v-model="form.icp" />
                </el-form-item>
                <el-form-item label="ICP备案链接">
                  <el-input v-model="form.icpLink" />
                </el-form-item>
                <el-form-item label="公安备案号">
                  <el-input v-model="form.publicSecurity" />
                </el-form-item>
                <el-form-item label="公安备案链接">
                  <el-input v-model="form.publicSecurityLink" />
                </el-form-item>
              </div>
              <div>
                <el-form-item label="底部联系邮箱">
                  <el-input v-model="form.footerContact.email" />
                </el-form-item>
                <el-form-item label="底部联系电话">
                  <el-input v-model="form.footerContact.phone" />
                </el-form-item>
                <el-form-item label="底部联系微信">
                  <el-input v-model="form.footerContact.wechat" />
                </el-form-item>
                <el-form-item label="底部地址">
                  <el-input v-model="form.footerContact.address" />
                </el-form-item>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="缓存管理" name="cache">
            <div class="space-y-4">
              <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <p class="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  <strong>缓存说明：</strong>系统会自动缓存已加载的图片到浏览器本地存储中。
                  首次访问时会从服务器加载，之后的访问将使用本地缓存，加载速度会明显加快。
                </p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- 缓存大小 -->
                <el-card shadow="hover">
                  <div class="text-center">
                    <p class="text-gray-500 text-sm mb-2">已用存储空间</p>
                    <p class="text-3xl font-bold text-blue-600">{{ cacheSize }} MB</p>
                    <p class="text-xs text-gray-400 mt-2">浏览器缓存总大小</p>
                  </div>
                </el-card>

                <!-- Service Worker 状态 -->
                <el-card shadow="hover">
                  <div class="text-center">
                    <p class="text-gray-500 text-sm mb-2">Service Worker</p>
                    <el-tag :type="swStatus === 'activated' ? 'success' : 'info'" class="mb-3">
                      {{ swStatusText }}
                    </el-tag>
                    <div>
                      <el-button size="small" @click="checkServiceWorker">
                        检查状态
                      </el-button>
                    </div>
                  </div>
                </el-card>

                <!-- 清空缓存 -->
                <el-card shadow="hover">
                  <div class="text-center">
                    <p class="text-gray-500 text-sm mb-4">管理缓存</p>
                    <el-button 
                      type="danger" 
                      @click="confirmClearCache"
                      :loading="clearingCache"
                    >
                      清空所有缓存
                    </el-button>
                    <p class="text-xs text-gray-400 mt-3">
                      清空后下次访问会重新加载所有图片
                    </p>
                  </div>
                </el-card>
              </div>

              <!-- 缓存策略说明 -->
              <el-alert
                title="缓存策略"
                type="info"
                :closable="false"
              >
                <template #default>
                  <ul class="text-sm space-y-1">
                    <li>• 图片会自动缓存 30 天</li>
                    <li>• 支持离线访问已缓存的内容</li>
                    <li>• 仅缓存来自本站的图片</li>
                    <li>• 您可以随时手动清空缓存</li>
                  </ul>
                </template>
              </el-alert>

              <!-- 开发者调试 -->
              <el-collapse class="bg-gray-50 dark:bg-gray-800">
                <el-collapse-item title="开发者调试 - 缓存列表" name="debug">
                  <el-button size="small" @click="loadCachedUrls" class="mb-3">
                    刷新缓存列表
                  </el-button>
                  <div v-if="cachedUrls.length > 0" class="space-y-2">
                    <div v-for="(url, index) in cachedUrls" :key="index" class="text-xs bg-white dark:bg-gray-700 p-2 rounded break-all">
                      <div class="text-gray-500 dark:text-gray-400 mb-1">{{ index + 1 }}.</div>
                      <div class="font-mono text-gray-700 dark:text-gray-300">{{ url }}</div>
                    </div>
                  </div>
                  <div v-else class="text-sm text-gray-500">
                    暂无缓存的 URL
                  </div>
                </el-collapse-item>
              </el-collapse>
            </div>
          </el-tab-pane>
        </el-tabs>

        <el-form-item>
          <el-button type="primary" :loading="saving" @click="handleSave">保存设置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/api/request'
import { getBaseURL, getAssetURL } from '@/utils'
import { cacheManager } from '@/utils/cacheManager'

const apiBaseUrl = getBaseURL()

interface SiteInfoForm {
  name: string
  title: string
  bio: string
  avatar: string
  email: string
  wechat: string
  location: string
  website: string
  socialLinks: Array<{ platform: string; url: string; icon?: string }>
  siteName: string
  siteTitle: string
  siteDescription: string
  siteLogo: string
  icp: string
  icpLink: string
  publicSecurity: string
  publicSecurityLink: string
  footerContact: {
    email: string
    phone: string
    wechat: string
    address: string
  }
}

const form = ref<SiteInfoForm>({
  name: '',
  title: '',
  bio: '',
  avatar: '',
  email: '',
  wechat: '',
  location: '',
  website: '',
  socialLinks: [],
  siteName: '',
  siteTitle: '',
  siteDescription: '',
  siteLogo: '',
  icp: '',
  icpLink: '',
  publicSecurity: '',
  publicSecurityLink: '',
  footerContact: {
    email: '',
    phone: '',
    wechat: '',
    address: '',
  },
})

const socialLinksText = ref('[]')
const activeTab = ref('profile')
const saving = ref(false)
const cacheSize = ref(0)
const clearingCache = ref(false)
const cachedUrls = ref<string[]>([])
const swStatus = ref<string>('unknown')
const swStatusText = ref<string>('未知')

const loadCacheSize = async () => {
  try {
    const size = await cacheManager.getCacheSize()
    cacheSize.value = size
  } catch (error) {
    console.error('获取缓存大小失败:', error)
  }
}

const loadCachedUrls = async () => {
  try {
    if (!cacheManager.isSupported()) {
      ElMessage.error('浏览器不支持 Cache API')
      return
    }
    
    const cacheNames = await caches.keys()
    cachedUrls.value = []
    
    for (const cacheName of cacheNames) {
      if (cacheName.includes('homepage')) {
        const cache = await caches.open(cacheName)
        const keys = await cache.keys()
        for (const request of keys) {
          cachedUrls.value.push(request.url)
        }
      }
    }
    
    if (cachedUrls.value.length === 0) {
      ElMessage.info('没有缓存任何 URL')
    } else {
      ElMessage.success(`找到 ${cachedUrls.value.length} 个缓存的 URL`)
    }
  } catch (error: any) {
    console.error('加载缓存列表失败:', error)
    ElMessage.error('加载缓存列表失败')
  }
}

const checkServiceWorker = async () => {
  try {
    if (!navigator.serviceWorker) {
      swStatus.value = 'unsupported'
      swStatusText.value = '不支持'
      ElMessage.warning('浏览器不支持 Service Worker')
      return
    }

    const registration = await navigator.serviceWorker.getRegistration()
    
    if (!registration) {
      swStatus.value = 'not-registered'
      swStatusText.value = '未注册'
      ElMessage.warning('Service Worker 未注册，正在尝试注册...')
      await cacheManager.register()
      await checkServiceWorker()
      return
    }

    if (registration.active) {
      swStatus.value = 'activated'
      swStatusText.value = '已激活'
    } else if (registration.installing) {
      swStatus.value = 'installing'
      swStatusText.value = '安装中'
      ElMessage.info('Service Worker 正在安装')
    } else if (registration.waiting) {
      swStatus.value = 'waiting'
      swStatusText.value = '等待中'
      ElMessage.info('Service Worker 等待激活')
    } else {
      swStatus.value = 'unknown'
      swStatusText.value = '未知状态'
    }
  } catch (error: any) {
    console.error('检查 Service Worker 失败:', error)
    swStatus.value = 'error'
    swStatusText.value = '错误'
    ElMessage.error('检查失败: ' + error.message)
  }
}

const fetchSettings = async () => {
  try {
    const res = await request.get('/admin/site-info')
    const payload = res?.data || res || {}
    const data = payload.data || payload
    form.value = {
      ...form.value,
      ...data,
      footerContact: {
        ...form.value.footerContact,
        ...(data.footerContact || {}),
      },
      socialLinks: Array.isArray(data.socialLinks) ? data.socialLinks : [],
    }
    socialLinksText.value = JSON.stringify(form.value.socialLinks || [], null, 2)
  } catch (error: any) {
    ElMessage.error(error?.message || '加载配置失败')
  }
}

const handleSave = async () => {
  saving.value = true
  try {
    let socialLinks = [] as SiteInfoForm['socialLinks']
    if (socialLinksText.value.trim()) {
      socialLinks = JSON.parse(socialLinksText.value)
    }

    const payload = {
      ...form.value,
      socialLinks,
    }
    await request.put('/admin/site-info', payload)
    ElMessage.success('保存成功')
  } catch (error: any) {
    ElMessage.error(error?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

const handleAvatarSuccess = (response: any) => {
  const data = response?.data || response
  if (data?.url) {
    const url = getAssetURL(data.url)
    form.value.avatar = url
  }
}

const confirmDeleteAvatar = async () => {
  try {
    await ElMessageBox.confirm('确定删除头像吗？此操作不可恢复。', '提示', { type: 'warning' })
    await deleteAvatar()
  } catch (e) {
    // 用户取消或出错，忽略
  }
}

const deleteAvatar = async () => {
  if (!form.value.avatar) {
    ElMessage.error('当前没有头像可删除')
    return
  }

  try {
    // 解析文件名，支持相对路径或完整 URL
    const url = form.value.avatar
    const pathname = new URL(url, window.location.origin).pathname
    const parts = pathname.split('/').filter(Boolean)
    const filename = parts.pop()
    if (!filename) {
      ElMessage.error('无法解析文件名')
      return
    }

    await request.delete(`/upload/${encodeURIComponent(filename)}`)
    form.value.avatar = ''
    ElMessage.success('删除成功')
  } catch (error: any) {
    ElMessage.error(error?.message || '删除失败')
  }
}

const confirmClearCache = async () => {
  try {
    await ElMessageBox.confirm(
      '清空缓存后下次访问会重新加载所有图片，确定要清空吗？',
      '提示',
      { type: 'warning' }
    )
    await clearCache()
  } catch (e) {
    // 用户取消
  }
}

const clearCache = async () => {
  clearingCache.value = true
  try {
    const success = await cacheManager.clearCache()
    if (success) {
      ElMessage.success('缓存已清空')
      await loadCacheSize()
    } else {
      ElMessage.error('清空缓存失败，请重试')
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '清空缓存失败')
  } finally {
    clearingCache.value = false
  }
}

onMounted(() => {
  fetchSettings()
  loadCacheSize()
  checkServiceWorker()
})
</script>

<style scoped>
@media (max-width: 1024px) {
  .grid {
    grid-template-columns: 1fr !important;
  }
}
</style>
