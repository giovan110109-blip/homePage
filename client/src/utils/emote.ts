import type { EmoteGroup } from "@/types/emote";

export const EMOTE_GROUPS: EmoteGroup[] = [
  {
    name: "抽象",
    emotes: Array.from({ length: 291 }, (_, i) => ({
      name: `${String(i + 1).padStart(3, "0")}-网络抽象静态表情包.webp`,
      url: `/emote-webp/抽象/${String(i + 1).padStart(3, "0")}-网络抽象静态表情包.webp`,
      group: "抽象",
    })),
  },
  {
    name: "牛牛",
    emotes: [
      ...Array.from({ length: 317 }, (_, i) => ({
        name: `${String(i + 1).padStart(3, "0")}-草地牛牛静态表情包.webp`,
        url: `/emote-webp/牛牛/${String(i + 1).padStart(3, "0")}-草地牛牛静态表情包.webp`,
        group: "牛牛",
      })),
      {
        name: "分享高质量素材.webp",
        url: "/emote-webp/牛牛/分享高质量素材.webp",
        group: "牛牛",
      },
      {
        name: "更多表情包素材.webp",
        url: "/emote-webp/牛牛/更多表情包素材.webp",
        group: "牛牛",
      },
    ],
  },
  {
    name: "高雅人士",
    emotes: Array.from({ length: 352 }, (_, i) => ({
      name: `${String(i + 1).padStart(3, "0")}-高雅人士企鹅表情包.webp`,
      url: `/emote-webp/高雅人士/${String(i + 1).padStart(3, "0")}-高雅人士企鹅表情包.webp`,
      group: "高雅人士",
    })),
  },
];

export const EMOTE_CONFIG = {
  baseUrl: "/emote-webp",
  groups: ["抽象", "牛牛", "高雅人士"],
  lazy: true,
};
