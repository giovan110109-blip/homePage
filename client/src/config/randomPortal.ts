export type RandomPortalType = "photo" | "article" | "moment" | "travel" | "friend";

export interface RandomPortalAccessItem {
  type: RandomPortalType;
  enabled: boolean;
  routeBase: `/${string}`;
  label: string;
}

// 随机传送门白名单：默认只放行顶部 Header 中已经展示的入口。
// 如需开放文章/说说，改 enabled 为 true，并确认对应 routeBase 是你想公开随机进入的路径。
export const randomPortalAccessList: RandomPortalAccessItem[] = [
  { type: "photo", enabled: true, routeBase: "/gallery", label: "一张照片" },
  { type: "travel", enabled: true, routeBase: "/travel", label: "一个旅行地点" },
  { type: "friend", enabled: true, routeBase: "/friends", label: "一个朋友站点" },
  { type: "article", enabled: false, routeBase: "/articles", label: "一篇文章" },
  { type: "moment", enabled: false, routeBase: "/moments", label: "一条说说" },
];

const enabledEntries = () => randomPortalAccessList.filter((item) => item.enabled);

export const getEnabledRandomPortalTypes = () => enabledEntries().map((item) => item.type);

export const getRandomPortalTypeLabel = (type: RandomPortalType) =>
  randomPortalAccessList.find((item) => item.type === type)?.label || "一段旧时光";

export const getRandomPortalIntroText = () => {
  const labels = enabledEntries().map((item) => item.label);
  return labels.length ? `${labels.join("、")}，随机开一扇门。` : "传送门还没有配置可进入路径。";
};

export const isRandomPortalDestinationAllowed = (destination: {
  type?: string;
  path?: string;
  externalUrl?: string;
}) => {
  const entry = randomPortalAccessList.find(
    (item) => item.enabled && item.type === destination.type,
  );
  if (!entry) return false;

  if (destination.externalUrl) {
    return entry.routeBase === "/friends";
  }

  if (!destination.path) return false;
  const firstSegment = `/${destination.path.replace(/^\//, "").split(/[/?#]/)[0]}`;
  return firstSegment === entry.routeBase;
};
