/**
 * LRU (Least Recently Used) 缓存实现
 */
export class LRUCache<K, V> {
  private maxSize: number
  private cache: Map<K, V>
  private onEvict?: (value: V, key: K, reason: string) => void

  constructor(maxSize: number, onEvict?: (value: V, key: K, reason: string) => void) {
    this.maxSize = maxSize
    this.cache = new Map()
    this.onEvict = onEvict
  }

  /**
   * 获取缓存值，同时标记为最近使用
   */
  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined
    }

    // 重新插入以标记为最近使用（Map 会将其移到末尾）
    const value = this.cache.get(key)!
    this.cache.delete(key)
    this.cache.set(key, value)

    return value
  }

  /**
   * 设置缓存值
   */
  set(key: K, value: V): void {
    // 如果键已存在，先删除
    if (this.cache.has(key)) {
      this.cache.delete(key)
    }

    // 添加新值
    this.cache.set(key, value)

    // 如果超过容量，删除最旧的（最近未使用的）
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value
      const firstValue = this.cache.get(firstKey)!
      this.cache.delete(firstKey)
      this.onEvict?.(firstValue, firstKey, 'size-limit')
    }
  }

  /**
   * 删除缓存值
   */
  delete(key: K): boolean {
    const value = this.cache.get(key)
    if (value) {
      this.onEvict?.(value, key, 'manual-delete')
    }
    return this.cache.delete(key)
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.forEach((value, key) => {
      this.onEvict?.(value, key, 'clear')
    })
    this.cache.clear()
  }

  /**
   * 获取缓存大小
   */
  get size(): number {
    return this.cache.size
  }

  /**
   * 检查是否存在某个键
   */
  has(key: K): boolean {
    return this.cache.has(key)
  }
}
