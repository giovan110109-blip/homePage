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

  const getEmoteByName = (name: string): EmoteItem | undefined => {
    return allEmotes.value.find((emote) => emote.name === name);
  };

  const getEmoteUrl = (name: string): string => {
    const emote = getEmoteByName(name);
    return emote?.url || "";
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
