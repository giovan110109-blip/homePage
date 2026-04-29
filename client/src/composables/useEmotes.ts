import { ref, computed } from "vue";
import type { EmoteGroup, EmoteItem } from "@/types/emote";
import { EMOTE_GROUPS } from "@/utils/emote";

export const useEmotes = () => {
  const emoteGroups = ref<EmoteGroup[]>(EMOTE_GROUPS);
  const activeGroup = ref<string>("抽象");
  const searchQuery = ref("");

  const currentGroup = computed(() => {
    return (
      emoteGroups.value.find((g) => g.name === activeGroup.value) ||
      emoteGroups.value[0]
    );
  });

  const filteredEmotes = computed(() => {
    if (!searchQuery.value) {
      return currentGroup.value?.emotes || [];
    }

    const query = searchQuery.value.toLowerCase();
    return (
      currentGroup.value?.emotes.filter((emote) =>
        emote.name.toLowerCase().includes(query),
      ) || []
    );
  });

  const allEmotes = computed(() => {
    return emoteGroups.value.flatMap((group) => group.emotes);
  });

  const normalizeEmoteName = (name: string) =>
    name
      .trim()
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ");

  const getEmoteByName = (name: string): EmoteItem | undefined => {
    const normalizedName = normalizeEmoteName(name);
    return allEmotes.value.find(
      (emote) => normalizeEmoteName(emote.name) === normalizedName,
    );
  };

  const getEmoteUrl = (name: string): string => {
    const normalizedName = normalizeEmoteName(name);
    const emote = getEmoteByName(normalizedName);
    if (emote?.url) return emote.url;

    if (/[\\/?:#]/.test(normalizedName)) return "";

    if (/^\d{3}-网络抽象静态表情包\.webp$/i.test(normalizedName)) {
      return `/emote-webp/抽象/${normalizedName}`;
    }

    if (/^\d{3}-草地牛牛静态表情包\.webp$/i.test(normalizedName)) {
      return `/emote-webp/牛牛/${normalizedName}`;
    }

    if (/^\d{3}-高雅人士企鹅表情包\.webp$/i.test(normalizedName)) {
      return `/emote-webp/高雅人士/${normalizedName}`;
    }

    return "";
  };

  const setActiveGroup = (groupName: string) => {
    activeGroup.value = groupName;
  };

  const setSearchQuery = (query: string) => {
    searchQuery.value = query;
  };

  return {
    emoteGroups,
    activeGroup,
    currentGroup,
    filteredEmotes,
    allEmotes,
    searchQuery,
    getEmoteByName,
    getEmoteUrl,
    setActiveGroup,
    setSearchQuery,
  };
};
