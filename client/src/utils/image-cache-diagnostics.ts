/**
 * 图片缓存诊断工具
 * 在控制台输出缓存状态信息
 */
export const initImageCacheDiagnostics = () => {
  // 创建全局诊断对象
  const diagnostics = {
    /**
     * 显示缓存统计信息
     */
    showStats: () => {
      console.group('📊 图片缓存统计')
      console.log('💾 缓存系统: LRU (最近最少使用)')
      console.log('🎯 缓存大小: 20 张图片')
      console.log('⚙️ 缓存类型: 内存缓存')
      console.log('🔄 淘汰策略: 超过容量时删除最旧的缓存')
      console.groupEnd()
    },

    /**
     * 显示使用帮助
     */
    help: () => {
      console.group('📖 图片缓存帮助')
      console.log('使用方法:')
      console.log('  window.__imageCacheDiagnostics.showStats() - 显示缓存统计')
      console.log('  window.__imageCacheDiagnostics.help() - 显示帮助信息')
      console.log('\n缓存工作流程:')
      console.log('  1. 首次加载图片 → 从网络下载 Blob')
      console.log('  2. 创建 Object URL → 显示在页面上')
      console.log('  3. 放入 LRU 缓存 → 下次加载直接使用')
      console.log('  4. 超过 20 张时 → 删除最旧的缓存')
      console.log('\n缓存输出示例:')
      console.log('  📥 开始加载图片: https://example.com/image.webp')
      console.log('  ✅ 图片缓存命中: https://example.com/image.webp')
      console.log('  💾 已缓存图片: ... | 大小: 0.45MB')
      console.groupEnd()
    },
  }

  // 挂载到全局对象
  ;(window as any).__imageCacheDiagnostics = diagnostics

  // 初始化消息
  console.group('%c🖼️ 图片缓存系统已加载', 'color: #4CAF50; font-weight: bold; font-size: 14px')
  console.log('输入 window.__imageCacheDiagnostics.help() 查看帮助')
  console.groupEnd()
}
