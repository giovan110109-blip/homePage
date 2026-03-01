require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const mongoose = require('mongoose');
const Article = require('../models/article');

const articles = [
  {
    title: 'Vue 3 组合式 API 完全指南',
    summary: '深入理解 Vue 3 组合式 API 的核心概念、最佳实践和高级用法，帮助你构建更优雅的 Vue 应用。',
    category: '前端开发',
    tags: ['Vue', 'JavaScript', '前端'],
    content: `<h2>什么是组合式 API？</h2>
<p>组合式 API（Composition API）是 Vue 3 中引入的一种全新的编写组件逻辑的方式。它允许我们使用函数来组织代码，而不是依赖于选项式 API 中的 data、methods、computed 等选项。</p>

<h3>为什么需要组合式 API？</h3>
<p>在 Vue 2 中，我们使用选项式 API（Options API）来编写组件。随着组件变得越来越复杂，代码会变得难以维护：</p>

<ul>
<li>同一个逻辑关注点的代码被分散在不同的选项中</li>
<li>代码复用变得困难</li>
<li>TypeScript 支持不够完善</li>
</ul>

<h2>基础用法</h2>

<h3>setup 函数</h3>
<p>setup 是组合式 API 的入口点，它在组件创建之前执行：</p>

<pre><code class="language-javascript">import { ref, reactive, computed, onMounted } from 'vue'

export default {
  setup() {
    // 响应式数据
    const count = ref(0)
    const state = reactive({
      name: 'Vue 3',
      version: '3.4.0'
    })

    // 计算属性
    const doubleCount = computed(() => count.value * 2)

    // 方法
    function increment() {
      count.value++
    }

    // 生命周期钩子
    onMounted(() => {
      console.log('组件已挂载')
    })

    // 返回模板需要使用的数据和方法
    return {
      count,
      state,
      doubleCount,
      increment
    }
  }
}</code></pre>

<h3>ref 和 reactive 的区别</h3>
<p>ref 和 reactive 都是用来创建响应式数据的 API，但它们有一些区别：</p>

<table>
<thead>
<tr>
<th>特性</th>
<th>ref</th>
<th>reactive</th>
</tr>
</thead>
<tbody>
<tr>
<td>适用类型</td>
<td>基本类型、对象</td>
<td>对象、数组</td>
</tr>
<tr>
<td>访问方式</td>
<td>.value</td>
<td>直接访问</td>
</tr>
<tr>
<td>解构</td>
<td>保持响应性</td>
<td>会丢失响应性</td>
</tr>
<tr>
<td>替换</td>
<td>可以整体替换</td>
<td>不能整体替换</td>
</tr>
</tbody>
</table>

<h2>生命周期钩子</h2>
<p>在组合式 API 中，生命周期钩子以 on 开头的函数形式存在：</p>

<pre><code class="language-javascript">import {
  onBeforeMount,
  onMounted,
  onBeforeUpdate,
  onUpdated,
  onBeforeUnmount,
  onUnmounted
} from 'vue'

export default {
  setup() {
    onBeforeMount(() => {
      console.log('挂载前')
    })

    onMounted(() => {
      console.log('挂载后')
    })

    onBeforeUpdate(() => {
      console.log('更新前')
    })

    onUpdated(() => {
      console.log('更新后')
    })

    onBeforeUnmount(() => {
      console.log('卸载前')
    })

    onUnmounted(() => {
      console.log('卸载后')
    })
  }
}</code></pre>

<h2>组合式函数（Composables）</h2>
<p>组合式函数是组合式 API 的核心优势之一，它允许我们将可复用的逻辑提取到独立的函数中：</p>

<pre><code class="language-javascript">// useCounter.js
import { ref, computed } from 'vue'

export function useCounter(initialValue = 0) {
  const count = ref(initialValue)
  const doubleCount = computed(() => count.value * 2)

  function increment() {
    count.value++
  }

  function decrement() {
    count.value--
  }

  function reset() {
    count.value = initialValue
  }

  return {
    count,
    doubleCount,
    increment,
    decrement,
    reset
  }
}

// 在组件中使用
import { useCounter } from './useCounter'

export default {
  setup() {
    const { count, doubleCount, increment, decrement, reset } = useCounter(10)

    return {
      count,
      doubleCount,
      increment,
      decrement,
      reset
    }
  }
}</code></pre>

<h2>响应式系统原理</h2>
<p>Vue 3 的响应式系统基于 Proxy 实现，相比 Vue 2 的 Object.defineProperty，它有以下优势：</p>

<ul>
<li>可以检测对象属性的添加和删除</li>
<li>可以检测数组索引和长度的变化</li>
<li>支持 Map、Set、WeakMap、WeakSet</li>
<li>性能更好</li>
</ul>

<h3>响应式 API 详解</h3>

<pre><code class="language-javascript">import { ref, reactive, readonly, shallowRef, shallowReactive } from 'vue'

// ref: 创建响应式引用
const count = ref(0)

// reactive: 创建响应式对象
const state = reactive({
  user: {
    name: 'John',
    age: 30
  }
})

// readonly: 创建只读代理
const readonlyState = readonly(state)

// shallowRef: 只有 .value 是响应式的
const shallowCount = shallowRef({ count: 0 })
shallowCount.value = { count: 1 } // 触发更新
shallowCount.value.count = 2 // 不触发更新

// shallowReactive: 只有根级别属性是响应式的
const shallowState = shallowReactive({
  foo: 1,
  nested: {
    bar: 2
  }
})
shallowState.foo++ // 触发更新
shallowState.nested.bar++ // 不触发更新</code></pre>

<h2>watch 和 watchEffect</h2>
<p>Vue 3 提供了 watch 和 watchEffect 两个函数来监听响应式数据的变化：</p>

<pre><code class="language-javascript">import { ref, reactive, watch, watchEffect } from 'vue'

const count = ref(0)
const state = reactive({ name: 'Vue' })

// watch: 显式指定依赖
watch(count, (newValue, oldValue) => {
  console.log(\`count 从 \${oldValue} 变为 \${newValue}\`)
})

// 监听多个源
watch([count, () => state.name], ([newCount, newName], [oldCount, oldName]) => {
  console.log(\`count: \${oldCount} -> \${newCount}\`)
  console.log(\`name: \${oldName} -> \${newName}\`)
})

// watchEffect: 自动收集依赖
watchEffect(() => {
  console.log(\`count 是 \${count.value}\`)
})</code></pre>

<h2>最佳实践</h2>

<h3>1. 使用 &lt;script setup&gt; 语法糖</h3>
<p>Vue 3.2+ 引入了 &lt;script setup&gt; 语法糖，让代码更加简洁：</p>

<pre><code class="language-vue">&lt;script setup&gt;
import { ref, computed } from 'vue'

const props = defineProps({
  msg: String
})

const emit = defineEmits(['update'])

const count = ref(0)
const doubleCount = computed(() => count.value * 2)

function increment() {
  count.value++
  emit('update', count.value)
}
&lt;/script&gt;

&lt;template&gt;
  &lt;div&gt;
    &lt;h1&gt;{{ props.msg }}&lt;/h1&gt;
    &lt;p&gt;Count: {{ count }}&lt;/p&gt;
    &lt;p&gt;Double: {{ doubleCount }}&lt;/p&gt;
    &lt;button @click="increment"&gt;Increment&lt;/button&gt;
  &lt;/div&gt;
&lt;/template&gt;</code></pre>

<h3>2. 合理组织代码</h3>
<p>按照功能关注点组织代码，而不是按照选项类型：</p>

<pre><code class="language-javascript">// ❌ 不推荐：按选项类型组织
setup() {
  // 所有响应式数据
  const count = ref(0)
  const name = ref('')
  const list = ref([])

  // 所有计算属性
  const doubleCount = computed(() => count.value * 2)
  const filteredList = computed(() => list.value.filter(...))

  // 所有方法
  function increment() { ... }
  function fetchList() { ... }

  return { ... }
}

// ✅ 推荐：按功能关注点组织
setup() {
  // 计数器功能
  const { count, doubleCount, increment } = useCounter()

  // 列表功能
  const { list, filteredList, fetchList } = useList()

  return { ... }
}</code></pre>

<h2>总结</h2>
<p>组合式 API 是 Vue 3 最重要的特性之一，它提供了更灵活、更强大的代码组织方式。通过组合式函数，我们可以轻松实现逻辑复用，编写更易维护的代码。掌握组合式 API 是成为 Vue 3 高级开发者的必经之路。</p>`,
    coverImage: 'https://picsum.photos/800/400?random=1',
    isTop: true,
    status: 'published'
  },
  {
    title: 'Node.js 性能优化实战指南',
    summary: '从内存管理、事件循环、异步编程等多个维度深入探讨 Node.js 性能优化策略，助你构建高性能后端服务。',
    category: '后端开发',
    tags: ['Node.js', '性能优化', '后端'],
    content: `<h2>Node.js 性能优化概述</h2>
<p>Node.js 作为高性能的 JavaScript 运行时，在构建高并发应用方面有着天然优势。然而，不当的使用方式可能导致性能瓶颈。本文将从多个维度探讨 Node.js 的性能优化策略。</p>

<h2>内存管理优化</h2>

<h3>理解 V8 内存机制</h3>
<p>Node.js 使用 V8 引擎，其内存管理有以下特点：</p>

<ul>
<li>新生代（New Space）：存储生命周期较短的对象，采用 Scavenge 算法回收</li>
<li>老生代（Old Space）：存储生命周期较长的对象，采用标记-清除算法回收</li>
<li>默认内存限制：64 位系统约 1.4GB，32 位系统约 700MB</li>
</ul>

<h3>内存泄漏检测</h3>
<p>常见的内存泄漏场景和解决方案：</p>

<pre><code class="language-javascript">// ❌ 内存泄漏示例：未清理的定时器
class DataFetcher {
  constructor() {
    this.cache = new Map()
    this.timer = setInterval(() => {
      this.refreshCache()
    }, 1000)
  }

  refreshCache() {
    // 缓存持续增长，从不清理
    this.cache.set(Date.now(), fetchData())
  }
}

// ✅ 正确做法：清理定时器和限制缓存大小
class DataFetcher {
  constructor() {
    this.cache = new Map()
    this.maxCacheSize = 100
    this.timer = setInterval(() => {
      this.refreshCache()
    }, 1000)
  }

  refreshCache() {
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    this.cache.set(Date.now(), fetchData())
  }

  destroy() {
    clearInterval(this.timer)
    this.cache.clear()
  }
}</code></pre>

<h3>使用内存分析工具</h3>

<pre><code class="language-bash"># 使用 node --inspect 启动调试
node --inspect app.js

# 使用 heapdump 生成堆快照
npm install heapdump

# 在代码中生成快照
const heapdump = require('heapdump')
heapdump.writeSnapshot('/path/to/snapshot.heapsnapshot')</code></pre>

<h2>事件循环优化</h2>

<h3>理解事件循环阶段</h3>
<p>Node.js 事件循环分为六个阶段：</p>

<ol>
<li><strong>timers</strong>：执行 setTimeout 和 setInterval 回调</li>
<li><strong>pending callbacks</strong>：执行系统操作的回调</li>
<li><strong>idle, prepare</strong>：内部使用</li>
<li><strong>poll</strong>：执行 I/O 回调</li>
<li><strong>check</strong>：执行 setImmediate 回调</li>
<li><strong>close callbacks</strong>：执行 close 事件回调</li>
</ol>

<h3>避免阻塞事件循环</h3>

<pre><code class="language-javascript">// ❌ 阻塞事件循环
app.get('/compute', (req, res) => {
  const result = heavyComputation(10000000) // 同步计算
  res.json({ result })
})

// ✅ 使用 setImmediate 分片执行
app.get('/compute', async (req, res) => {
  const result = await heavyComputationAsync(10000000)
  res.json({ result })
})

async function heavyComputationAsync(n) {
  return new Promise((resolve) => {
    let result = 0
    let i = 0
    const chunk = 10000

    function compute() {
      const end = Math.min(i + chunk, n)
      for (; i < end; i++) {
        result += Math.sqrt(i)
      }

      if (i < n) {
        setImmediate(compute)
      } else {
        resolve(result)
      }
    }

    compute()
  })
}</code></pre>

<h2>异步编程优化</h2>

<h3>Promise 并发控制</h3>

<pre><code class="language-javascript">// ❌ 同时发起所有请求，可能导致资源耗尽
async function fetchAllUrls(urls) {
  return Promise.all(urls.map(url => fetch(url)))
}

// ✅ 使用并发控制
async function fetchWithConcurrency(urls, concurrency = 5) {
  const results = []
  const executing = new Set()

  for (const url of urls) {
    const promise = fetch(url).then(result => {
      results.push(result)
      executing.delete(promise)
    })
    executing.add(promise)

    if (executing.size >= concurrency) {
      await Promise.race(executing)
    }
  }

  await Promise.all(executing)
  return results
}</code></pre>

<h3>使用 async_hooks 追踪异步操作</h3>

<pre><code class="language-javascript">const async_hooks = require('async_hooks')

const hook = async_hooks.createHook({
  init(asyncId, type, triggerAsyncId) {
    console.log(\`异步操作创建: \${type}, ID: \${asyncId}, 触发者: \${triggerAsyncId}\`)
  },
  before(asyncId) {
    console.log(\`异步操作开始执行: \${asyncId}\`)
  },
  after(asyncId) {
    console.log(\`异步操作执行完成: \${asyncId}\`)
  },
  destroy(asyncId) {
    console.log(\`异步操作销毁: \${asyncId}\`)
  }
})

hook.enable()</code></pre>

<h2>I/O 性能优化</h2>

<h3>流式处理大文件</h3>

<pre><code class="language-javascript">// ❌ 一次性读取整个文件
app.get('/download', async (req, res) => {
  const content = await fs.readFile('large-file.txt')
  res.send(content)
})

// ✅ 使用流式传输
app.get('/download', (req, res) => {
  const stream = fs.createReadStream('large-file.txt')
  stream.pipe(res)
})

// ✅ 使用流处理数据
const { Transform } = require('stream')

const upperCaseTransform = new Transform({
  transform(chunk, encoding, callback) {
    callback(null, chunk.toString().toUpperCase())
  }
})

fs.createReadStream('input.txt')
  .pipe(upperCaseTransform)
  .pipe(fs.createWriteStream('output.txt'))</code></pre>

<h3>数据库连接池配置</h3>

<pre><code class="language-javascript">const { Pool } = require('pg')

const pool = new Pool({
  max: 20,                    // 最大连接数
  min: 5,                     // 最小连接数
  idleTimeoutMillis: 30000,   // 空闲连接超时
  connectionTimeoutMillis: 2000, // 连接超时
})

// 使用连接池
async function query(sql, params) {
  const client = await pool.connect()
  try {
    return await client.query(sql, params)
  } finally {
    client.release()
  }
}</code></pre>

<h2>缓存策略</h2>

<h3>内存缓存</h3>

<pre><code class="language-javascript">class LRUCache {
  constructor(maxSize = 100) {
    this.maxSize = maxSize
    this.cache = new Map()
  }

  get(key) {
    if (!this.cache.has(key)) return null
    const value = this.cache.get(key)
    // 移到末尾（最近使用）
    this.cache.delete(key)
    this.cache.set(key, value)
    return value
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key)
    }
    if (this.cache.size >= this.maxSize) {
      // 删除最久未使用的项
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    this.cache.set(key, value)
  }

  clear() {
    this.cache.clear()
  }
}

const cache = new LRUCache(1000)

async function getDataWithCache(key) {
  const cached = cache.get(key)
  if (cached) return cached

  const data = await fetchData(key)
  cache.set(key, data)
  return data
}</code></pre>

<h2>性能监控</h2>

<h3>使用内置性能钩子</h3>

<pre><code class="language-javascript">const { performance, PerformanceObserver } = require('perf_hooks')

// 监控性能指标
const obs = new PerformanceObserver((list) => {
  const entries = list.getEntries()
  entries.forEach((entry) => {
    console.log(\`[\${entry.name}] 耗时: \${entry.duration}ms\`)
  })
})
obs.observe({ entryTypes: ['measure'] })

// 测量代码执行时间
performance.mark('start')
// ... 执行代码
performance.mark('end')
performance.measure('MyOperation', 'start', 'end')</code></pre>

<h3>APM 工具集成</h3>

<pre><code class="language-javascript">// 使用 New Relic
require('newrelic')

// 使用 PM2 监控
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'my-app',
    script: 'app.js',
    instances: 'max',
    exec_mode: 'cluster',
    monitor: true,
    max_memory_restart: '1G'
  }]
}</code></pre>

<h2>总结</h2>
<p>Node.js 性能优化是一个系统工程，需要从内存管理、事件循环、异步编程、I/O 处理、缓存策略等多个维度综合考虑。通过合理的优化策略，可以显著提升应用的吞吐量和响应速度。</p>

<p>关键优化点总结：</p>
<ul>
<li>合理设置内存限制，避免内存泄漏</li>
<li>避免阻塞事件循环，使用异步处理</li>
<li>控制并发数量，合理使用连接池</li>
<li>使用流式处理大数据</li>
<li>实施多层缓存策略</li>
<li>持续监控性能指标</li>
</ul>`,
    coverImage: 'https://picsum.photos/800/400?random=2',
    isTop: false,
    status: 'published'
  },
  {
    title: 'TypeScript 高级类型体操指南',
    summary: '深入探索 TypeScript 类型系统的高级特性，掌握条件类型、映射类型、模板字面量类型等高级技巧。',
    category: '前端开发',
    tags: ['TypeScript', '类型系统', '前端'],
    content: `<h2>TypeScript 类型系统概述</h2>
<p>TypeScript 的类型系统是图灵完备的，这意味着我们可以用类型来进行复杂的计算。本文将深入探讨 TypeScript 的高级类型特性。</p>

<h2>条件类型</h2>

<h3>基础条件类型</h3>
<p>条件类型类似于 JavaScript 中的三元表达式，根据条件选择不同的类型：</p>

<pre><code class="language-typescript">type IsString = T extends string ? true : false

type A = IsString<string> // true
type B = IsString<number> // false

// 实用示例：非空类型
type NonNullable = T extends null | undefined ? never : T

type C = NonNullable<string | null | undefined> // string</code></pre>

<h3>条件类型分发</h3>
<p>当条件类型作用于联合类型时，会自动分发到每个成员：</p>

<pre><code class="language-typescript">type ToArray = T extends any ? T[] : never

type Result = ToArray<string | number>
// 等同于 string[] | number[]

// 控制分发行为
type ToArrayNoDistribute = [T] extends [any] ? T[] : never

type Result2 = ToArrayNoDistribute<string | number>
// (string | number)[]</code></pre>

<h3>infer 关键字</h3>
<p>infer 用于在条件类型中推断类型：</p>

<pre><code class="language-typescript">// 提取函数返回类型
type ReturnType = T extends (...args: any[]) => infer R ? R : never

function greet(): string { return 'hello' }
type GreetReturn = ReturnType<typeof greet> // string

// 提取函数参数类型
type Parameters = T extends (...args: infer P) => any ? P : never

type Params = Parameters<(a: string, b: number) => void>
// [string, number]

// 提取 Promise 值类型
type Awaited = T extends PromiseLike ? Awaited : T

type P = Awaited<Promise<Promise<string>>> // string

// 提取数组元素类型
type ElementOf = T extends (infer E)[] ? E : never

type E = ElementOf<string[]> // string</code></pre>

<h2>映射类型</h2>

<h3>基础映射类型</h3>
<p>映射类型可以基于已有类型创建新类型：</p>

<pre><code class="language-typescript">type Readonly = {
  readonly [K in keyof T]: T[K]
}

type Partial = {
  [K in keyof T]?: T[K]
}

interface User {
  id: number
  name: string
  email: string
}

type ReadonlyUser = Readonly<User>
type PartialUser = Partial<User></code></pre>

<h3>键重映射</h3>
<p>TypeScript 4.1+ 支持使用 as 子句重命名键：</p>

<pre><code class="language-typescript">// 添加前缀
type Prefixed = {
  [K in keyof T as \`get\${Capitalize<string & K>}\`]: T[K]
}

type GetUser = Prefixed<User>
// { getId: number, getName: string, getEmail: string }

// 过滤键
type OnlyStrings = {
  [K in keyof T as T[K] extends string ? K : never]: T[K]
}

type StringProps = OnlyStrings<User>
// { name: string, email: string }</code></pre>

<h2>模板字面量类型</h2>

<h3>基础用法</h3>
<pre><code class="language-typescript">type World = 'world'
type Greeting = \`hello \${World}\` // 'hello world'

type EmailLocaleIDs = 'welcome_email' | 'email_heading'
type FooterLocaleIDs = 'footer_title' | 'footer_subtitle'

type AllLocaleIDs = \`\${EmailLocaleIDs | FooterLocaleIDs}_id\`
// 'welcome_email_id' | 'email_heading_id' | 'footer_title_id' | 'footer_subtitle_id'</code></pre>

<h3>内置字符串操作类型</h3>
<pre><code class="language-typescript">type Str = 'hello world'

type Upper = Uppercase<Str>      // 'HELLO WORLD'
type Lower = Lowercase<Str>      // 'hello world'
type Cap = Capitalize<Str>       // 'Hello world'
type Uncap = Uncapitalize<Str>   // 'hello World'

// 实现驼峰转换
type CamelCase<S extends string> = S extends \`\${infer P}_\${infer Q}\`
  ? \`\${P}\${Capitalize<CamelCase<Q>>}\`
  : S

type Camel = CamelCase<'hello_world_type'>
// 'helloWorldType'</code></pre>

<h2>递归类型</h2>

<h3>深度 Readonly</h3>
<pre><code class="language-typescript">type DeepReadonly = {
  readonly [K in keyof T]: T[K] extends object
    ? DeepReadonly<T[K]>
    : T[K]
}

interface Nested {
  a: {
    b: {
      c: string
    }
  }
}

type DeepNested = DeepReadonly<Nested>
// 所有层级都变成 readonly</code></pre>

<h3>深度 Required</h3>
<pre><code class="language-typescript">type DeepRequired = {
  [K in keyof T]-?: T[K] extends object
    ? DeepRequired<T[K]>
    : Required<T[K]>
}

interface Optional {
  a?: {
    b?: {
      c?: string
    }
  }
}

type RequiredOptional = DeepRequired<Optional></code></pre>

<h2>实用工具类型</h2>

<h3>对象操作</h3>
<pre><code class="language-typescript">// 深度 Partial
type DeepPartial = {
  [K in keyof T]?: T[K] extends object
    ? DeepPartial<T[K]>
    : T[K]
}

// 挑选指定键
type PickByType<T, U> = {
  [K in keyof T as T[K] extends U ? K : never]: T[K]
}

interface Mixed {
  name: string
  age: number
  email: string
  count: number
}

type StringProps = PickByType<Mixed, string>
// { name: string, email: string }

// 排除指定键
type OmitByType<T, U> = {
  [K in keyof T as T[K] extends U ? never : K]: T[K]
}

type NonStringProps = OmitByType<Mixed, string>
// { age: number, count: number }</code></pre>

<h3>函数操作</h3>
<pre><code class="language-typescript">// 提取构造函数参数类型
type ConstructorParameters = T extends abstract new (
  ...args: infer P
) => any
  ? P
  : never

// 提取实例类型
type InstanceType = T extends abstract new (...args: any) => infer R
  ? R
  : never

class Person {
  constructor(public name: string, public age: number) {}
}

type PersonParams = ConstructorParameters<typeof Person>
// [string, number]

type PersonInstance = InstanceType<typeof Person>
// Person</code></pre>

<h2>类型体操实战</h2>

<h3>实现 UnionToTuple</h3>
<pre><code class="language-typescript">type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never

type LastOfUnion<U> = UnionToIntersection<
  U extends any ? () => U : never
> extends () => infer R
  ? R
  : never

type Push<T extends any[], V> = [...T, V]

type UnionToTuple<U, Last = LastOfUnion<U>> = [U] extends [never]
  ? []
  : Push<UnionToTuple<Exclude<U, Last>>, Last>

type Tuple = UnionToTuple<'a' | 'b' | 'c'>
// ['a', 'b', 'c']</code></pre>

<h3>实现 JSON 序列化类型</h3>
<pre><code class="language-typescript">type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue }

type JSONType = {
  [K in keyof T]: T[K] extends JSONValue ? T[K] : never
}

interface Data {
  name: string
  count: number
  nested: {
    value: string
  }
  fn: () => void  // 会被排除
}

type ValidJSON = JSONType<Data></code></pre>

<h2>总结</h2>
<p>TypeScript 的类型系统非常强大，通过条件类型、映射类型、模板字面量类型等高级特性，我们可以实现复杂的类型推导和转换。掌握这些技巧，能够让你的 TypeScript 代码更加健壮和优雅。</p>

<p>学习建议：</p>
<ul>
<li>从简单工具类型开始，逐步深入</li>
<li>多阅读 TypeScript 内置类型定义</li>
<li>实践是掌握类型体操的最佳方式</li>
<li>注意类型复杂度，避免过度设计</li>
</ul>`,
    coverImage: 'https://picsum.photos/800/400?random=3',
    isTop: false,
    status: 'published'
  },
  {
    title: 'Docker 容器化部署完全指南',
    summary: '从 Docker 基础概念到高级实践，全面掌握容器化技术，实现应用的快速部署和弹性扩展。',
    category: 'DevOps',
    tags: ['Docker', '容器化', 'DevOps'],
    content: `<h2>Docker 简介</h2>
<p>Docker 是一个开源的容器化平台，它允许开发者将应用及其依赖打包到一个可移植的容器中，然后可以在任何流行的 Linux 或 Windows 操作系统上运行。</p>

<h2>Docker 核心概念</h2>

<h3>镜像（Image）</h3>
<p>镜像是一个只读模板，包含创建 Docker 容器的指令。镜像通常基于另一个镜像，并添加额外的自定义内容。</p>

<pre><code class="language-dockerfile"># 基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "src/index.js"]</code></pre>

<h3>容器（Container）</h3>
<p>容器是镜像的运行实例。它是一个独立的、可执行的软件包，包含运行应用所需的一切。</p>

<pre><code class="language-bash"># 构建镜像
docker build -t my-app:latest .

# 运行容器
docker run -d -p 3000:3000 --name my-container my-app:latest

# 查看运行中的容器
docker ps

# 查看容器日志
docker logs my-container

# 进入容器
docker exec -it my-container sh

# 停止容器
docker stop my-container

# 删除容器
docker rm my-container</code></pre>

<h2>Dockerfile 最佳实践</h2>

<h3>多阶段构建</h3>
<p>多阶段构建可以显著减小最终镜像大小：</p>

<pre><code class="language-dockerfile"># 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 生产阶段
FROM node:18-alpine AS production

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/index.js"]</code></pre>

<h3>优化镜像层</h3>

<pre><code class="language-dockerfile"># ❌ 不推荐：每个 RUN 创建一个新层
RUN apt-get update
RUN apt-get install -y curl
RUN apt-get install -y git
RUN apt-get clean

# ✅ 推荐：合并命令减少层数
RUN apt-get update && apt-get install -y \
    curl \
    git \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 利用构建缓存，把不常变化的放前面
FROM node:18-alpine

WORKDIR /app

# 先复制依赖文件，利用缓存
COPY package*.json ./
RUN npm ci --only=production

# 再复制源代码（变化频繁）
COPY . .

CMD ["node", "src/index.js"]</code></pre>

<h3>使用 .dockerignore</h3>

<pre><code class="language-text"># .dockerignore
node_modules
npm-debug.log
Dockerfile
.dockerignore
.git
.gitignore
README.md
.env
coverage
.nyc_output
*.log
dist
build</code></pre>

<h2>Docker Compose</h2>

<h3>基础配置</h3>
<p>Docker Compose 用于定义和运行多容器应用：</p>

<pre><code class="language-yaml"># docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/mydb
    depends_on:
      - db
      - redis
    networks:
      - app-network
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=mydb
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - app-network
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
    networks:
      - app-network
    restart: unless-stopped

networks:
  app-network:
    driver: bridge

volumes:
  postgres-data:
  redis-data:</code></pre>

<h3>开发环境配置</h3>

<pre><code class="language-yaml"># docker-compose.dev.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
      - "9229:9229"  # Node.js 调试端口
    environment:
      - NODE_ENV=development
    volumes:
      - .:/app
      - /app/node_modules
    command: npm run dev

# 启动开发环境
# docker-compose -f docker-compose.yml -f docker-compose.dev.yml up</code></pre>

<h2>网络配置</h2>

<h3>网络类型</h3>

<pre><code class="language-bash"># bridge 模式（默认）
docker network create my-network

# host 模式（直接使用主机网络）
docker run --network host my-app

# none 模式（无网络）
docker run --network none my-app

# 容器间通信
docker run --name app1 --network my-network my-app
docker run --name app2 --network my-network my-app
# app1 和 app2 可以通过容器名互相访问</code></pre>

<h2>数据管理</h2>

<h3>Volume 和 Bind Mount</h3>

<pre><code class="language-bash"># Volume（由 Docker 管理）
docker volume create my-volume
docker run -v my-volume:/app/data my-app

# Bind Mount（映射主机目录）
docker run -v /host/path:/container/path my-app

# tmpfs（仅存储在内存中）
docker run --tmpfs /tmp my-app</code></pre>

<h3>数据备份与恢复</h3>

<pre><code class="language-bash"># 备份
docker run --rm \
  -v postgres-data:/from \
  -v $(pwd):/to \
  alpine tar czf /to/backup.tar.gz -C /from .

# 恢复
docker run --rm \
  -v postgres-data:/to \
  -v $(pwd):/from \
  alpine tar xzf /from/backup.tar.gz -C /to</code></pre>

<h2>安全最佳实践</h2>

<h3>最小权限原则</h3>

<pre><code class="language-dockerfile"># 创建非 root 用户
FROM node:18-alpine

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

WORKDIR /app

COPY --chown=nextjs:nodejs . .

USER nextjs

EXPOSE 3000
CMD ["node", "server.js"]</code></pre>

<h3>安全扫描</h3>

<pre><code class="language-bash"># 使用 docker scan 扫描漏洞
docker scan my-app:latest

# 使用 Trivy 扫描
trivy image my-app:latest

# 使用 Hadolint 检查 Dockerfile
hadolint Dockerfile</code></pre>

<h2>监控与日志</h2>

<h3>日志管理</h3>

<pre><code class="language-yaml"># docker-compose.yml 日志配置
services:
  app:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"</code></pre>

<h3>健康检查</h3>

<pre><code class="language-dockerfile">HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1</code></pre>

<h2>Kubernetes 部署</h2>

<h3>基础 Deployment</h3>

<pre><code class="language-yaml"># deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: my-app
        image: my-app:latest
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5</code></pre>

<h2>总结</h2>
<p>Docker 容器化技术已经成为现代应用部署的标准。通过合理的 Dockerfile 编写、Docker Compose 编排和 Kubernetes 部署，可以实现应用的快速交付、弹性扩展和高可用运行。</p>

<p>关键实践要点：</p>
<ul>
<li>使用多阶段构建减小镜像体积</li>
<li>合理利用构建缓存加速构建</li>
<li>使用非 root 用户运行容器</li>
<li>配置健康检查和资源限制</li>
<li>实施持续的安全扫描</li>
</ul>`,
    coverImage: 'https://picsum.photos/800/400?random=4',
    isTop: false,
    status: 'published'
  },
  {
    title: 'React Hooks 深入解析',
    summary: '全面解析 React Hooks 的工作原理、最佳实践和常见陷阱，助你成为 React 高级开发者。',
    category: '前端开发',
    tags: ['React', 'Hooks', '前端'],
    content: `<h2>React Hooks 简介</h2>
<p>Hooks 是 React 16.8 引入的新特性，它让你在不编写 class 的情况下使用 state 以及其他的 React 特性。</p>

<h2>基础 Hooks</h2>

<h3>useState</h3>
<p>useState 用于在函数组件中添加状态：</p>

<pre><code class="language-jsx">import { useState } from 'react'

function Counter() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  )
}

// 使用函数式更新（基于前一个状态）
function Counter() {
  const [count, setCount] = useState(0)

  return (
    <button onClick={() => setCount(prev => prev + 1)}>
      Count: {count}
    </button>
  )
}

// 惰性初始化（只在首次渲染时执行）
function ExpensiveComponent() {
  const [state, setState] = useState(() => {
    // 复杂计算只执行一次
    return computeExpensiveValue()
  })
}</code></pre>

<h3>useEffect</h3>
<p>useEffect 用于处理副作用，如数据获取、订阅、DOM 操作等：</p>

<pre><code class="language-jsx">import { useEffect, useState } from 'react'

function UserProfile({ userId }) {
  const [user, setUser] = useState(null)

  // 每次渲染后执行
  useEffect(() => {
    document.title = 'Loading...'

    fetchUser(userId).then(data => {
      setUser(data)
      document.title = data.name
    })
  }, [userId]) // 依赖数组

  if (!user) return <div>Loading...</div>
  return <div>{user.name}</div>
}

// 清理函数
function Timer() {
  useEffect(() => {
    const timer = setInterval(() => {
      console.log('tick')
    }, 1000)

    // 清理函数（组件卸载时执行）
    return () => {
      clearInterval(timer)
    }
  }, []) // 空依赖数组 = 只在挂载时执行一次
}</code></pre>

<h3>useContext</h3>
<p>useContext 用于跨组件共享数据，避免 prop drilling：</p>

<pre><code class="language-jsx">import { createContext, useContext } from 'react'

const ThemeContext = createContext('light')

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Toolbar />
    </ThemeContext.Provider>
  )
}

function Toolbar() {
  return <ThemedButton />
}

function ThemedButton() {
  const theme = useContext(ThemeContext)
  return <button className={theme}>Themed Button</button>
}</code></pre>

<h2>进阶 Hooks</h2>

<h3>useReducer</h3>
<p>useReducer 适用于复杂的状态逻辑：</p>

<pre><code class="language-jsx">import { useReducer } from 'react'

const initialState = { count: 0 }

function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return { count: state.count + 1 }
    case 'decrement':
      return { count: state.count - 1 }
    case 'reset':
      return { count: action.payload }
    default:
      throw new Error('Unknown action')
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, initialState)

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
      <button onClick={() => dispatch({ type: 'reset', payload: 0 })}>
        Reset
      </button>
    </div>
  )
}</code></pre>

<h3>useCallback</h3>
<p>useCallback 返回一个记忆化的回调函数：</p>

<pre><code class="language-jsx">import { useCallback, memo } from 'react'

const ChildComponent = memo(({ onClick, name }) => {
  console.log('Child rendered')
  return <button onClick={onClick}>{name}</button>
})

function Parent() {
  const [count, setCount] = useState(0)

  // 没有 useCallback，每次渲染都会创建新函数
  // 导致 memo 失效
  const handleClick = useCallback(() => {
    console.log('Clicked')
  }, []) // 依赖不变，返回相同引用

  return (
    <div>
      <ChildComponent onClick={handleClick} name="Click me" />
      <button onClick={() => setCount(count + 1)}>Count: {count}</button>
    </div>
  )
}</code></pre>

<h3>useMemo</h3>
<p>useMemo 返回一个记忆化的值：</p>

<pre><code class="language-jsx">import { useMemo } from 'react'

function ExpensiveList({ items, filter }) {
  // 只在 items 或 filter 变化时重新计算
  const filteredItems = useMemo(() => {
    console.log('Filtering...')
    return items.filter(item => item.includes(filter))
  }, [items, filter])

  return (
    <ul>
      {filteredItems.map(item => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}</code></pre>

<h3>useRef</h3>
<p>useRef 用于访问 DOM 或存储可变值：</p>

<pre><code class="language-jsx">import { useRef, useEffect } from 'react'

function TextInput() {
  const inputRef = useRef(null)

  useEffect(() => {
    // 自动聚焦
    inputRef.current.focus()
  }, [])

  return <input ref={inputRef} type="text" />
}

// 存储可变值（不触发重新渲染）
function Timer() {
  const intervalRef = useRef(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      console.log('tick')
    }, 1000)

    return () => clearInterval(intervalRef.current)
  }, [])

  return <div>Timer running...</div>
}</code></pre>

<h2>自定义 Hooks</h2>

<h3>封装通用逻辑</h3>

<pre><code class="language-jsx">// useLocalStorage.js
import { useState, useEffect } from 'react'

function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(error)
      return initialValue
    }
  })

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function 
        ? value(storedValue) 
        : value
      setStoredValue(valueToStore)
      localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(error)
    }
  }

  return [storedValue, setValue]
}

// 使用
function App() {
  const [name, setName] = useLocalStorage('name', 'Guest')
  return <input value={name} onChange={e => setName(e.target.value)} />
}</code></pre>

<h3>useFetch 自定义 Hook</h3>

<pre><code class="language-jsx">function useFetch(url) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const abortController = new AbortController()

    async function fetchData() {
      try {
        setLoading(true)
        const response = await fetch(url, {
          signal: abortController.signal
        })
        if (!response.ok) throw new Error('Network error')
        const json = await response.json()
        setData(json)
        setError(null)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    return () => abortController.abort()
  }, [url])

  return { data, loading, error }
}

// 使用
function UserProfile({ userId }) {
  const { data: user, loading, error } = useFetch(\`/api/users/\${userId}\`)

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  return <div>{user.name}</div>
}</code></pre>

<h2>Hooks 规则</h2>

<h3>两条重要规则</h3>
<ol>
<li><strong>只在最顶层使用 Hook</strong>：不要在循环、条件或嵌套函数中调用 Hook</li>
<li><strong>只在 React 函数中调用 Hook</strong>：不要在普通 JavaScript 函数中调用</li>
</ol>

<pre><code class="language-jsx">// ❌ 错误：在条件语句中使用
if (condition) {
  const [value, setValue] = useState(0)
}

// ✅ 正确：在顶层使用
const [value, setValue] = useState(0)
if (condition) {
  // 使用 value
}

// ❌ 错误：在循环中使用
for (let i = 0; i < 5; i++) {
  const [value, setValue] = useState(i)
}

// ✅ 正确：使用多个 Hook
const [value1, setValue1] = useState(0)
const [value2, setValue2] = useState(1)
const [value3, setValue3] = useState(2)</code></pre>

<h2>常见陷阱</h2>

<h3>闭包陷阱</h3>

<pre><code class="language-jsx">// ❌ 问题代码
function Counter() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      console.log(count) // 永远是 0
      setCount(count + 1) // 永远是 0 + 1
    }, 1000)

    return () => clearInterval(timer)
  }, []) // 空依赖数组

  return <div>{count}</div>
}

// ✅ 解决方案 1：添加依赖
useEffect(() => {
  const timer = setInterval(() => {
    setCount(count + 1)
  }, 1000)
  return () => clearInterval(timer)
}, [count])

// ✅ 解决方案 2：使用函数式更新
useEffect(() => {
  const timer = setInterval(() => {
    setCount(prev => prev + 1)
  }, 1000)
  return () => clearInterval(timer)
}, [])

// ✅ 解决方案 3：使用 useRef
const countRef = useRef(count)
countRef.current = count

useEffect(() => {
  const timer = setInterval(() => {
    console.log(countRef.current)
  }, 1000)
  return () => clearInterval(timer)
}, [])</code></pre>

<h3>依赖数组遗漏</h3>

<pre><code class="language-jsx">// ❌ 遗漏依赖
function Profile({ userId }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    fetchUser(userId).then(setUser)
  }, []) // userId 变化时不会重新获取

  return <div>{user?.name}</div>
}

// ✅ 添加所有依赖
useEffect(() => {
  fetchUser(userId).then(setUser)
}, [userId])</code></pre>

<h2>性能优化</h2>

<h3>避免不必要的渲染</h3>

<pre><code class="language-jsx">import { memo, useCallback, useMemo } from 'react'

// 使用 memo 避免子组件不必要的渲染
const ExpensiveChild = memo(function ExpensiveChild({ data, onClick }) {
  return <div onClick={onClick}>{data}</div>
})

function Parent({ items }) {
  const [count, setCount] = useState(0)

  // 使用 useCallback 缓存回调
  const handleClick = useCallback((id) => {
    console.log('Clicked:', id)
  }, [])

  // 使用 useMemo 缓存计算结果
  const processedItems = useMemo(() => {
    return items.map(item => ({
      ...item,
      processed: true
    }))
  }, [items])

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      {processedItems.map(item => (
        <ExpensiveChild key={item.id} data={item} onClick={handleClick} />
      ))}
    </div>
  )
}</code></pre>

<h2>总结</h2>
<p>React Hooks 彻底改变了我们编写 React 组件的方式。通过理解和正确使用 Hooks，我们可以编写更简洁、更可复用的代码。</p>

<p>关键要点：</p>
<ul>
<li>理解 Hooks 的工作原理和规则</li>
<li>正确设置依赖数组</li>
<li>使用 useCallback 和 useMemo 优化性能</li>
<li>封装自定义 Hooks 复用逻辑</li>
<li>注意闭包陷阱和常见错误</li>
</ul>`,
    coverImage: 'https://picsum.photos/800/400?random=5',
    isTop: false,
    status: 'published'
  },
  {
    title: 'Nuxt 3 深入浅出完全指南',
    summary: '从零开始学习 Nuxt 3，掌握服务端渲染、自动路由、状态管理等核心特性，构建高性能 Vue 应用。',
    category: '前端开发',
    tags: ['Nuxt', 'Vue', 'SSR', '前端'],
    content: `<h2>Nuxt 3 简介</h2>
<p>Nuxt 3 是一个基于 Vue 3 的全栈框架，它提供了服务端渲染（SSR）、静态站点生成（SSG）、自动路由等开箱即用的功能，让开发者能够快速构建高性能的 Web 应用。</p>

<h3>为什么选择 Nuxt 3？</h3>
<ul>
<li><strong>基于 Vue 3</strong>：享受 Composition API、更好的 TypeScript 支持和更小的包体积</li>
<li><strong>服务端渲染</strong>：更好的 SEO 和首屏加载性能</li>
<li><strong>自动路由</strong>：基于文件系统的路由，无需手动配置</li>
<li><strong>零配置</strong>：开箱即用的开发体验</li>
<li><strong>Nitro 引擎</strong>：支持多种部署平台，边缘渲染</li>
</ul>

<h2>快速开始</h2>

<h3>创建项目</h3>
<pre><code class="language-bash"># 使用 npx
npx nuxi@latest init my-app

# 进入项目目录
cd my-app

# 安装依赖
npm install

# 启动开发服务器
npm run dev</code></pre>

<h3>项目结构</h3>
<pre><code class="language-text">my-app/
├── .nuxt/          # 构建生成的临时文件
├── app.vue         # 主应用组件
├── pages/          # 页面组件（自动路由）
├── components/     # 组件（自动导入）
├── composables/    # 组合式函数（自动导入）
├── layouts/        # 布局组件
├── plugins/        # 插件
├── middleware/     # 路由中间件
├── server/         # 服务端代码
├── assets/         # 需要构建的静态资源
├── public/         # 静态文件
├── nuxt.config.ts  # Nuxt 配置文件
└── app.config.ts   # 应用配置</code></pre>

<h2>核心概念</h2>

<h3>页面与路由</h3>
<p>Nuxt 3 使用基于文件系统的路由，pages 目录下的 Vue 文件会自动生成对应的路由：</p>

<pre><code class="language-text">pages/
├── index.vue        → /
├── about.vue        → /about
├── users/
│   ├── index.vue    → /users
│   └── [id].vue     → /users/:id
└── blog/
    └── [slug].vue   → /blog/:slug</code></pre>

<p>动态路由使用方括号语法：</p>

<pre><code class="language-vue">&lt;!-- pages/users/[id].vue --&gt;
&lt;script setup lang="ts"&gt;
const route = useRoute()
const userId = route.params.id

// 或使用 props
const { data: user } = await useFetch(\`/api/users/\${userId}\`)
&lt;/script&gt;

&lt;template&gt;
  &lt;div&gt;
    &lt;h1&gt;用户详情&lt;/h1&gt;
    &lt;p&gt;用户ID: {{ userId }}&lt;/p&gt;
    &lt;pre&gt;{{ user }}&lt;/pre&gt;
  &lt;/div&gt;
&lt;/template&gt;</code></pre>

<h3>布局系统</h3>
<p>布局是可复用的页面包装器，用于定义页面的通用结构：</p>

<pre><code class="language-vue">&lt;!-- layouts/default.vue --&gt;
&lt;template&gt;
  &lt;div class="layout"&gt;
    &lt;header&gt;
      &lt;nav&gt;
        &lt;NuxtLink to="/"&gt;首页&lt;/NuxtLink&gt;
        &lt;NuxtLink to="/about"&gt;关于&lt;/NuxtLink&gt;
      &lt;/nav&gt;
    &lt;/header&gt;
    
    &lt;main&gt;
      &lt;slot /&gt;
    &lt;/main&gt;
    
    &lt;footer&gt;
      &lt;p&gt;© 2024 My App&lt;/p&gt;
    &lt;/footer&gt;
  &lt;/div&gt;
&lt;/template&gt;</code></pre>

<p>页面中使用自定义布局：</p>

<pre><code class="language-vue">&lt;!-- pages/admin.vue --&gt;
&lt;script setup lang="ts"&gt;
definePageMeta({
  layout: 'admin'
})
&lt;/script&gt;

&lt;template&gt;
  &lt;div&gt;Admin Page&lt;/div&gt;
&lt;/template&gt;</code></pre>

<h3>组件自动导入</h3>
<p>components 目录下的组件会自动导入，无需手动 import：</p>

<pre><code class="language-text">components/
├── TheHeader.vue
├── TheFooter.vue
└── user/
    └── UserCard.vue</code></pre>

<pre><code class="language-vue">&lt;!-- 直接使用，无需导入 --&gt;
&lt;template&gt;
  &lt;div&gt;
    &lt;TheHeader /&gt;
    &lt;UserCard :user="currentUser" /&gt;
    &lt;TheFooter /&gt;
  &lt;/div&gt;
&lt;/template&gt;</code></pre>

<h2>数据获取</h2>

<h3>useFetch</h3>
<p>useFetch 是 Nuxt 提供的数据获取组合式函数，支持 SSR 和客户端导航：</p>

<pre><code class="language-vue">&lt;script setup lang="ts"&gt;
interface User {
  id: number
  name: string
  email: string
}

// 基础用法
const { data, pending, error, refresh } = await useFetch&lt;User[]&gt;('/api/users')

// 带参数
const { data: user } = await useFetch('/api/users/1', {
  query: { fields: 'name,email' },
  headers: { 'Authorization': 'Bearer token' }
})

// 响应式 URL
const id = ref(1)
const { data: dynamicUser } = await useFetch(() => \`/api/users/\${id.value}\`)

// 条件请求
const { data: optional } = await useFetch('/api/data', {
  immediate: false  // 不立即执行
})
&lt;/script&gt;

&lt;template&gt;
  &lt;div v-if="pending"&gt;加载中...&lt;/div&gt;
  &lt;div v-else-if="error"&gt;错误: {{ error.message }}&lt;/div&gt;
  &lt;div v-else&gt;
    &lt;ul&gt;
      &lt;li v-for="user in data" :key="user.id"&gt;{{ user.name }}&lt;/li&gt;
    &lt;/ul&gt;
    &lt;button @click="refresh"&gt;刷新&lt;/button&gt;
  &lt;/div&gt;
&lt;/template&gt;</code></pre>

<h3>useAsyncData</h3>
<p>useAsyncData 提供更灵活的数据获取方式：</p>

<pre><code class="language-vue">&lt;script setup lang="ts"&gt;
const { data, pending, error } = await useAsyncData(
  'users',  // 唯一 key，用于缓存
  () => $fetch('/api/users')
)

// 并行请求多个数据
const { data: combined } = await useAsyncData('combined', async () => {
  const [users, posts] = await Promise.all([
    $fetch('/api/users'),
    $fetch('/api/posts')
  ])
  return { users, posts }
})
&lt;/script&gt;</code></pre>

<h3>$fetch</h3>
<p>$fetch 是 Nuxt 提供的 HTTP 客户端，基于 ofetch：</p>

<pre><code class="language-typescript">// GET 请求
const users = await $fetch('/api/users')

// POST 请求
const newUser = await $fetch('/api/users', {
  method: 'POST',
  body: {
    name: 'John',
    email: 'john@example.com'
  }
})

// 错误处理
try {
  const data = await $fetch('/api/data')
} catch (error) {
  if (error.statusCode === 404) {
    console.log('资源不存在')
  }
}</code></pre>

<h2>状态管理</h2>

<h3>useState</h3>
<p>Nuxt 3 内置了 useState 组合式函数，用于跨组件共享状态：</p>

<pre><code class="language-vue">&lt;!-- composables/states.ts --&gt;
export const useCounter = () => useState&lt;number&gt;('counter', () => 0)
export const useUser = () => useState&lt;User | null&gt;('user', () => null)

&lt;!-- 在组件中使用 --&gt;
&lt;script setup lang="ts"&gt;
const counter = useCounter()
const user = useUser()

function increment() {
  counter.value++
}
&lt;/script&gt;

&lt;template&gt;
  &lt;div&gt;
    &lt;p&gt;计数: {{ counter }}&lt;/p&gt;
    &lt;button @click="increment"&gt;+1&lt;/button&gt;
  &lt;/div&gt;
&lt;/template&gt;</code></pre>

<h3>Pinia 集成</h3>
<p>对于复杂的状态管理，推荐使用 Pinia：</p>

<pre><code class="language-bash"># 安装 Pinia
npm install @pinia/nuxt pinia</code></pre>

<pre><code class="language-typescript">// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@pinia/nuxt']
})</code></pre>

<pre><code class="language-typescript">// stores/user.ts
export const useUserStore = defineStore('user', {
  state: () => ({
    user: null as User | null,
    isLoggedIn: false
  }),
  
  getters: {
    displayName: (state) => state.user?.name || 'Guest'
  },
  
  actions: {
    async login(credentials: Credentials) {
      const user = await $fetch('/api/auth/login', {
        method: 'POST',
        body: credentials
      })
      this.user = user
      this.isLoggedIn = true
    },
    
    logout() {
      this.user = null
      this.isLoggedIn = false
    }
  }
})</code></pre>

<h2>服务端功能</h2>

<h3>Server Routes</h3>
<p>server 目录下的文件会自动注册为 API 路由：</p>

<pre><code class="language-typescript">// server/api/users.ts
export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  
  if (method === 'GET') {
    // 获取用户列表
    const users = await db.users.findMany()
    return users
  }
  
  if (method === 'POST') {
    // 创建用户
    const body = await readBody(event)
    const user = await db.users.create({
      data: body
    })
    return user
  }
})</code></pre>

<h3>动态路由参数</h3>

<pre><code class="language-typescript">// server/api/users/[id].ts
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  
  const user = await db.users.findUnique({
    where: { id: parseInt(id) }
  })
  
  if (!user) {
    throw createError({
      statusCode: 404,
      message: 'User not found'
    })
  }
  
  return user
})</code></pre>

<h3>中间件</h3>

<pre><code class="language-typescript">// server/middleware/auth.ts
export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  
  // 只保护 /api/admin 路由
  if (!url.pathname.startsWith('/api/admin')) {
    return
  }
  
  const token = getHeader(event, 'Authorization')
  
  if (!token) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }
  
  // 验证 token...
  event.context.user = await verifyToken(token)
})</code></pre>

<h2>路由中间件</h2>

<h3>命名中间件</h3>

<pre><code class="language-typescript">// middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const isAuthenticated = useState('isAuthenticated')
  
  if (!isAuthenticated.value) {
    return navigateTo('/login')
  }
})</code></pre>

<pre><code class="language-vue">&lt;!-- pages/admin.vue --&gt;
&lt;script setup lang="ts"&gt;
definePageMeta({
  middleware: 'auth'
})
&lt;/script&gt;</code></pre>

<h3>全局中间件</h3>

<pre><code class="language-typescript">// middleware/auth.global.ts
export default defineNuxtRouteMiddleware((to, from) => {
  // 每次路由变化都会执行
  console.log(\`导航到: \${to.path}\`)
})</code></pre>

<h2>插件系统</h2>

<pre><code class="language-typescript">// plugins/my-plugin.ts
export default defineNuxtPlugin((nuxtApp) => {
  // 提供全局方法
  return {
    provide: {
      myHelper: (value: string) => {
        return \`Helper: \${value}\`
      }
    }
  }
})

// 使用
const { $myHelper } = useNuxtApp()
console.log($myHelper('test'))</code></pre>

<h3>注入 Vue 应用</h3>

<pre><code class="language-typescript">// plugins/vue-directive.ts
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('focus', {
    mounted(el) {
      el.focus()
    }
  })
})</code></pre>

<h2>SEO 优化</h2>

<h3>useHead</h3>

<pre><code class="language-vue">&lt;script setup lang="ts"&gt;
useHead({
  title: '我的网站',
  meta: [
    { name: 'description', content: '这是网站描述' },
    { name: 'keywords', content: 'Vue, Nuxt, SSR' },
    { property: 'og:title', content: '我的网站' },
    { property: 'og:description', content: '这是网站描述' },
    { property: 'og:image', content: '/og-image.png' }
  ],
  link: [
    { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
  ]
})
&lt;/script&gt;</code></pre>

<h3>useSeoMeta</h3>

<pre><code class="language-vue">&lt;script setup lang="ts"&gt;
useSeoMeta({
  title: '页面标题',
  description: '页面描述',
  ogTitle: 'Open Graph 标题',
  ogDescription: 'Open Graph 描述',
  ogImage: '/og-image.png',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Twitter 标题',
  twitterDescription: 'Twitter 描述'
})
&lt;/script&gt;</code></pre>

<h2>部署</h2>

<h3>静态部署（SSG）</h3>

<pre><code class="language-bash"># 生成静态文件
npm run generate

# 输出到 .output/public 目录</code></pre>

<h3>服务端部署（SSR）</h3>

<pre><code class="language-bash"># 构建
npm run build

# 启动服务
node .output/server/index.mjs</code></pre>

<h3>Docker 部署</h3>

<pre><code class="language-dockerfile">FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY .output ./.output

EXPOSE 3000

ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000

CMD ["node", ".output/server/index.mjs"]</code></pre>

<h2>最佳实践</h2>

<h3>性能优化</h3>

<pre><code class="language-typescript">// nuxt.config.ts
export default defineNuxtConfig({
  // 启用组件懒加载
  components: [
    { path: '~/components', pathPrefix: false }
  ],
  
  // 优化图片
  image: {
    quality: 80,
    format: ['webp', 'avif']
  },
  
  // 启用压缩
  nitro: {
    compressPublicAssets: true
  }
})</code></pre>

<h3>错误处理</h3>

<pre><code class="language-vue">&lt;!-- error.vue --&gt;
&lt;script setup lang="ts"&gt;
const props = defineProps&lt;{
  error: {
    url: string
    statusCode: number
    message: string
  }
}&gt;()

const handleError = () => clearError({ redirect: '/' })
&lt;/script&gt;

&lt;template&gt;
  &lt;div class="error-page"&gt;
    &lt;h1&gt;{{ error.statusCode }}&lt;/h1&gt;
    &lt;p&gt;{{ error.message }}&lt;/p&gt;
    &lt;button @click="handleError"&gt;返回首页&lt;/button&gt;
  &lt;/div&gt;
&lt;/template&gt;</code></pre>

<h2>总结</h2>
<p>Nuxt 3 是构建现代 Vue 应用的最佳选择之一。它提供了完整的 SSR/SSG 支持、自动导入、文件系统路由等特性，大大提升了开发效率。</p>

<p>核心要点：</p>
<ul>
<li>利用文件系统路由简化路由配置</li>
<li>使用 useFetch 和 useAsyncData 进行数据获取</li>
<li>使用 useState 或 Pinia 管理状态</li>
<li>利用 server 目录创建 API 路由</li>
<li>使用中间件保护路由和处理权限</li>
<li>使用 useHead 优化 SEO</li>
</ul>`,
    coverImage: 'https://picsum.photos/800/400?random=6',
    isTop: false,
    status: 'published'
  }
];

async function seedArticles() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 清空现有文章
    await Article.deleteMany({});
    console.log('Cleared existing articles');

    // 生成2025年的随机日期
    const generateRandomDate = (index, total) => {
      const start = new Date('2025-01-01');
      const end = new Date('2025-12-31');
      const range = end.getTime() - start.getTime();
      const step = range / total;
      const baseTime = start.getTime() + (step * (total - index - 1));
      const randomOffset = Math.random() * step * 0.8;
      return new Date(baseTime + randomOffset);
    };

    // 插入新文章
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      const publishedAt = generateRandomDate(i, articles.length);
      
      const newArticle = new Article({
        ...article,
        author: {
          name: 'Giovan',
          avatar: 'https://serve.giovan.cn/uploads/1769860396165-143ef0bb240aa25d.jpeg',
          bio: '前端开发'
        },
        views: Math.floor(Math.random() * 1000) + 100,
        likes: Math.floor(Math.random() * 100) + 10,
        publishedAt,
        createdAt: publishedAt,
        updatedAt: publishedAt
      });
      await newArticle.save();
      console.log(`Created article: ${article.title} (${publishedAt.toLocaleDateString('zh-CN')})`);
    }

    console.log('All articles created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding articles:', error);
    process.exit(1);
  }
}

seedArticles();
