import type { EmoteGroup } from "@/types/emote";

export const EMOTE_GROUPS: EmoteGroup[] = [
  {
    name: "抽象",
    emotes: Array.from({ length: 293 }, (_, i) => ({
      name: `${String(i + 1).padStart(3, "0")}-网络抽象静态表情包.gif`,
      url: `/emote/抽象/${String(i + 1).padStart(3, "0")}-网络抽象静态表情包.gif`,
      group: "抽象",
    })),
  },
  {
    name: "牛牛",
    emotes: Array.from({ length: 319 }, (_, i) => ({
      name: `${String(i + 1).padStart(3, "0")}-草地牛牛静态表情包.gif`,
      url: `/emote/牛牛/${String(i + 1).padStart(3, "0")}-草地牛牛静态表情包.gif`,
      group: "牛牛",
    })),
  },
  {
    name: "高雅人士",
    emotes: Array.from({ length: 349 }, (_, i) => ({
      name: `${String(i + 1).padStart(3, "0")}-高雅人士企鹅表情包.gif`,
      url: `/emote/高雅人士/${String(i + 1).padStart(3, "0")}-高雅人士企鹅表情包.gif`,
      group: "高雅人士",
    })),
  },
];

export const EMOTE_CONFIG = {
  baseUrl: "/emote",
  groups: ["抽象", "牛牛", "高雅人士"],
  lazy: true,
};
