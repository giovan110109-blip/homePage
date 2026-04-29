<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import {
  Activity,
  CalendarClock,
  Copy,
  Eye,
  ExternalLink,
  Radar,
  Radio,
  Rocket,
  Satellite,
  Search,
  Send,
  Telescope,
  Zap,
} from "lucide-vue-next";
import AppButton from "@/components/ui/AppButton.vue";
import Loading from "@/components/ui/Loading.vue";
import {
  getFriendLinks,
  applyFriendLink,
  recordFriendLinkClick,
} from "@/api/friendLink";
import type { FriendLink, FriendLinkFormData } from "@/types/api";
import { getExternalLinkRedirectUrl } from "@/utils/external-link";
import { normalizeHttpUrl } from "@/utils/url";

type ViewMode = "star" | "list";
type PlanetStatusKey = "new" | "signal" | "quiet" | "dormant";

interface CategoryMeta {
  key: string;
  label: string;
  tone: string;
  glow: string;
}

interface PlanetStatus {
  key: PlanetStatusKey;
  label: string;
  description: string;
}

const categoryMeta: Record<string, CategoryMeta> = {
  tech: {
    key: "tech",
    label: "技术星系",
    tone: "#38bdf8",
    glow: "rgba(56, 189, 248, 0.42)",
  },
  design: {
    key: "design",
    label: "设计星系",
    tone: "#f59e0b",
    glow: "rgba(245, 158, 11, 0.42)",
  },
  life: {
    key: "life",
    label: "生活星系",
    tone: "#fef3c7",
    glow: "rgba(254, 243, 199, 0.34)",
  },
  tools: {
    key: "tools",
    label: "工具星系",
    tone: "#2dd4bf",
    glow: "rgba(45, 212, 191, 0.38)",
  },
  other: {
    key: "other",
    label: "边缘星云",
    tone: "#94a3b8",
    glow: "rgba(148, 163, 184, 0.34)",
  },
};

const loading = ref(false);
const submitting = ref(false);
const isRadarScanning = ref(false);
const friendLinks = ref<FriendLink[]>([]);
const selectedLink = ref<FriendLink | null>(null);
const viewMode = ref<ViewMode>("star");
const selectedCategory = ref("all");
const keyword = ref("");
const radarMessage = ref("等待一次深空扫描");
const formCardRef = ref<HTMLElement | null>(null);
const formCardEffect = ref({ x: 0, y: 0, show: false });

const form = ref<FriendLinkFormData>({
  name: "",
  url: "",
  description: "",
  avatar: "",
  email: "",
  rss: "",
  category: "tech",
});

const getCategory = (category?: string) =>
  categoryMeta[category || ""] || categoryMeta.other;
const getCategoryLabel = (category?: string) => getCategory(category).label;
const getFriendLinkAvatar = (url?: string) =>
  url ? normalizeHttpUrl(url) : "";
const getFriendLinkHref = (url: string) => {
  const normalized = normalizeHttpUrl(url);
  return normalized ? getExternalLinkRedirectUrl(normalized) : "#";
};
const getLatestPostHref = (link: FriendLink) => {
  const normalized = normalizeHttpUrl(link.latestPost?.url || "");
  return normalized ? getExternalLinkRedirectUrl(normalized) : "#";
};
const getLatestPostTime = (link: FriendLink) =>
  link.latestPost?.publishedAt
    ? formatSignalTime(link.latestPost.publishedAt)
    : "时间未知";
const getDaysSince = (value?: string | null) => {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return null;
  return Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000));
};
const formatSignalTime = (value?: string | null) => {
  const days = getDaysSince(value);
  if (days === null) return "尚未记录";
  if (days === 0) return "今天";
  if (days === 1) return "昨天";
  if (days < 30) return `${days} 天前`;
  if (days < 365) return `${Math.floor(days / 30)} 个月前`;
  return `${Math.floor(days / 365)} 年前`;
};
const getPlanetStatus = (link: FriendLink): PlanetStatus => {
  const createdDays = getDaysSince(link.createdAt);
  const clickDays = getDaysSince(link.lastClickedAt);

  if (createdDays !== null && createdDays <= 14) {
    return {
      key: "new",
      label: "新星接入",
      description: "最近加入星图，轨道仍在升温",
    };
  }

  if (clickDays !== null && clickDays <= 7) {
    return {
      key: "signal",
      label: "信号活跃",
      description: `最近一次跃迁在${formatSignalTime(link.lastClickedAt)}`,
    };
  }

  if ((link.clicks || 0) <= 2 && (clickDays === null || clickDays > 45)) {
    return {
      key: "dormant",
      label: "休眠星体",
      description: "很久没有访客跃迁，等待被重新发现",
    };
  }

  return {
    key: "quiet",
    label: "稳定巡航",
    description: "安静运行在固定轨道上",
  };
};
const getSignalLevel = (link: FriendLink) => {
  const clicks = link.clicks || 0;
  if (clicks >= 100) return "强信号";
  if (clicks >= 30) return "中继信号";
  if (clicks > 0) return "微弱信号";
  return "未捕获信号";
};
const getPlanetTags = (link: FriendLink) =>
  (link.tags || []).filter(Boolean).slice(0, 4);

const categories = computed(() => {
  const map = new Map<string, number>();
  friendLinks.value.forEach((link) => {
    const key = link.category || "other";
    map.set(key, (map.get(key) || 0) + 1);
  });
  return [...map.entries()].map(([key, count]) => ({
    ...getCategory(key),
    count,
  }));
});

const visibleFriendLinks = computed(() => {
  const query = keyword.value.trim().toLowerCase();
  return friendLinks.value.filter((link) => {
    const categoryMatched =
      selectedCategory.value === "all" ||
      link.category === selectedCategory.value;
    const keywordMatched =
      !query ||
      link.name.toLowerCase().includes(query) ||
      link.description.toLowerCase().includes(query) ||
      getCategoryLabel(link.category).includes(query);
    return categoryMatched && keywordMatched;
  });
});

const starNodes = computed(() =>
  visibleFriendLinks.value.map((link, visibleIndex) => {
    const stableIndex = Math.max(
      0,
      friendLinks.value.findIndex((item) => item._id === link._id),
    );
    const categoryIndex = Math.max(
      0,
      Object.keys(categoryMeta).indexOf(link.category || "other"),
    );
    const status = getPlanetStatus(link);
    const ring = 18 + (categoryIndex % 4) * 12 + Math.min(12, stableIndex % 5);
    const angle = (stableIndex * 137.5 + categoryIndex * 41) % 360;
    const radius = Math.min(
      34,
      18 +
        Math.log2((link.clicks || 0) + 1) * 4 +
        (status.key === "new" ? 4 : 0),
    );
    const x = 50 + Math.cos((angle * Math.PI) / 180) * ring;
    const y = 50 + Math.sin((angle * Math.PI) / 180) * (ring * 0.72);
    const meta = getCategory(link.category);
    return {
      link,
      x: Math.min(90, Math.max(10, x)),
      y: Math.min(84, Math.max(14, y)),
      radius,
      meta,
      status,
      delay: `${visibleIndex * 70}ms`,
    };
  }),
);

const constellationLines = computed(() => {
  const lines: Array<{
    id: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    tone: string;
    strength: number;
  }> = [];
  const nodes = starNodes.value;

  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const left = nodes[i];
      const right = nodes[j];
      const sharedTags = getPlanetTags(left.link).filter((tag) =>
        getPlanetTags(right.link).includes(tag),
      );
      const sameCategory = left.link.category === right.link.category;

      if (!sameCategory && sharedTags.length === 0) continue;
      lines.push({
        id: `${left.link._id}-${right.link._id}`,
        x1: left.x,
        y1: left.y,
        x2: right.x,
        y2: right.y,
        tone: sameCategory ? left.meta.tone : "var(--theme-accent-strong)",
        strength: sharedTags.length ? 0.52 : 0.24,
      });
      if (lines.length >= 22) return lines;
    }
  }

  return lines;
});

const totalClicks = computed(() =>
  friendLinks.value.reduce((sum, link) => sum + (link.clicks || 0), 0),
);
const mostVisited = computed(
  () =>
    [...friendLinks.value].sort((a, b) => (b.clicks || 0) - (a.clicks || 0))[0],
);
const activePlanets = computed(
  () =>
    friendLinks.value.filter((link) =>
      ["new", "signal"].includes(getPlanetStatus(link).key),
    ).length,
);
const selectedPlanetStatus = computed(() =>
  selectedLink.value ? getPlanetStatus(selectedLink.value) : null,
);
const loadFriendLinks = async () => {
  loading.value = true;
  try {
    const res = await getFriendLinks();
    friendLinks.value = (res.data || []).filter(
      (link) => link.isActive !== false && link.status !== "rejected",
    );
  } catch (error: any) {
    ElMessage.error(error.message || "星图暂时没有醒开，请稍后再试");
  } finally {
    loading.value = false;
  }
};

const selectLink = (link: FriendLink) => {
  selectedLink.value = link;
  radarMessage.value = `已锁定 ${link.name}`;
};

const handleLinkClick = async (link: FriendLink) => {
  const normalizedUrl = normalizeHttpUrl(link.url);
  if (!normalizedUrl) {
    ElMessage.warning("该友情链接地址无效");
    return;
  }

  const index = friendLinks.value.findIndex((item) => item._id === link._id);
  if (index > -1) {
    friendLinks.value[index].clicks =
      (friendLinks.value[index].clicks || 0) + 1;
  }

  try {
    await recordFriendLinkClick(link._id);
  } catch (error) {
    if (index > -1) {
      friendLinks.value[index].clicks = Math.max(
        0,
        (friendLinks.value[index].clicks || 1) - 1,
      );
    }
  }

  window.location.href = getExternalLinkRedirectUrl(normalizedUrl);
};

const scanRandomPlanet = async () => {
  if (isRadarScanning.value || !visibleFriendLinks.value.length) return;

  isRadarScanning.value = true;
  radarMessage.value = "雷达正在穿过星系尘埃...";
  await new Promise((resolve) => window.setTimeout(resolve, 720));
  const link =
    visibleFriendLinks.value[
      Math.floor(Math.random() * visibleFriendLinks.value.length)
    ];
  selectLink(link);
  radarMessage.value = `发现 ${getCategoryLabel(link.category)}：${link.name}`;
  window.setTimeout(() => {
    isRadarScanning.value = false;
  }, 360);
};

const copyLink = async (link: FriendLink) => {
  const normalizedUrl = normalizeHttpUrl(link.url);
  if (!normalizedUrl) return;
  await navigator.clipboard?.writeText(normalizedUrl);
  ElMessage.success("星球坐标已复制");
};

const handleSubmit = async () => {
  const name = form.value.name.trim();
  const description = form.value.description.trim();
  const email = form.value.email.trim();
  const rawUrl = form.value.url.trim();
  const rawAvatar = (form.value.avatar || "").trim();
  const rawRss = (form.value.rss || "").trim();
  const normalizedUrl = normalizeHttpUrl(
    /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`,
  );
  const normalizedAvatar = rawAvatar
    ? normalizeHttpUrl(
        /^https?:\/\//i.test(rawAvatar) ? rawAvatar : `https://${rawAvatar}`,
      )
    : "";
  const normalizedRss = rawRss
    ? normalizeHttpUrl(
        /^https?:\/\//i.test(rawRss) ? rawRss : `https://${rawRss}`,
      )
    : "";

  if (!name || !rawUrl || !description || !email) {
    ElMessage.warning("请填写星球名称、星球坐标、星球简介和联系邮箱");
    return;
  }

  if (!normalizedUrl) {
    ElMessage.warning("请输入正确的星球坐标");
    return;
  }

  if (form.value.avatar && !normalizedAvatar) {
    ElMessage.warning("星球徽记只支持 http 或 https");
    return;
  }

  if (form.value.rss && !normalizedRss) {
    ElMessage.warning("RSS 地址只支持 http 或 https");
    return;
  }

  submitting.value = true;
  try {
    await applyFriendLink({
      ...form.value,
      name,
      description,
      email,
      url: normalizedUrl,
      avatar: normalizedAvatar || "",
      rss: normalizedRss || "",
    });
    ElMessage.success("坐标已发射，等待站长接入星图");
    resetForm();
  } catch (error: any) {
    ElMessage.error(error.message || "发射失败，请稍后再试");
  } finally {
    submitting.value = false;
  }
};

const resetForm = () => {
  form.value = {
    name: "",
    url: "",
    description: "",
    avatar: "",
    email: "",
    rss: "",
    category: "tech",
  };
};

const handleFormCardMouseMove = (event: MouseEvent) => {
  if (!formCardRef.value) return;
  const rect = formCardRef.value.getBoundingClientRect();
  formCardEffect.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
    show: true,
  };
};

const handleFormCardMouseLeave = () => {
  formCardEffect.value = { ...formCardEffect.value, show: false };
};

watch(viewMode, (mode) => {
  localStorage.setItem("friend-star-view-mode", mode);
});

onMounted(() => {
  const savedMode = localStorage.getItem("friend-star-view-mode");
  viewMode.value =
    savedMode === "star" || savedMode === "list"
      ? savedMode
      : window.matchMedia("(max-width: 768px)").matches
        ? "list"
        : "star";
  loadFriendLinks();
});
</script>

<template>
  <div class="friend-star-page min-h-screen py-16 sm:py-20">
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="star-nebula star-nebula-a"></div>
      <div class="star-nebula star-nebula-b"></div>
    </div>

    <div class="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <header class="star-hero">
        <span class="star-kicker"
          ><Radar class="h-4 w-4" /> FRIEND STAR MAP</span
        >
        <h1>朋友圈星图</h1>
        <p>每一个友链，都是我在互联网宇宙里遇到的一颗星。</p>
        <div class="star-stats">
          <div>
            <strong>{{ friendLinks.length }}</strong
            ><span>星体</span>
          </div>
          <div>
            <strong>{{ categories.length }}</strong
            ><span>星系</span>
          </div>
          <div>
            <strong>{{ activePlanets }}</strong
            ><span>活跃信号</span>
          </div>
          <div>
            <strong>{{ totalClicks }}</strong
            ><span>跃迁</span>
          </div>
          <div>
            <strong>{{ mostVisited?.name || "等待观测" }}</strong
            ><span>常访轨道</span>
          </div>
        </div>
      </header>

      <section class="star-controls">
        <div class="star-search">
          <Search class="h-4 w-4" />
          <input
            v-model="keyword"
            type="search"
            placeholder="搜索星球名称、描述或星系"
          />
        </div>
        <div class="star-category-tabs" role="group" aria-label="星系筛选">
          <button
            type="button"
            :class="{ active: selectedCategory === 'all' }"
            @click="selectedCategory = 'all'"
          >
            全部星系
          </button>
          <button
            v-for="category in categories"
            :key="category.key"
            type="button"
            :class="{ active: selectedCategory === category.key }"
            :style="{ '--tone': category.tone }"
            @click="selectedCategory = category.key"
          >
            {{ category.label }} · {{ category.count }}
          </button>
        </div>
        <div class="star-view-toggle" role="group" aria-label="视图切换">
          <button
            type="button"
            :class="{ active: viewMode === 'star' }"
            @click="viewMode = 'star'"
          >
            星图
          </button>
          <button
            type="button"
            :class="{ active: viewMode === 'list' }"
            @click="viewMode = 'list'"
          >
            列表
          </button>
        </div>
        <div class="star-command-group">
          <button
            class="random-jump radar-scan-button"
            :class="{ scanning: isRadarScanning }"
            type="button"
            :disabled="isRadarScanning || visibleFriendLinks.length === 0"
            @click="scanRandomPlanet"
          >
            <Radar class="h-4 w-4" />{{
              isRadarScanning ? "扫描中" : "雷达扫描"
            }}
          </button>
        </div>
      </section>

      <section class="star-observatory">
        <div v-if="loading" class="star-empty">
          <Loading /><span>正在观测星图...</span>
        </div>
        <div v-else-if="visibleFriendLinks.length === 0" class="star-empty">
          星图还在等待第一颗星
        </div>

        <div
          v-else-if="viewMode === 'star'"
          class="star-map"
          @click.self="selectedLink = null"
        >
          <div class="twinkle-field" aria-hidden="true"></div>
          <div class="orbit orbit-a"></div>
          <div class="orbit orbit-b"></div>
          <div class="orbit orbit-c"></div>
          <svg
            class="constellation-lines"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <line
              v-for="line in constellationLines"
              :key="line.id"
              :x1="line.x1"
              :y1="line.y1"
              :x2="line.x2"
              :y2="line.y2"
              :stroke="line.tone"
              :stroke-opacity="line.strength"
            />
          </svg>
          <div class="home-star" aria-hidden="true">
            <Telescope class="h-5 w-5" />
            <span>Giovan</span>
          </div>
          <button
            v-for="node in starNodes"
            :key="node.link._id"
            class="star-node"
            type="button"
            :class="[
              `star-node--${node.status.key}`,
              { active: selectedLink?._id === node.link._id },
            ]"
            :aria-label="`${node.link.name}，${node.status.label}`"
            :style="{
              left: node.x + '%',
              top: node.y + '%',
              width: node.radius * 2 + 'px',
              height: node.radius * 2 + 'px',
              '--tone': node.meta.tone,
              '--glow': node.meta.glow,
              animationDelay: node.delay,
            }"
            @click="selectLink(node.link)"
          >
            <img
              v-if="getFriendLinkAvatar(node.link.avatar)"
              :src="getFriendLinkAvatar(node.link.avatar)"
              :alt="node.link.name"
              @error="node.link.avatar = ''"
            />
            <span v-else>{{ node.link.name.charAt(0).toUpperCase() }}</span>
            <i class="star-node-signal" aria-hidden="true"></i>
          </button>
        </div>

        <div v-else class="star-list-grid">
          <article
            v-for="link in visibleFriendLinks"
            :key="link._id"
            class="star-list-card"
            @click="selectLink(link)"
          >
            <div
              class="star-list-avatar"
              :style="{ '--tone': getCategory(link.category).tone }"
            >
              <img
                v-if="getFriendLinkAvatar(link.avatar)"
                :src="getFriendLinkAvatar(link.avatar)"
                :alt="link.name"
                @error="link.avatar = ''"
              />
              <span v-else>{{ link.name.charAt(0).toUpperCase() }}</span>
            </div>
            <div class="min-w-0 flex-1">
              <h3>{{ link.name }}</h3>
              <p>{{ link.description }}</p>
              <div class="star-list-meta">
                <span>{{ getCategoryLabel(link.category) }}</span>
                <span><Eye class="h-3.5 w-3.5" />{{ link.clicks || 0 }}</span>
                <span
                  ><Activity class="h-3.5 w-3.5" />{{
                    getPlanetStatus(link).label
                  }}</span
                >
              </div>
              <div v-if="getPlanetTags(link).length" class="star-list-tags">
                <span v-for="tag in getPlanetTags(link)" :key="tag">{{
                  tag
                }}</span>
              </div>
            </div>
            <ExternalLink class="h-4 w-4 opacity-50" />
          </article>
        </div>

        <aside v-if="selectedLink" class="star-detail-card">
          <button
            class="star-detail-close"
            type="button"
            aria-label="关闭详情"
            @click="selectedLink = null"
          >
            ×
          </button>
          <div
            class="star-detail-avatar"
            :style="{ '--tone': getCategory(selectedLink.category).tone }"
          >
            <img
              v-if="getFriendLinkAvatar(selectedLink.avatar)"
              :src="getFriendLinkAvatar(selectedLink.avatar)"
              :alt="selectedLink.name"
              @error="selectedLink.avatar = ''"
            />
            <span v-else>{{ selectedLink.name.charAt(0).toUpperCase() }}</span>
          </div>
          <span class="star-kicker"
            ><Radio class="h-4 w-4" />{{
              getCategoryLabel(selectedLink.category)
            }}</span
          >
          <h2>{{ selectedLink.name }}</h2>
          <p>{{ selectedLink.description }}</p>
          <div v-if="getPlanetTags(selectedLink).length" class="planet-tags">
            <span v-for="tag in getPlanetTags(selectedLink)" :key="tag"
              >#{{ tag }}</span
            >
          </div>
          <div class="star-detail-meta">
            <span
              ><Eye class="h-4 w-4" />{{
                selectedLink.clicks || 0
              }}
              次跃迁</span
            >
            <span
              ><Zap class="h-4 w-4" />{{ getSignalLevel(selectedLink) }}</span
            >
            <span v-if="selectedPlanetStatus"
              ><Activity class="h-4 w-4" />{{
                selectedPlanetStatus.label
              }}</span
            >
            <span
              ><CalendarClock class="h-4 w-4" />{{
                formatSignalTime(selectedLink.lastClickedAt)
              }}</span
            >
          </div>
          <div v-if="selectedPlanetStatus" class="planet-status-copy">
            {{ selectedPlanetStatus.description }}
          </div>
          <div
            v-if="selectedLink.latestPost"
            class="latest-post latest-post--active"
          >
            <span>最新信号</span>
            <a
              :href="getLatestPostHref(selectedLink)"
              target="_blank"
              rel="noopener noreferrer"
              @click.stop
            >
              {{ selectedLink.latestPost.title }}
            </a>
            <small>{{ getLatestPostTime(selectedLink) }}</small>
          </div>
          <div v-else class="latest-post">
            最新信号：{{
              selectedLink.rss
                ? "RSS 坐标已接入，等待后续抓取最新文章"
                : "暂未接入 RSS 信号"
            }}
          </div>
          <div class="star-detail-actions">
            <button type="button" @click="handleLinkClick(selectedLink)">
              <Rocket class="h-4 w-4" />访问站点
            </button>
            <button type="button" @click="copyLink(selectedLink)">
              <Copy class="h-4 w-4" />复制链接
            </button>
          </div>
        </aside>
      </section>

      <section
        class="launch-console"
        :ref="(el) => (formCardRef = el as HTMLElement)"
        @mousemove="handleFormCardMouseMove"
        @mouseleave="handleFormCardMouseLeave"
      >
        <div
          v-if="formCardEffect.show"
          class="console-glow"
          :style="{
            left: formCardEffect.x - 90 + 'px',
            top: formCardEffect.y - 90 + 'px',
          }"
        ></div>
        <div class="launch-copy">
          <span class="star-kicker"
            ><Send class="h-4 w-4" /> TRANSMIT COORDINATES</span
          >
          <h2>发送你的星际坐标</h2>
          <p>
            提交站点名称、坐标和星球简介，审核通过后会被接入这张互联网星图。
          </p>
        </div>
        <form class="launch-form" @submit.prevent="handleSubmit">
          <label
            ><span>星球名称 <em>*</em></span
            ><input
              v-model="form.name"
              type="text"
              required
              placeholder="你的站点名称"
          /></label>
          <label
            ><span>星球坐标 <em>*</em></span
            ><input
              v-model="form.url"
              type="text"
              inputmode="url"
              required
              placeholder="example.com 或 https://example.com"
          /></label>
          <label class="md:col-span-2"
            ><span>星球简介 <em>*</em></span
            ><textarea
              v-model="form.description"
              required
              rows="3"
              placeholder="简短介绍你的站点"
            ></textarea>
          </label>
          <label
            ><span>星球徽记</span
            ><input
              v-model="form.avatar"
              type="text"
              inputmode="url"
              placeholder="https://example.com/avatar.png"
          /></label>
          <label
            ><span>联系邮箱 <em>*</em></span
            ><input
              v-model="form.email"
              type="email"
              required
              placeholder="your@email.com"
          /></label>
          <label
            ><span>RSS 信号</span
            ><input
              v-model="form.rss"
              type="text"
              inputmode="url"
              placeholder="https://example.com/rss.xml"
          /></label>
          <label
            ><span>所在星系</span>
            <select v-model="form.category">
              <option value="tech">技术星系</option>
              <option value="design">设计星系</option>
              <option value="life">生活星系</option>
              <option value="tools">工具星系</option>
              <option value="other">边缘星云</option>
            </select>
          </label>
          <div class="launch-actions md:col-span-2">
            <AppButton variant="reset" nativeType="button" @click="resetForm"
              >重置</AppButton
            >
            <AppButton
              variant="primary"
              nativeType="submit"
              :loading="submitting"
              :disabled="submitting"
            >
              {{ submitting ? "发射中..." : "发射申请" }}
            </AppButton>
          </div>
        </form>
      </section>
    </div>
  </div>
</template>

<style scoped>
.friend-star-page {
  --star-page-text: var(--theme-text-primary);
  --star-page-muted: var(--theme-text-muted);
  --star-panel: color-mix(in srgb, var(--theme-surface) 82%, transparent);
  --star-panel-strong: color-mix(
    in srgb,
    var(--theme-surface-strong) 88%,
    transparent
  );
  --star-panel-soft: color-mix(
    in srgb,
    var(--theme-surface-soft) 72%,
    transparent
  );
  --star-border: var(--theme-border);
  --star-border-strong: var(--theme-border-strong);
  --star-field: color-mix(in srgb, var(--theme-bg-elevated) 62%, transparent);
  --star-grid-line: color-mix(in srgb, var(--theme-accent) 15%, transparent);
  --star-primary-button-text: var(--theme-bg-elevated);
  position: relative;
  overflow: hidden;
  color: var(--star-page-text);
  background:
    radial-gradient(
      circle at 20% 10%,
      color-mix(in srgb, var(--theme-accent) 18%, transparent),
      transparent 28%
    ),
    radial-gradient(
      circle at 80% 18%,
      color-mix(in srgb, var(--theme-accent-strong) 12%, transparent),
      transparent 30%
    ),
    var(--theme-page-gradient);
}

:global(.dark) .friend-star-page {
  --star-panel: color-mix(in srgb, var(--theme-surface) 72%, transparent);
  --star-panel-strong: color-mix(
    in srgb,
    var(--theme-surface-strong) 82%,
    transparent
  );
  --star-panel-soft: color-mix(
    in srgb,
    var(--theme-surface-soft) 62%,
    transparent
  );
  --star-field: color-mix(in srgb, #020617 38%, transparent);
  --star-grid-line: color-mix(in srgb, var(--theme-accent) 12%, transparent);
  --star-primary-button-text: #08111f;
}

:global(.dark) .orbit {
  border-color: color-mix(in srgb, var(--theme-accent) 24%, transparent);
}

.friend-star-page::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    repeating-linear-gradient(
      90deg,
      var(--star-grid-line) 0 1px,
      transparent 1px 88px
    ),
    repeating-linear-gradient(
      0deg,
      var(--star-grid-line) 0 1px,
      transparent 1px 88px
    );
  mask-image: radial-gradient(circle at center, black, transparent 78%);
}

.star-nebula {
  position: absolute;
  width: 520px;
  height: 520px;
  border-radius: 999px;
  filter: blur(48px);
  opacity: 0.22;
}

.star-nebula-a {
  left: -180px;
  top: 14%;
  background: var(--theme-accent);
}
.star-nebula-b {
  right: -180px;
  bottom: 10%;
  background: var(--theme-accent-strong);
}

.star-hero {
  max-width: 860px;
  margin: 0 auto 28px;
  text-align: center;
}

.star-kicker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--theme-accent-strong);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
}

.star-hero h1 {
  margin: 16px 0 12px;
  color: var(--star-page-text);
  font-family: inherit;
  font-size: 2.25rem;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: 0;
}

.star-hero p {
  margin: 0;
  color: var(--star-page-muted);
  font-size: 1rem;
}

@media (min-width: 640px) {
  .star-hero h1 {
    font-size: 3rem;
  }
}

.star-stats {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  margin-top: 24px;
}

.star-stats div,
.star-controls,
.star-observatory,
.launch-console,
.star-detail-card,
.star-list-card {
  border: 1px solid var(--star-border);
  background: var(--star-panel);
  box-shadow: var(--theme-shadow-md);
  backdrop-filter: blur(22px);
}

.star-stats div {
  padding: 14px;
  border-radius: 22px;
}

.star-stats strong,
.star-stats span {
  display: block;
}

.star-stats strong {
  overflow: hidden;
  color: var(--star-page-text);
  font-size: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.star-stats span {
  margin-top: 4px;
  color: var(--star-page-muted);
  font-size: 12px;
}

.star-controls {
  display: grid;
  grid-template-columns: minmax(260px, 360px) minmax(0, 1fr) max-content max-content;
  gap: 10px 12px;
  align-items: center;
  margin-bottom: 18px;
  padding: 14px 16px;
  border-radius: 28px;
}

.star-search {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 14px;
  border: 1px solid var(--star-border);
  border-radius: 999px;
  color: var(--star-page-muted);
  background: var(--star-field);
  min-width: 0;
}

.star-search input {
  width: 100%;
  color: var(--star-page-text);
  background: transparent;
  outline: none;
}

.star-search input::placeholder {
  color: color-mix(in srgb, var(--star-page-muted) 70%, transparent);
}

.star-category-tabs,
.star-view-toggle {
  display: flex;
  gap: 6px;
  min-width: 0;
  overflow-x: auto;
}

.star-category-tabs {
  padding: 2px;
}

.star-category-tabs::-webkit-scrollbar,
.star-view-toggle::-webkit-scrollbar {
  display: none;
}

.star-category-tabs button,
.star-view-toggle button,
.random-jump,
.star-detail-actions button {
  min-height: 38px;
  padding: 0 13px;
  border: 1px solid var(--star-border);
  border-radius: 999px;
  color: var(--star-page-muted);
  background: var(--star-panel-soft);
  white-space: nowrap;
  transition: all 180ms ease;
}

.star-category-tabs button:hover,
.star-view-toggle button:hover,
.star-detail-actions button:hover {
  border-color: color-mix(in srgb, var(--theme-accent) 38%, var(--star-border));
  color: var(--star-page-text);
}

.star-category-tabs button.active,
.star-view-toggle button.active {
  color: var(--star-primary-button-text);
  background: var(--tone, var(--theme-accent));
  border-color: transparent;
}

.random-jump,
.star-detail-actions button:first-child {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--star-primary-button-text);
  background: linear-gradient(
    135deg,
    var(--theme-accent-strong),
    var(--theme-accent)
  );
  border-color: color-mix(in srgb, var(--theme-accent) 38%, transparent);
  font-weight: 800;
}

.star-command-group {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  white-space: nowrap;
}

.radar-scan-button.scanning svg {
  animation: radarSpin 900ms linear infinite;
}

.radar-status {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  min-height: 42px;
  min-width: 0;
  padding: 0 14px;
  overflow: hidden;
  border: 1px solid var(--star-border);
  border-radius: 999px;
  color: var(--star-page-muted);
  background: var(--star-field);
  font-size: 13px;
}

.radar-status span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.radar-status.scanning {
  border-color: color-mix(in srgb, var(--theme-accent) 48%, var(--star-border));
  color: var(--star-page-text);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--theme-accent) 9%, transparent);
}

.star-observatory {
  position: relative;
  min-height: 620px;
  overflow: hidden;
  border-radius: 36px;
}

.star-empty {
  display: grid;
  place-items: center;
  min-height: 360px;
  color: var(--star-page-muted);
}

.star-map {
  position: relative;
  min-height: 620px;
  overflow: hidden;
  background:
    radial-gradient(
      circle at center,
      color-mix(in srgb, var(--theme-accent) 11%, transparent),
      transparent 18%
    ),
    radial-gradient(
      circle at 30% 70%,
      color-mix(in srgb, var(--theme-accent-strong) 10%, transparent),
      transparent 25%
    );
}

.twinkle-field,
.twinkle-field::before,
.twinkle-field::after {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-repeat: repeat;
  animation: twinkleStars 4.8s ease-in-out infinite;
}

.twinkle-field {
  opacity: 0.62;
  background-image:
    radial-gradient(
      circle,
      color-mix(in srgb, var(--theme-accent-strong) 58%, transparent) 0 1px,
      transparent 1.6px
    ),
    radial-gradient(
      circle,
      color-mix(in srgb, var(--theme-text-primary) 28%, transparent) 0 0.8px,
      transparent 1.4px
    );
  background-position:
    12px 18px,
    86px 54px;
  background-size:
    118px 92px,
    156px 128px;
}

.twinkle-field::before,
.twinkle-field::after {
  content: "";
}

.twinkle-field::before {
  opacity: 0.54;
  background-image:
    radial-gradient(
      circle,
      color-mix(in srgb, var(--theme-accent) 54%, transparent) 0 1px,
      transparent 1.7px
    ),
    radial-gradient(
      circle,
      color-mix(in srgb, var(--theme-text-muted) 34%, transparent) 0 0.9px,
      transparent 1.6px
    );
  background-position:
    44px 32px,
    126px 16px;
  background-size:
    172px 132px,
    210px 166px;
  animation-delay: -1.6s;
}

.twinkle-field::after {
  opacity: 0.42;
  background-image:
    radial-gradient(
      circle,
      color-mix(in srgb, var(--theme-accent-strong) 62%, transparent) 0 1.2px,
      transparent 2px
    ),
    radial-gradient(
      circle,
      color-mix(in srgb, var(--theme-text-primary) 24%, transparent) 0 0.8px,
      transparent 1.5px
    );
  background-position:
    18px 74px,
    150px 96px;
  background-size:
    236px 184px,
    188px 144px;
  animation-delay: -3.1s;
}

:global(.dark) .twinkle-field {
  opacity: 0.88;
}

:global(.dark) .twinkle-field::before {
  opacity: 0.68;
}

:global(.dark) .twinkle-field::after {
  opacity: 0.58;
}

.orbit {
  position: absolute;
  left: 50%;
  top: 50%;
  border: 1.5px dashed
    color-mix(in srgb, var(--theme-accent-strong) 42%, transparent);
  border-radius: 50%;
  transform: translate(-50%, -50%) rotate(-8deg);
}

.orbit-a {
  width: 34%;
  height: 24%;
}
.orbit-b {
  width: 58%;
  height: 42%;
}
.orbit-c {
  width: 82%;
  height: 58%;
}

.constellation-lines {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.constellation-lines line {
  stroke-width: 0.16;
  stroke-linecap: round;
  vector-effect: non-scaling-stroke;
}

.home-star {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 112px;
  min-height: 46px;
  padding: 0 14px;
  border: 1px solid color-mix(in srgb, var(--theme-accent) 44%, transparent);
  border-radius: 999px;
  color: var(--star-page-text);
  background:
    radial-gradient(
      circle at 28% 24%,
      rgba(255, 255, 255, 0.34),
      transparent 38%
    ),
    var(--star-panel-strong);
  box-shadow:
    0 0 38px color-mix(in srgb, var(--theme-accent) 28%, transparent),
    inset 0 1px 0 rgba(255, 255, 255, 0.16);
  font-size: 13px;
  font-weight: 800;
  transform: translate(-50%, -50%);
}

.star-node {
  position: absolute;
  display: grid;
  place-items: center;
  overflow: visible;
  z-index: 2;
  border: 2px solid
    color-mix(in srgb, var(--tone) 72%, var(--theme-bg-elevated) 10%);
  border-radius: 999px;
  color: #020617;
  background: var(--tone);
  box-shadow:
    0 0 18px var(--glow),
    0 0 42px var(--glow);
  transform: translate(-50%, -50%);
  animation: starFloat 4.8s ease-in-out infinite;
}

.star-node::before {
  position: absolute;
  inset: -34%;
  border: 1px solid color-mix(in srgb, var(--tone) 44%, transparent);
  border-radius: inherit;
  content: "";
  opacity: 0;
}

.star-node--new::before,
.star-node--signal::before {
  animation: planetPulse 2.8s ease-out infinite;
  opacity: 1;
}

.star-node--dormant {
  filter: saturate(0.55) brightness(0.78);
  opacity: 0.82;
}

.star-node-signal {
  position: absolute;
  right: 6%;
  bottom: 6%;
  width: 22%;
  height: 22%;
  border: 2px solid color-mix(in srgb, #fff 74%, var(--tone));
  border-radius: 999px;
  background: color-mix(in srgb, var(--tone) 72%, #fff 28%);
  box-shadow: 0 0 12px color-mix(in srgb, var(--tone) 64%, transparent);
}

.star-node.active,
.star-node:hover {
  z-index: 3;
  transform: translate(-50%, -50%) scale(1.16);
}

.star-node img,
.star-list-avatar img,
.star-detail-avatar img {
  width: 100%;
  height: 100%;
  border-radius: inherit;
  object-fit: cover;
}

.star-node span,
.star-list-avatar span,
.star-detail-avatar span {
  font-weight: 900;
}

.star-list-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  padding: 18px;
}

.star-list-card {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  padding: 16px;
  border-radius: 24px;
  cursor: pointer;
  transition:
    transform 180ms ease,
    border-color 180ms ease;
}

.star-list-card:hover {
  border-color: color-mix(in srgb, var(--theme-accent) 38%, var(--star-border));
  transform: translateY(-2px);
}

.star-list-avatar,
.star-detail-avatar {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  overflow: hidden;
  border-radius: 24px;
  color: #020617;
  background: var(--tone);
  box-shadow: 0 0 28px color-mix(in srgb, var(--tone) 36%, transparent);
}

.star-list-avatar {
  width: 58px;
  height: 58px;
}
.star-detail-avatar {
  width: 82px;
  height: 82px;
  margin-bottom: 16px;
}

.star-list-card h3 {
  margin: 0 0 5px;
  overflow: hidden;
  color: var(--star-page-text);
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.star-list-card p {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: var(--star-page-muted);
  font-size: 13px;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.star-list-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 9px;
  color: var(--star-page-muted);
  font-size: 12px;
}

.star-list-meta span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.star-list-tags,
.planet-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.star-list-tags span,
.planet-tags span {
  padding: 4px 8px;
  border: 1px solid var(--star-border);
  border-radius: 999px;
  color: var(--star-page-muted);
  background: var(--star-panel-soft);
  font-size: 11px;
  line-height: 1;
}

.star-detail-card {
  position: absolute;
  right: 22px;
  bottom: 22px;
  z-index: 5;
  width: min(340px, calc(100% - 44px));
  padding: 18px;
  border-radius: 26px;
  background: var(--star-panel-strong);
  animation: detailIn 260ms ease both;
}

.star-detail-close {
  position: absolute;
  right: 14px;
  top: 12px;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  color: var(--star-page-muted);
  background: var(--star-panel-soft);
}

.star-detail-card h2 {
  margin: 6px 0;
  color: var(--star-page-text);
  font-family: Georgia, "Times New Roman", serif;
  font-size: 30px;
  line-height: 1;
}

.star-detail-card p,
.latest-post {
  color: var(--star-page-muted);
  line-height: 1.55;
}

.star-detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin: 11px 0;
}

.star-detail-meta span,
.latest-post,
.planet-status-copy {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 9px;
  border: 1px solid var(--star-border);
  border-radius: 999px;
  background: var(--star-panel-soft);
  color: var(--star-page-muted);
  font-size: 12px;
}

.planet-status-copy,
.latest-post {
  width: 100%;
  justify-content: flex-start;
  border-radius: 16px;
  line-height: 1.5;
}

.latest-post {
  margin-top: 8px;
}

.latest-post--active {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
}

.latest-post--active span {
  color: var(--theme-accent-strong);
  font-weight: 800;
}

.latest-post--active a {
  min-width: 0;
  overflow: hidden;
  color: var(--star-page-text);
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.latest-post--active a:hover {
  color: var(--theme-accent-strong);
}

.latest-post--active small {
  color: var(--star-page-muted);
  font-size: 11px;
  white-space: nowrap;
}

.star-detail-actions {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}

.star-detail-actions button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 8px;
  min-height: 42px;
  padding: 0 14px;
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
}

.star-detail-actions button svg {
  width: 16px;
  height: 16px;
  flex: 0 0 auto;
  stroke-width: 2.2;
}

.launch-console {
  position: relative;
  display: grid;
  grid-template-columns: 0.86fr 1.14fr;
  gap: 26px;
  margin-top: 26px;
  overflow: hidden;
  padding: 24px;
  border-radius: 36px;
}

.console-glow {
  position: absolute;
  width: 180px;
  height: 180px;
  border-radius: 999px;
  background: radial-gradient(
    circle,
    color-mix(in srgb, var(--theme-accent) 28%, transparent),
    transparent 70%
  );
  filter: blur(12px);
  pointer-events: none;
}

.launch-copy {
  position: relative;
  z-index: 1;
  align-self: center;
}

.launch-copy h2 {
  margin: 12px 0;
  color: var(--star-page-text);
  font-family: Georgia, "Times New Roman", serif;
  font-size: clamp(32px, 5vw, 56px);
  line-height: 0.95;
  letter-spacing: 0;
}

.launch-copy p {
  color: var(--star-page-muted);
}

.launch-form {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.launch-form label {
  display: grid;
  gap: 7px;
  color: var(--star-page-muted);
  font-size: 13px;
  font-weight: 700;
}

.launch-form label > span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.launch-form label em {
  color: #ef4444;
  font-style: normal;
  font-weight: 900;
}

.launch-form input,
.launch-form textarea,
.launch-form select {
  width: 100%;
  border: 1px solid var(--star-border);
  border-radius: 16px;
  color: var(--star-page-text);
  background: var(--star-field);
  outline: none;
}

.launch-form input:focus,
.launch-form textarea:focus,
.launch-form select:focus {
  border-color: var(--theme-accent);
  box-shadow: 0 0 0 3px var(--theme-accent-soft);
}

.launch-form input,
.launch-form select {
  height: 44px;
  padding: 0 13px;
}

.launch-form textarea {
  padding: 12px 13px;
  resize: vertical;
}

.launch-form input::placeholder,
.launch-form textarea::placeholder {
  color: color-mix(in srgb, var(--star-page-muted) 70%, transparent);
}

.launch-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@keyframes starFloat {
  0%,
  100% {
    margin-top: 0;
  }
  50% {
    margin-top: -7px;
  }
}

@keyframes planetPulse {
  from {
    opacity: 0.72;
    transform: scale(0.74);
  }
  to {
    opacity: 0;
    transform: scale(1.38);
  }
}

@keyframes radarSpin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes twinkleStars {
  0%,
  100% {
    opacity: 0.42;
    filter: brightness(0.92);
  }
  45% {
    opacity: 0.88;
    filter: brightness(1.28);
  }
  70% {
    opacity: 0.58;
    filter: brightness(1.05);
  }
}

@keyframes detailIn {
  from {
    opacity: 0;
    transform: translateY(18px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (max-width: 1280px) {
  .star-controls {
    grid-template-columns: minmax(240px, 0.9fr) minmax(0, 1.1fr);
  }

  .star-view-toggle {
    justify-self: start;
  }

  .star-command-group {
    justify-self: end;
  }
}

@media (max-width: 1024px) {
  .launch-console {
    grid-template-columns: 1fr;
  }

  .star-list-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .star-stats,
  .star-controls,
  .star-list-grid,
  .launch-form {
    grid-template-columns: 1fr;
  }

  .star-command-group,
  .star-view-toggle {
    justify-self: stretch;
  }

  .star-command-group > button,
  .star-view-toggle > button {
    flex: 1;
  }

  .star-observatory,
  .star-map {
    min-height: 520px;
  }

  .star-detail-card {
    position: fixed;
    left: 12px;
    right: 12px;
    bottom: 12px;
    width: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .star-node,
  .star-detail-card,
  .twinkle-field,
  .twinkle-field::before,
  .twinkle-field::after {
    animation: none;
  }
}
</style>
