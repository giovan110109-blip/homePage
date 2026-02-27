import type { EmoteGroup } from "@/types/emote";

export const EMOTE_GROUPS: EmoteGroup[] = [
  {
    name: "咪咪",
    emotes: Array.from({ length: 91 }, (_, i) => {
      const index = i + 1;
      const paddedIndex = String(index).padStart(2, "0");
      const isJpg = [16, 33, 40, 56].includes(index);
      const ext = isJpg ? "jpg" : "gif";
      return {
        name: `${paddedIndex}-阿米嘎蒂朵喵喵表情包.${ext}`,
        url: `/emote/咪咪/${paddedIndex}-阿米嘎蒂朵喵喵表情包.${ext}`,
        group: "咪咪",
      };
    }),
  },
  {
    name: "牛牛",
    emotes: Array.from({ length: 123 }, (_, i) => ({
      name: `${String(i + 1).padStart(3, "0")}-草地牛牛静态表情包.gif`,
      url: `/emote/牛牛/${String(i + 1).padStart(3, "0")}-草地牛牛静态表情包.gif`,
      group: "牛牛",
    })),
  },
  {
    name: "猫meme",
    emotes: Array.from({ length: 152 }, (_, i) => ({
      name: `${String(i + 1).padStart(3, "0")}-猫meme动态表情包.gif`,
      url: `/emote/猫meme/${String(i + 1).padStart(3, "0")}-猫meme动态表情包.gif`,
      group: "猫meme",
    })),
  },
  {
    name: "猫meme②",
    emotes: Array.from({ length: 102 }, (_, i) => ({
      name: `${String(i + 1).padStart(3, "0")}-猫meme②动态表情包.gif`,
      url: `/emote/猫meme②/${String(i + 1).padStart(3, "0")}-猫meme②动态表情包.gif`,
      group: "猫meme②",
    })),
  },
  {
    name: "颗秒",
    emotes: Array.from({ length: 69 }, (_, i) => ({
      name: `${String(i + 1).padStart(2, "0")}-颗秒表情包.gif`,
      url: `/emote/颗秒/${String(i + 1).padStart(2, "0")}-颗秒表情包.gif`,
      group: "颗秒",
    })),
  },
  {
    name: "高雅人士",
    emotes: Array.from({ length: 351 }, (_, i) => ({
      name: `${String(i + 1).padStart(3, "0")}-高雅人士企鹅表情包.gif`,
      url: `/emote/高雅人士/${String(i + 1).padStart(3, "0")}-高雅人士企鹅表情包.gif`,
      group: "高雅人士",
    })),
  },
];

export const EMOTE_CONFIG = {
  baseUrl: "/emote",
  groups: ["咪咪", "牛牛", "猫meme", "猫meme②", "颗秒", "高雅人士"],
  lazy: true,
};
