<template>
  <div class="emote-test-page">
    <div class="container">
      <h1 class="page-title">表情包组件测试</h1>

      <div class="section">
        <h2 class="section-title">EmotePicker - 表情包选择器</h2>
        <div class="picker-wrapper">
          <EmotePicker v-model="selectedEmote" @select="onEmoteSelect" />
        </div>
        <div v-if="selectedEmote" class="selected-info">
          <p>
            已选择: <strong>{{ selectedEmote }}</strong>
          </p>
          <EmoteDisplay :emote="selectedEmote" :size="64" />
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">EmoteDisplay - 表情包展示</h2>
        <div class="display-grid">
          <div class="display-item">
            <h3>不同尺寸</h3>
            <div class="size-examples">
              <EmoteDisplay emote="01-阿米嘎蒂朵喵喵表情包" :size="32" />
              <EmoteDisplay emote="02-阿米嘎蒂朵喵喵表情包" :size="48" />
              <EmoteDisplay emote="03-阿米嘎蒂朵喵喵表情包" :size="64" />
              <EmoteDisplay emote="04-阿米嘎蒂朵喵喵表情包" :size="96" />
            </div>
          </div>

          <div class="display-item">
            <h3>懒加载</h3>
            <div class="lazy-examples">
              <EmoteDisplay
                emote="05-阿米嘎蒂朵喵喵表情包"
                :size="48"
                :lazy="true"
              />
              <EmoteDisplay
                emote="06-阿米嘎蒂朵喵喵表情包"
                :size="48"
                :lazy="true"
              />
              <EmoteDisplay
                emote="07-阿米嘎蒂朵喵喵表情包"
                :size="48"
                :lazy="true"
              />
            </div>
          </div>

          <div class="display-item">
            <h3>随机表情</h3>
            <div class="random-examples">
              <EmoteDisplay
                v-for="emote in randomEmotes"
                :key="emote"
                :emote="emote"
                :size="48"
              />
            </div>
            <button @click="refreshRandomEmotes" class="refresh-btn">
              刷新随机表情
            </button>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">EmoteRenderer - 文本表情包渲染</h2>
        <div class="renderer-demo">
          <div class="demo-item">
            <h3>实时编辑</h3>
            <textarea
              v-model="demoText"
              class="demo-textarea"
              placeholder="输入文本，使用（表情包名称）格式插入表情包..."
              rows="4"
            />
          </div>

          <div class="demo-item">
            <h3>渲染结果</h3>
            <div class="demo-result">
              <EmoteRenderer :text="demoText" :size="32" />
            </div>
          </div>

          <div class="demo-item">
            <h3>快速示例</h3>
            <div class="preset-examples">
              <div
                v-for="(example, index) in presetExamples"
                :key="index"
                class="preset-item"
                @click="demoText = example"
              >
                <EmoteRenderer :text="example" :size="28" />
              </div>
            </div>
          </div>

          <div class="demo-item">
            <h3>不同尺寸</h3>
            <div class="size-examples">
              <div>
                <p>小 (24px)</p>
                <EmoteRenderer :text="demoText" :size="24" />
              </div>
              <div>
                <p>中 (32px)</p>
                <EmoteRenderer :text="demoText" :size="32" />
              </div>
              <div>
                <p>大 (48px)</p>
                <EmoteRenderer :text="demoText" :size="48" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">实际应用场景</h2>

        <div class="use-cases">
          <div class="use-case-card">
            <h3>💬 评论系统</h3>
            <div class="use-case-demo">
              <div class="comment-list">
                <div v-for="(comment, index) in comments" :key="index" class="comment-item">
                  <div class="comment-avatar">
                    {{ comment.avatar }}
                  </div>
                  <div class="comment-content">
                    <div class="comment-header">
                      <span class="comment-author">{{ comment.author }}</span>
                      <span class="comment-time">{{ comment.time }}</span>
                    </div>
                    <EmoteRenderer :text="comment.text" :size="24" />
                  </div>
                </div>
              </div>
            </div>
            <div class="use-case-code">
              <pre><code>&lt;CommentItem&gt;
  &lt;EmoteRenderer :text="comment.text" :size="24" /&gt;
&lt;/CommentItem&gt;</code></pre>
            </div>
          </div>

          <div class="use-case-card">
            <h3>💭 留言板</h3>
            <div class="use-case-demo">
              <div class="guestbook-list">
                <div v-for="(message, index) in guestbookMessages" :key="index" class="guestbook-item">
                  <div class="guestbook-header">
                    <span class="guestbook-name">{{ message.name }}</span>
                    <span class="guestbook-date">{{ message.date }}</span>
                  </div>
                  <EmoteRenderer :text="message.content" :size="28" />
                </div>
              </div>
            </div>
            <div class="use-case-code">
              <pre><code>&lt;GuestbookEntry&gt;
  &lt;EmoteRenderer :text="entry.message" :size="28" /&gt;
&lt;/GuestbookEntry&gt;</code></pre>
            </div>
          </div>

          <div class="use-case-card">
            <h3>📱 聊天应用</h3>
            <div class="use-case-demo">
              <div class="chat-container">
                <div v-for="(msg, index) in chatMessages" :key="index" :class="['chat-message', msg.type]">
                  <EmoteRenderer :text="msg.text" :size="22" />
                </div>
              </div>
            </div>
            <div class="use-case-code">
              <pre><code>&lt;ChatMessage&gt;
  &lt;EmoteRenderer :text="message.content" :size="22" /&gt;
&lt;/ChatMessage&gt;</code></pre>
            </div>
          </div>

          <div class="use-case-card">
            <h3>📝 朋友圈动态</h3>
            <div class="use-case-demo">
              <div class="moments-list">
                <div v-for="(moment, index) in moments" :key="index" class="moment-item">
                  <div class="moment-header">
                    <span class="moment-author">{{ moment.author }}</span>
                    <span class="moment-time">{{ moment.time }}</span>
                  </div>
                  <EmoteRenderer :text="moment.content" :size="26" />
                  <div class="moment-actions">
                    <span>👍 {{ moment.likes }}</span>
                    <span>💬 {{ moment.comments }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="use-case-code">
              <pre><code>&lt;MomentItem&gt;
  &lt;EmoteRenderer :text="moment.content" :size="26" /&gt;
&lt;/MomentItem&gt;</code></pre>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">使用指南</h2>
        <div class="guide-content">
          <div class="guide-item">
            <h3>📝 格式说明</h3>
            <p>使用 <code>（表情包名称）</code> 格式插入表情包，例如：</p>
            <div class="guide-example">
              <p>输入：</p>
              <code>我是（01-阿米嘎蒂朵喵喵表情包），很高兴认识你！</code>
              <p>渲染：</p>
              <EmoteRenderer text="我是（01-阿米嘎蒂朵喵喵表情包），很高兴认识你！" :size="28" />
            </div>
          </div>

          <div class="guide-item">
            <h3>✨ 特性</h3>
            <ul class="feature-list">
              <li>✅ 支持中文全角括号 `（）`</li>
              <li>✅ 自动识别有效的表情包名称</li>
              <li>✅ 支持混合文本和表情包</li>
              <li>✅ 支持多个表情包</li>
              <li>✅ 无效的表情包名称会显示为文本</li>
              <li>✅ 自定义表情包尺寸</li>
              <li>✅ 懒加载优化性能</li>
            </ul>
          </div>

          <div class="guide-item">
            <h3>🎨 最佳实践</h3>
            <ul class="feature-list">
              <li>📱 根据场景选择合适的表情包尺寸</li>
              <li>⚡ 使用懒加载提升性能</li>
              <li>🎯 为表情包添加 alt 属性提升可访问性</li>
              <li>💾 合理使用表情包，避免过度使用</li>
              <li>🔍 提供表情包搜索功能方便用户查找</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import EmotePicker from "@/components/ui/EmotePicker.vue";
import EmoteDisplay from "@/components/ui/EmoteDisplay.vue";
import EmoteRenderer from "@/components/ui/EmoteRenderer.vue";
import { useEmotes } from "@/composables/useEmotes";

const selectedEmote = ref("");

const demoText = ref(
  "我是（01-阿米嘎蒂朵喵喵表情包），很高兴认识你！（02-阿米嘎蒂朵喵喵表情包）",
);

const presetExamples = [
  "我是（01-阿米嘎蒂朵喵喵表情包），很高兴认识你！",
  "今天天气真好（02-阿米嘎蒂朵喵喵表情包）",
  "（03-阿米嘎蒂朵喵喵表情包）太可爱了！",
  "谢谢你的帮助（04-阿米嘎蒂朵喵喵表情包）",
  "我们一起加油吧（05-阿米嘎蒂朵喵喵表情包）",
];

const { allEmotes } = useEmotes();

const randomEmotes = ref<string[]>([]);

const comments = ref([
  {
    author: "小明",
    avatar: "小",
    time: "2分钟前",
    text: "这篇文章写得真好（01-阿米嘎蒂朵喵喵表情包），学到了很多！",
  },
  {
    author: "小红",
    avatar: "红",
    time: "5分钟前",
    text: "（02-阿米嘎蒂朵喵喵表情包）太棒了，期待更多内容！",
  },
  {
    author: "小刚",
    avatar: "刚",
    time: "10分钟前",
    text: "谢谢分享（03-阿米嘎蒂朵喵喵表情包），非常有帮助！",
  },
]);

const guestbookMessages = ref([
  {
    name: "访客A",
    date: "2024-01-15",
    content: "网站很漂亮（04-阿米嘎蒂朵喵喵表情包），继续加油！",
  },
  {
    name: "访客B",
    date: "2024-01-14",
    content: "（05-阿米嘎蒂朵喵喵表情包）很喜欢这里的内容！",
  },
]);

const chatMessages = ref([
  {
    type: "received",
    text: "你好（01-阿米嘎蒂朵喵喵表情包），在吗？",
  },
  {
    type: "sent",
    text: "在的（02-阿米嘎蒂朵喵喵表情包），有什么事吗？",
  },
  {
    type: "received",
    text: "想问个问题（03-阿米嘎蒂朵喵喵表情包）",
  },
  {
    type: "sent",
    text: "请说（04-阿米嘎蒂朵喵喵表情包），我尽力帮你！",
  },
]);

const moments = ref([
  {
    author: "张三",
    time: "1小时前",
    content: "今天天气真好（01-阿米嘎蒂朵喵喵表情包），出去走走吧！",
    likes: 12,
    comments: 3,
  },
  {
    author: "李四",
    time: "3小时前",
    content: "（02-阿米嘎蒂朵喵喵表情包）终于完成了这个项目！",
    likes: 25,
    comments: 8,
  },
]);

const onEmoteSelect = (emote: string) => {
  console.log("选择了表情包:", emote);
};

const refreshRandomEmotes = () => {
  const shuffled = [...allEmotes.value].sort(() => Math.random() - 0.5);
  randomEmotes.value = shuffled.slice(0, 6).map((e) => e.name);
};

refreshRandomEmotes();
</script>

<style scoped>
.emote-test-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  text-align: center;
  color: white;
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 40px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.section {
  background: white;
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 32px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e5e7eb;
}

.picker-wrapper {
  margin-bottom: 24px;
}

.selected-info {
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.selected-info p {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.selected-info strong {
  color: #1f2937;
}

.display-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.display-item h3 {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 16px;
}

.size-examples,
.lazy-examples,
.random-examples {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.refresh-btn {
  margin-top: 12px;
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.refresh-btn:hover {
  background: #2563eb;
}

.renderer-demo {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.demo-item {
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
}

.demo-item h3 {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
}

.demo-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  outline: none;
  transition: border-color 0.2s;
}

.demo-textarea:focus {
  border-color: #3b82f6;
}

.demo-result {
  min-height: 100px;
  padding: 12px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  display: flex;
  align-items: center;
}

.preset-examples {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preset-item {
  padding: 8px 12px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.preset-item:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
  transform: translateX(4px);
}

.renderer-demo .size-examples {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.renderer-demo .size-examples > div {
  padding: 12px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.renderer-demo .size-examples p {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.use-cases {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
}

.use-case-card {
  background: #f9fafb;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e5e7eb;
}

.use-case-card h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.use-case-demo {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  max-height: 300px;
  overflow-y: auto;
}

.use-case-code {
  background: #1f2937;
  border-radius: 8px;
  padding: 12px;
  overflow-x: auto;
}

.use-case-code pre {
  margin: 0;
}

.use-case-code code {
  color: #e5e7eb;
  font-family: "Courier New", monospace;
  font-size: 12px;
  line-height: 1.5;
}

.comment-list,
.guestbook-list,
.moments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.comment-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.comment-author {
  font-weight: 600;
  color: #1f2937;
}

.comment-time {
  font-size: 12px;
  color: #9ca3af;
}

.guestbook-item {
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.guestbook-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.guestbook-name {
  font-weight: 600;
  color: #1f2937;
}

.guestbook-date {
  color: #9ca3af;
}

.chat-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-message {
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 12px;
  background: #f3f4f6;
}

.chat-message.sent {
  align-self: flex-end;
  background: #3b82f6;
  color: white;
}

.moment-item {
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 12px;
}

.moment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 14px;
}

.moment-author {
  font-weight: 600;
  color: #1f2937;
}

.moment-time {
  color: #9ca3af;
}

.moment-actions {
  display: flex;
  gap: 16px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
  font-size: 13px;
  color: #6b7280;
}

.guide-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.guide-item h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 12px;
}

.guide-item p {
  color: #4b5563;
  line-height: 1.6;
  margin-bottom: 12px;
}

.guide-example {
  background: #f9fafb;
  border-radius: 8px;
  padding: 12px;
  margin-top: 12px;
}

.guide-example p {
  margin: 8px 0;
  font-size: 14px;
}

.guide-example code {
  display: block;
  padding: 8px 12px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-family: "Courier New", monospace;
  font-size: 13px;
  color: #1f2937;
  margin: 8px 0;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-list li {
  padding: 6px 0;
  color: #4b5563;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .emote-test-page {
    padding: 20px 12px;
  }

  .page-title {
    font-size: 28px;
    margin-bottom: 24px;
  }

  .section {
    padding: 20px;
  }

  .display-grid {
    grid-template-columns: 1fr;
  }

  .renderer-demo {
    grid-template-columns: 1fr;
  }

  .use-cases {
    grid-template-columns: 1fr;
  }

  .guide-content {
    grid-template-columns: 1fr;
  }
}
</style>
