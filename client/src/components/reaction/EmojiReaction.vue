<template>
  <div 
    class="emoji-reaction-container" 
    ref="containerRef"
    @mouseenter="openPicker"
  >
    <!-- Reaction Picker -->
    <div
      v-if="showPicker"
      ref="pickerRef"
      class="emoji-picker"
      :class="{ 'emoji-picker-expanded': expandedPicker }"
    >
      <div class="emoji-picker-scroll">
        <button
          v-for="emoji in allEmojis"
          :key="emoji.id"
          class="emoji-btn"
          :class="{ 'emoji-btn-active': myReactions.has(emoji.id) }"
          :title="emoji.label"
          @click.stop="toggleReaction(emoji.id)"
        >
          {{ emoji.icon }}
        </button>
      </div>
      <button
        class="emoji-expand-btn"
        :class="{ 'emoji-expand-btn-active': expandedPicker }"
        @click.stop="toggleExpand"
      >
        <ChevronDown class="w-4 h-4" />
      </button>
    </div>

    <!-- Reaction Display -->
    <div v-if="hasReactions" class="reactions-display">
      <div
        v-for="(count, emojiId) in reactionCounts"
        :key="emojiId"
        class="reaction-item"
        :class="{ 'reaction-item-mine': myReactions.has(emojiId) }"
      >
        <span class="reaction-emoji">{{ getEmojiIcon(emojiId) }}</span>
        <span class="reaction-count-small">{{ count }}</span>
      </div>
    </div>

    <!-- Add Reaction Button -->
    <button
      v-if="!hasReactions"
      class="add-reaction-btn"
      :title="addReactionTooltip"
    >
      <Smile class="w-4 h-4" />
    </button>

    <ReactionConfetti
      v-if="confettiIcon"
      :icon-name="confettiIcon"
      :trigger-count="triggerCount"
    ></ReactionConfetti>
  </div>
</template>

<script setup lang="ts">
import { Smile, ChevronDown } from "lucide-vue-next";
import { ElMessage } from "element-plus";
import request from "@/api/request";
import { onClickOutside } from "@vueuse/core";

interface Emoji {
  id: string;
  icon: string;
  label: string;
}

const emojis: Emoji[] = [
  { id: "like", icon: "👍", label: "赞" },
  { id: "love", icon: "❤️", label: "喜欢" },
  { id: "laugh", icon: "😂", label: "哈哈" },
  { id: "wow", icon: "😮", label: "哇" },
  { id: "sad", icon: "😢", label: "难过" },
  { id: "angry", icon: "😠", label: "生气" },
];

const moreEmojis: Emoji[] = [
  { id: "fire", icon: "🔥", label: "火" },
  { id: "star", icon: "⭐", label: "星星" },
  { id: "thinking", icon: "🤔", label: "思考" },
  { id: "clap", icon: "👏", label: "鼓掌" },
  { id: "pray", icon: "🙏", label: "感谢" },
  { id: "party", icon: "🎉", label: "派对" },
  { id: "cool", icon: "😎", label: "酷" },
  { id: "sweat", icon: "😅", label: "冷汗" },
  { id: "kiss", icon: "😘", label: "亲一下" },
  { id: "tease", icon: "😜", label: "淘气" },
  { id: "sweet", icon: "😍", label: "迷恋" },
  { id: "sick", icon: "🤢", label: "不舒服" },
];

const props = defineProps({
  messageId: {
    type: [String, Number],
    required: false,
  },
  targetId: {
    type: [String, Number],
    required: false,
  },
  targetType: {
    type: String,
    default: "message",
  },
  singleUse: {
    type: Boolean,
    default: false,
  },
  reactions: {
    type: Object as () => Record<string, number>,
    default: () => ({}),
  },
});

const containerRef = ref<HTMLElement | null>(null);
const pickerRef = ref<HTMLElement | null>(null);
const showPicker = ref(false);
const expandedPicker = ref(false);
const reactionCounts = ref<Record<string, number>>({});
const myReactions = ref<Set<string>>(new Set());
const reacting = ref(false);
const confettiIcon = ref<string | null>(null);
const triggerCount = ref<number>(0);

const sanitizeCounts = (counts?: Record<string, number>) => {
  return Object.fromEntries(
    Object.entries(counts || {}).filter(([, value]) => Number(value) > 0),
  ) as Record<string, number>;
};

const allEmojis = computed(() => {
  return expandedPicker.value ? [...emojis, ...moreEmojis] : emojis;
});

const toggleExpand = () => {
  expandedPicker.value = !expandedPicker.value;
};

const openPicker = () => {
  showPicker.value = true;
};

const closePicker = () => {
  showPicker.value = false;
  expandedPicker.value = false;
};

onClickOutside(pickerRef, () => {
  if (showPicker.value) {
    closePicker();
  }
});

const resolvedTargetId = computed(() => props.targetId ?? props.messageId);
const hasReactions = computed(
  () => Object.keys(reactionCounts.value).length > 0,
);

const addReactionTooltip = "移入添加表态";

const getStorageKey = (emojiId: string) => {
  if (!resolvedTargetId.value) return "";
  return `reaction_${props.targetType}_${resolvedTargetId.value}_${emojiId}`;
};

const loadMyReactions = () => {
  const set = new Set<string>();
  const targetId = resolvedTargetId.value;
  if (!targetId) {
    myReactions.value = set;
    return;
  }
  const ids = [...emojis, ...moreEmojis].map((e) => e.id);
  ids.forEach((id) => {
    const key = getStorageKey(id);
    if (key && localStorage.getItem(key) === "true") {
      set.add(id);
    }
  });
  myReactions.value = set;
};

const getEndpoint = () => {
  const targetId = resolvedTargetId.value;
  const base = props.targetType === "article" ? "articles" : "messages";
  return `/${base}/${targetId}/react`;
};

const toggleReaction = async (emojiId: string) => {
  if (reacting.value) return;
  if (!resolvedTargetId.value) return;
  reacting.value = true;
  const isMine = myReactions.value.has(emojiId);
  if (props.singleUse && isMine) {
    ElMessage.warning("已表态过该表情");
    reacting.value = false;
    closePicker();
    return;
  }
  const action = props.singleUse ? "add" : isMine ? "remove" : "add";
  try {
    const res = await request.post(getEndpoint(), { type: emojiId, action });
    const counts = (res as any)?.data ?? res;
    if (counts && typeof counts === "object") {
      reactionCounts.value = sanitizeCounts(counts);
    }
    if (action === "add") {
      myReactions.value.add(emojiId);
      const key = getStorageKey(emojiId);
      if (key) localStorage.setItem(key, "true");
      triggerCount.value++;
      confettiIcon.value = getEmojiIcon(emojiId);
    } else {
      myReactions.value.delete(emojiId);
      const key = getStorageKey(emojiId);
      if (key) localStorage.removeItem(key);
    }
  } catch (error) {
    console.error("表态失败", error);
    ElMessage.error(
      (error as any)?.response?.data?.message || "表态失败，请稍后重试",
    );
  } finally {
    reacting.value = false;
    closePicker();
  }
};

const getEmojiIcon = (emojiId: string): string => {
  const emoji =
    emojis.find((e) => e.id === emojiId) ||
    moreEmojis.find((e) => e.id === emojiId);
  return emoji ? emoji.icon : "";
};

watch(
  () => props.reactions,
  (val) => {
    reactionCounts.value = sanitizeCounts(val);
  },
  { immediate: true, deep: true },
);

watch(
  () => resolvedTargetId.value,
  () => {
    loadMyReactions();
  },
  { immediate: true },
);
</script>

<style scoped>
.emoji-reaction-container {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
}

.emoji-picker {
  position: absolute;
  bottom: calc(100% - 4px);
  left: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px;
  padding-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 10;
  animation: slideUp 0.2s ease;
  flex-wrap: nowrap;
}

.emoji-picker-expanded {
  flex-wrap: wrap;
  width: 200px;
  max-height: 200px;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .emoji-picker {
    bottom: calc(100% - 4px);
  }

  .emoji-picker-expanded {
    width: 220px;
    max-height: 250px;
  }
}

.dark .emoji-picker {
  background: #1f2937;
  border-color: #374151;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.emoji-picker-scroll {
  display: flex;
  gap: 4px;
  width: auto;
}

.emoji-picker-expanded .emoji-picker-scroll {
  width: 100%;
  flex-wrap: wrap;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.emoji-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f3f4f6;
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dark .emoji-btn {
  background: #374151;
}

.emoji-btn:hover {
  background: #e5e7eb;
  transform: scale(1.2);
}

.dark .emoji-btn:hover {
  background: #4b5563;
}

.emoji-btn-active {
  background: #bfdbfe;
  color: #0284c7;
}

.dark .emoji-btn-active {
  background: #0e4a8b;
  color: #38bdf8;
}

.emoji-expand-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: #f3f4f6;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.dark .emoji-expand-btn {
  background: #374151;
  color: #d1d5db;
}

.emoji-expand-btn:hover {
  background: #e5e7eb;
}

.dark .emoji-expand-btn:hover {
  background: #4b5563;
}

.emoji-expand-btn-active {
  transform: rotate(180deg);
}

.reactions-display {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.reaction-item {
  display: flex;
  align-items: center;
  gap: 2px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 2px 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
}

.dark .reaction-item {
  background: #111827;
  border-color: #374151;
}

.reaction-item:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.dark .reaction-item:hover {
  background: #1f2937;
  border-color: #4b5563;
}

.reaction-item-mine {
  background: #bfdbfe;
  border-color: #3b82f6;
}

.dark .reaction-item-mine {
  background: #0e4a8b;
  border-color: #60a5fa;
}

.reaction-item-mine:hover {
  background: #bfdbfe;
  border-color: #3b82f6;
}

.dark .reaction-item-mine:hover {
  background: #0e4a8b;
  border-color: #60a5fa;
}

.reaction-emoji {
  font-size: 14px;
}

.reaction-count-small {
  min-width: 12px;
  text-align: center;
  color: #6b7280;
  font-size: 12px;
  font-weight: 500;
}

.dark .reaction-count-small {
  color: #9ca3af;
}

.add-reaction-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s ease;
  padding: 0;
  touch-action: manipulation;
}

@media (max-width: 768px) {
  .add-reaction-btn {
    width: 32px;
    height: 32px;
  }
}

.dark .add-reaction-btn {
  border-color: #4b5563;
  color: #9ca3af;
}

.add-reaction-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
  color: #374151;
}

.dark .add-reaction-btn:hover {
  background: #374151;
  border-color: #6b7280;
  color: #d1d5db;
}
</style>
