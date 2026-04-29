<template>
  <div class="emoji-reaction-container" ref="containerRef">
    <!-- Reaction Picker -->
    <Transition name="reaction-popover">
      <div
        v-if="showPicker"
        ref="pickerRef"
        class="emoji-picker"
        :class="{ 'emoji-picker-expanded': expandedPicker }"
        role="listbox"
        aria-label="Reaction picker"
        @keydown.esc.stop.prevent="closePicker"
      >
        <div class="emoji-picker-scroll">
          <button
            v-for="emoji in allEmojis"
            :key="emoji.id"
            class="emoji-btn"
            :class="{ 'emoji-btn-active': myReactions.has(emoji.id) }"
            :title="emoji.label"
            :aria-label="emoji.label"
            :aria-pressed="myReactions.has(emoji.id)"
            :disabled="reacting"
            type="button"
            @click.stop="toggleReaction(emoji.id)"
          >
            <span class="emoji-btn-icon">{{ emoji.icon }}</span>
          </button>
        </div>
        <button
          class="emoji-expand-btn"
          :class="{ 'emoji-expand-btn-active': expandedPicker }"
          :aria-expanded="expandedPicker"
          type="button"
          @click.stop="toggleExpand"
        >
          <ChevronDown class="w-4 h-4" />
        </button>
      </div>
    </Transition>

    <!-- Reaction Display -->
    <div 
      v-if="hasReactions" 
      class="reactions-display"
      @mouseenter="openPicker"
      @focusin="openPicker"
      @click.stop="openPicker"
    >
      <button
        v-for="reaction in visibleReactions"
        :key="reaction.id"
        class="reaction-item"
        :class="{ 'reaction-item-mine': reaction.mine }"
        :title="`${reaction.id} ${reaction.count}`"
        type="button"
        @click.stop="toggleReaction(reaction.id)"
      >
        <span class="reaction-emoji">{{ reaction.icon }}</span>
        <span class="reaction-count-small">{{ reaction.count }}</span>
      </button>
    </div>

    <!-- Add Reaction Button -->
    <button
      v-if="!hasReactions"
      class="add-reaction-btn"
      :title="addReactionTooltip"
      type="button"
      @mouseenter="openPicker"
      @focus="openPicker"
      @click.stop="openPicker"
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
const showExtraEmojis = ref(false);
const reactionCounts = ref<Record<string, number>>({});
const myReactions = ref<Set<string>>(new Set());
const reacting = ref(false);
const confettiIcon = ref<string | null>(null);
const triggerCount = ref<number>(0);
let collapseTimer: ReturnType<typeof setTimeout> | null = null;

const sanitizeCounts = (counts?: Record<string, number>) => {
  return Object.fromEntries(
    Object.entries(counts || {}).filter(([, value]) => Number(value) > 0),
  ) as Record<string, number>;
};

const allEmojis = computed(() => {
  return showExtraEmojis.value ? [...emojis, ...moreEmojis] : emojis;
});

const emojiCatalog = computed(() => [...emojis, ...moreEmojis]);
const emojiOrder = computed(() => emojiCatalog.value.map((emoji) => emoji.id));
const visibleReactions = computed(() => {
  return Object.entries(reactionCounts.value)
    .filter(([, count]) => Number(count) > 0)
    .sort(([a], [b]) => {
      const aIndex = emojiOrder.value.indexOf(a);
      const bIndex = emojiOrder.value.indexOf(b);
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    })
    .map(([id, count]) => ({
      id,
      count,
      icon: getEmojiIcon(id),
      mine: myReactions.value.has(id),
    }));
});

const toggleExpand = () => {
  if (collapseTimer) {
    clearTimeout(collapseTimer);
    collapseTimer = null;
  }

  if (expandedPicker.value) {
    expandedPicker.value = false;
    collapseTimer = setTimeout(() => {
      showExtraEmojis.value = false;
      collapseTimer = null;
    }, 220);
    return;
  }

  showExtraEmojis.value = true;
  requestAnimationFrame(() => {
    expandedPicker.value = true;
  });
};

const openPicker = () => {
  showPicker.value = true;
};

const closePicker = () => {
  showPicker.value = false;
  expandedPicker.value = false;
  showExtraEmojis.value = false;
  if (collapseTimer) {
    clearTimeout(collapseTimer);
    collapseTimer = null;
  }
};

onClickOutside(containerRef, () => {
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
  emojiCatalog.value.forEach(({ id }) => {
    const key = getStorageKey(id);
    if (key && localStorage.getItem(key) === "true") {
      set.add(id);
    }
  });
  myReactions.value = set;
};

const getEndpoint = () => {
  const targetId = resolvedTargetId.value;
  const base = props.targetType === "article" ? "articles" : props.targetType === "message" ? "messages" : "moments";
  return `/${base}/${targetId}/react`;
};

const toggleReaction = async (emojiId: string) => {
  if (reacting.value) return;
  if (!resolvedTargetId.value) return;
  reacting.value = true;
  const isMine = myReactions.value.has(emojiId);
  const action = isMine ? "remove" : "add";
  try {
    if (props.singleUse && action === "add") {
      const previousIds = Array.from(myReactions.value).filter((id) => id !== emojiId);
      await Promise.all(
        previousIds.map((id) => request.post(getEndpoint(), { type: id, action: "remove" })),
      );
      previousIds.forEach((id) => {
        const key = getStorageKey(id);
        if (key) localStorage.removeItem(key);
      });
    }

    const res = await request.post(getEndpoint(), { type: emojiId, action });
    const counts = (res as any)?.data ?? res;
    if (counts && typeof counts === "object") {
      reactionCounts.value = sanitizeCounts(counts);
    }
    if (action === "add") {
      myReactions.value = props.singleUse
        ? new Set([emojiId])
        : new Set([...myReactions.value, emojiId]);
      const key = getStorageKey(emojiId);
      if (key) localStorage.setItem(key, "true");
      triggerCount.value++;
      confettiIcon.value = getEmojiIcon(emojiId);
    } else {
      const next = new Set(myReactions.value);
      next.delete(emojiId);
      myReactions.value = next;
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

onBeforeUnmount(() => {
  if (collapseTimer) {
    clearTimeout(collapseTimer);
  }
});
</script>

<style scoped>
.emoji-reaction-container {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
}

.emoji-picker {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--theme-surface-strong) 94%, white 6%),
      var(--theme-surface)
    );
  border: 1px solid var(--theme-border);
  border-radius: 18px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  box-shadow: var(--theme-shadow-lg);
  z-index: 30;
  width: min(292px, calc(100vw - 32px));
  max-height: 104px;
  max-width: min(340px, calc(100vw - 32px));
  overflow: hidden;
  backdrop-filter: blur(24px);
  transition: max-height 220ms cubic-bezier(0.22, 1, 0.36, 1);
}

.emoji-picker-expanded {
  max-height: 220px;
}

@media (max-width: 768px) {
  .emoji-picker {
    bottom: calc(100% + 8px);
    width: min(292px, calc(100vw - 28px));
    max-width: calc(100vw - 28px);
  }

  .emoji-picker-expanded {
    max-height: 220px;
  }
}

.emoji-picker::after {
  position: absolute;
  bottom: -6px;
  left: 18px;
  width: 12px;
  height: 12px;
  content: "";
  background: var(--theme-surface);
  border-right: 1px solid var(--theme-border);
  border-bottom: 1px solid var(--theme-border);
  transform: rotate(45deg);
}

.emoji-picker-scroll {
  display: grid;
  grid-template-columns: repeat(6, minmax(36px, 1fr));
  gap: 6px;
}

.reaction-popover-enter-active,
.reaction-popover-leave-active {
  transition:
    opacity 160ms ease,
    transform 160ms ease;
}

.reaction-popover-enter-from,
.reaction-popover-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.96);
}

.emoji-btn {
  min-width: 38px;
  height: 38px;
  border: 1px solid transparent;
  background: var(--theme-bg-muted);
  border-radius: 12px;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    background-color 0.18s ease,
    box-shadow 0.18s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  color: var(--theme-text-secondary);
}

.emoji-btn:disabled {
  cursor: wait;
  opacity: 0.64;
}

.emoji-btn-icon {
  font-size: 19px;
  line-height: 1;
}

.emoji-btn:hover {
  background: var(--theme-surface-strong);
  border-color: color-mix(in srgb, var(--theme-accent) 28%, transparent);
  box-shadow: var(--theme-shadow-sm);
  transform: translateY(-3px);
}

.emoji-btn-active {
  background: var(--theme-accent-soft);
  border-color: var(--theme-accent);
  box-shadow:
    0 0 0 3px color-mix(in srgb, var(--theme-accent) 12%, transparent),
    var(--theme-shadow-sm);
}

.emoji-expand-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 28px;
  background: var(--theme-bg-muted);
  border: 1px solid var(--theme-border);
  border-radius: 12px;
  cursor: pointer;
  color: var(--theme-text-muted);
  transition: all 0.2s ease;
  align-self: flex-end;
}

.emoji-expand-btn:hover {
  background: var(--theme-accent-soft);
  border-color: color-mix(in srgb, var(--theme-accent) 28%, transparent);
  color: var(--theme-accent);
}

.emoji-expand-btn-active {
  transform: rotate(180deg);
}

.reactions-display {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
}

.reaction-item {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--theme-surface-soft);
  border: 1px solid var(--theme-border);
  border-radius: 999px;
  padding: 3px 9px 3px 7px;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    background-color 0.18s ease,
    box-shadow 0.18s ease;
  font-size: 13px;
  color: var(--theme-text-secondary);
}

.reaction-item:focus-visible {
  outline: none;
  box-shadow: 0 0 0 4px var(--theme-accent-soft);
}

.reaction-item:hover {
  background: var(--theme-surface-strong);
  border-color: var(--theme-border-strong);
  transform: translateY(-1px);
}

.reaction-item-mine {
  background: var(--theme-accent-soft);
  border-color: color-mix(in srgb, var(--theme-accent) 48%, transparent);
  color: var(--theme-accent);
}

.reaction-item-mine:hover {
  border-color: var(--theme-accent);
  box-shadow: var(--theme-shadow-sm);
}

.reaction-emoji {
  font-size: 14px;
}

.reaction-count-small {
  min-width: 12px;
  text-align: center;
  color: currentColor;
  font-size: 12px;
  font-weight: 700;
}

.add-reaction-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: var(--theme-surface-soft);
  border: 1px solid var(--theme-border);
  border-radius: 999px;
  cursor: pointer;
  color: var(--theme-text-muted);
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    background-color 0.18s ease,
    color 0.18s ease;
  padding: 0;
  touch-action: manipulation;
}

@media (max-width: 768px) {
  .add-reaction-btn {
    width: 32px;
    height: 32px;
  }
}

.add-reaction-btn:hover {
  background: var(--theme-accent-soft);
  border-color: color-mix(in srgb, var(--theme-accent) 48%, transparent);
  color: var(--theme-accent);
  transform: translateY(-1px);
}

.add-reaction-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 4px var(--theme-accent-soft);
}
</style>
