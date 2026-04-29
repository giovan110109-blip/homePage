<script setup lang="ts">
import type { Component } from "vue";
import { Image as ImageIcon } from "lucide-vue-next";
import AboutSkillTree from "@/components/about/AboutSkillTree.vue";
import type { SiteInfo } from "@/types/common";

interface AboutExperience {
  id: number | string;
  position: string;
  company: string;
  period: string;
  description: string;
  images?: string[];
}

interface AboutInterest {
  name: string;
  icon: Component;
}

interface SkillLeaf {
  name: string;
  level: number;
}

interface SkillBranch {
  title: string;
  signal: string;
  skills: SkillLeaf[];
}

interface Props {
  info: SiteInfo;
  experiences: AboutExperience[];
  interests: AboutInterest[];
  skillTree: SkillBranch[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  preview: [images: string[], index: number];
}>();

const coverLines = ["FRONTEND", "VISUAL", "AI TOOLS", "LIFE LOG"];

const statCards = [
  { value: "01", label: "把想法落到界面里" },
  { value: "24H", label: "在细节里找节奏" },
  { value: "∞", label: "持续重构表达方式" },
];

const defaultLead = "写代码，做界面，记录生活。把零散想法变成可以被看见、被使用的东西。";

const coverLead = computed(() => {
  const bio = props.info.bio.trim();
  if (!bio) return defaultLead;

  return bio.length > 86 ? `${bio.slice(0, 86)}...` : bio;
});

const openPreview = (images: string[] | undefined, index: number) => {
  if (!images?.length) return;
  emit("preview", images, index);
};
</script>

<template>
  <section class="about-magazine" aria-labelledby="about-magazine-title">
    <header class="about-cover">
      <aside class="about-cover__rail" aria-label="关键词">
        <span v-for="line in coverLines" :key="line">{{ line }}</span>
      </aside>

      <div class="about-cover__headline">
        <p class="about-cover__eyebrow">Not a resume, a visual note.</p>
        <h1 id="about-magazine-title">关于我</h1>
        <p class="about-cover__lead">{{ coverLead }}</p>
      </div>

      <div class="about-cover__portrait-card">
        <img
          v-if="props.info.avatar"
          :src="props.info.avatar"
          :alt="props.info.name || '个人头像'"
          class="about-cover__portrait"
          decoding="async"
          fetchpriority="high"
        />
        <div v-else class="about-cover__portrait about-cover__portrait--empty">
          {{ (props.info.name || "ME").slice(0, 2) }}
        </div>
        <div class="about-cover__stamp">OPEN TO<br />CREATE</div>
      </div>
    </header>

    <div class="about-identity">
      <article class="about-identity__card about-identity__card--name">
        <span class="about-identity__label">NAME / TITLE</span>
        <h2>{{ props.info.name || "Giovan" }}</h2>
        <p>{{ props.info.title || "Frontend Builder" }}</p>
      </article>
      <article
        v-for="card in statCards"
        :key="card.value"
        class="about-identity__card about-identity__card--stat"
      >
        <strong>{{ card.value }}</strong>
        <span>{{ card.label }}</span>
      </article>
    </div>

    <main class="about-collage" aria-label="关于我的拼贴内容">
      <article class="collage-card collage-card--timeline">
        <div class="collage-card__header">
          <span>C / 03</span>
          <h2>站点历程</h2>
        </div>
        <div class="about-timeline">
          <section
            v-for="experience in props.experiences"
            :key="experience.id"
            class="about-timeline__item"
          >
            <div class="about-timeline__date">{{ experience.period }}</div>
            <div class="about-timeline__body">
              <div class="about-timeline__title-row">
                <h3>{{ experience.position }}</h3>
                <button
                  v-if="experience.images?.length"
                  class="about-timeline__image-button"
                  type="button"
                  :aria-label="`查看${experience.position}图片`"
                  @click="openPreview(experience.images, 0)"
                >
                  <ImageIcon class="about-timeline__image-icon" />
                </button>
              </div>
              <p class="about-timeline__company">{{ experience.company }}</p>
              <p>{{ experience.description }}</p>
              <div v-if="experience.images?.length" class="about-timeline__thumbs">
                <button
                  v-for="(image, imageIndex) in experience.images"
                  :key="image"
                  type="button"
                  class="about-timeline__thumb"
                  @click="openPreview(experience.images, imageIndex)"
                >
                  <img
                    :src="image"
                    :alt="`${experience.position}截图 ${imageIndex + 1}`"
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              </div>
            </div>
          </section>
        </div>
      </article>

      <article class="collage-card collage-card--interests">
        <div class="collage-card__header">
          <span>D / 04</span>
          <h2>兴趣爱好</h2>
        </div>
        <div class="interest-ticket-grid">
          <div
            v-for="(interest, index) in props.interests"
            :key="interest.name"
            class="interest-ticket"
            :style="{ '--ticket-rotate': `${index % 2 === 0 ? -2 : 2}deg` }"
          >
            <component :is="interest.icon" class="interest-ticket__icon" />
            <span>{{ interest.name }}</span>
          </div>
        </div>
      </article>

      <AboutSkillTree :branches="props.skillTree" />
    </main>
  </section>
</template>

<style scoped>
.about-magazine {
  --about-ink: var(--theme-text-primary);
  --about-muted: var(--theme-text-secondary);
  --about-card: var(--theme-surface);
  --about-card-strong: var(--theme-surface-strong);
  --about-card-soft: var(--theme-surface-soft);
  --about-border: var(--theme-border);
  --about-border-strong: var(--theme-border-strong);
  --about-accent: var(--theme-accent);
  --about-accent-strong: var(--theme-accent-strong);
  --about-accent-soft: var(--theme-accent-soft);
  min-height: 100vh;
  padding: clamp(52px, 7vw, 108px) clamp(16px, 4vw, 56px) 96px;
  color: var(--about-ink);
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--about-border) 42%, transparent) 1px, transparent 1px) 0 0 / 48px 48px,
    linear-gradient(180deg, color-mix(in srgb, var(--about-border) 36%, transparent) 1px, transparent 1px) 0 0 / 48px 48px,
    radial-gradient(circle, color-mix(in srgb, var(--about-accent) 14%, transparent) 1px, transparent 1px) 0 0 / 14px 14px,
    var(--theme-page-gradient);
}

.about-cover {
  display: grid;
  grid-template-columns: 78px minmax(0, 1fr) minmax(260px, 380px);
  gap: clamp(24px, 5vw, 72px);
  align-items: center;
  max-width: 1500px;
  margin: 0 auto clamp(36px, 6vw, 70px);
}

.about-cover__rail {
  display: flex;
  min-height: 430px;
  align-items: center;
  justify-content: center;
  border-left: 3px solid var(--about-border-strong);
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  gap: 34px;
  color: var(--about-accent);
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.24em;
}

.about-cover__headline {
  position: relative;
}

.about-cover__headline::before {
  content: "";
  position: absolute;
  top: -32px;
  left: -38px;
  width: 170px;
  height: 170px;
  border: 4px solid var(--about-accent-soft);
  transform: rotate(-12deg);
}

.about-cover__eyebrow {
  position: relative;
  z-index: 1;
  width: fit-content;
  margin: 0 0 20px;
  padding: 10px 18px;
  background: var(--about-accent);
  color: var(--theme-bg);
  font-size: clamp(0.72rem, 1vw, 0.96rem);
  font-weight: 900;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  transform: rotate(-1deg);
}

.about-cover__headline h1 {
  position: relative;
  z-index: 1;
  margin: 0;
  font-family: Georgia, "Songti SC", "STSong", serif;
  font-size: clamp(5.6rem, 16vw, 13rem);
  font-weight: 900;
  line-height: 0.86;
  letter-spacing: -0.13em;
  text-shadow: 10px 10px 0 var(--about-accent-soft);
}

.about-cover__lead {
  position: relative;
  z-index: 1;
  max-width: 680px;
  margin: 26px 0 0;
  color: var(--about-muted);
  font-size: clamp(1.05rem, 1.8vw, 1.35rem);
  line-height: 1.9;
}

.about-cover__portrait-card {
  position: relative;
  width: min(100%, 360px);
  margin: 0 auto;
  padding: 14px 14px 82px;
  border: 1px solid var(--about-border);
  background: var(--about-card-soft);
  box-shadow:
    18px 24px 0 color-mix(in srgb, var(--about-accent) 8%, transparent),
    0 24px 80px color-mix(in srgb, var(--about-ink) 12%, transparent);
  transform: rotate(2.5deg);
}

.about-cover__portrait-card::before {
  content: "";
  position: absolute;
  right: -30px;
  bottom: 38px;
  width: 180px;
  height: 180px;
  border-radius: 999px;
  background: var(--about-accent-soft);
  z-index: -1;
}

.about-cover__portrait {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 5;
  border: 1px solid var(--about-border-strong);
  object-fit: cover;
  filter: saturate(0.86) contrast(1.04);
}

.about-cover__portrait--empty {
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, var(--about-accent), var(--about-accent-soft));
  color: var(--theme-bg);
  font-size: 4rem;
  font-weight: 900;
}

.about-cover__stamp {
  position: absolute;
  right: -22px;
  bottom: 26px;
  display: grid;
  place-items: center;
  width: 116px;
  height: 116px;
  border: 4px solid var(--about-accent);
  border-radius: 999px;
  color: var(--about-accent);
  font-size: 0.76rem;
  font-weight: 900;
  line-height: 1.15;
  letter-spacing: 0.16em;
  text-align: center;
  transform: rotate(-8deg);
}

.about-identity {
  display: grid;
  grid-template-columns: minmax(260px, 1.4fr) repeat(3, minmax(130px, 1fr));
  gap: 22px;
  max-width: 1500px;
  margin: 0 auto clamp(44px, 6vw, 72px);
}

.about-identity__card,
.collage-card {
  border: 1px solid var(--about-border-strong);
  background: var(--about-card);
  box-shadow: 12px 16px 0 color-mix(in srgb, var(--about-accent) 7%, transparent);
  backdrop-filter: blur(10px);
}

.about-identity__card {
  min-height: 150px;
  padding: 28px;
}

.about-identity__label,
.collage-card__header span {
  color: var(--about-accent);
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.about-identity__label {
  display: block;
  margin-bottom: 18px;
}

.about-identity__card h2 {
  margin: 0 0 6px;
  font-family: Georgia, "Songti SC", serif;
  font-size: clamp(2.6rem, 5vw, 4.8rem);
  line-height: 1;
}

.about-identity__card p,
.about-identity__card span {
  margin: 0;
  color: var(--about-muted);
}

.about-identity__card--stat strong {
  display: block;
  margin-bottom: 20px;
  color: var(--about-accent-strong);
  font-family: Georgia, "Times New Roman", serif;
  font-size: clamp(3rem, 6vw, 5.4rem);
  line-height: 0.9;
}

.about-collage {
  display: grid;
  grid-template-columns: minmax(0, 860px);
  justify-content: center;
  max-width: 1500px;
  margin: 0 auto;
}

.collage-card {
  position: relative;
  padding: clamp(26px, 4vw, 46px);
  content-visibility: auto;
  contain-intrinsic-size: 460px;
  transition:
    transform 220ms ease,
    border-color 220ms ease,
    box-shadow 220ms ease;
}

.collage-card:hover {
  border-color: color-mix(in srgb, var(--about-accent) 46%, var(--about-border));
  box-shadow: 16px 20px 0 color-mix(in srgb, var(--about-accent) 12%, transparent);
  transform: translateY(-4px);
}

.collage-card h2,
.collage-card h3 {
  margin: 0;
  color: var(--about-ink);
  font-family: Georgia, "Songti SC", serif;
  line-height: 1.08;
}

.collage-card p {
  margin: 14px 0 0;
  color: var(--about-muted);
  line-height: 1.8;
}

.collage-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 34px;
}

.collage-card__header h2 {
  font-size: clamp(1.8rem, 3vw, 3.2rem);
  text-align: right;
}

.collage-card--timeline {
  width: 100%;
  contain-intrinsic-size: 620px;
}

.about-timeline {
  position: relative;
  display: grid;
  gap: 22px;
}

.about-timeline::before {
  content: "";
  position: absolute;
  top: 10px;
  bottom: 10px;
  left: 92px;
  width: 2px;
  background: repeating-linear-gradient(
    to bottom,
    var(--about-accent) 0 8px,
    transparent 8px 16px
  );
  opacity: 0.48;
}

.about-timeline__item {
  position: relative;
  display: grid;
  grid-template-columns: 100px minmax(0, 1fr);
  gap: 24px;
}

.about-timeline__date {
  color: var(--about-accent);
  font-family: Georgia, "Times New Roman", serif;
  font-size: 1.2rem;
  font-weight: 900;
}

.about-timeline__body {
  position: relative;
  padding: 18px;
  border: 1px solid var(--about-border);
  background: var(--about-card-soft);
}

.about-timeline__body::before {
  content: "";
  position: absolute;
  top: 18px;
  left: -33px;
  width: 15px;
  height: 15px;
  border: 3px solid var(--about-card-strong);
  border-radius: 999px;
  background: var(--about-accent);
  box-shadow: 0 0 0 2px var(--about-accent);
}

.about-timeline__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.about-timeline__title-row h3 {
  font-size: clamp(1.3rem, 2.2vw, 2rem);
}

.about-timeline__company {
  color: var(--about-ink) !important;
  font-weight: 800;
}

.about-timeline__image-button {
  display: inline-grid;
  flex: 0 0 auto;
  place-items: center;
  width: 38px;
  height: 38px;
  border: 1px solid var(--about-border);
  border-radius: 999px;
  background: var(--about-accent-soft);
  color: var(--about-accent-strong);
  cursor: pointer;
  transition: transform 180ms ease;
}

.about-timeline__image-button:hover {
  transform: rotate(-8deg) scale(1.06);
}

.about-timeline__image-icon {
  width: 18px;
  height: 18px;
}

.about-timeline__thumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.about-timeline__thumb {
  width: 88px;
  height: 88px;
  padding: 5px;
  border: 1px solid var(--about-border);
  background: var(--about-card);
  cursor: pointer;
  transform: rotate(-2deg);
  transition: transform 180ms ease;
}

.about-timeline__thumb:hover {
  transform: rotate(2deg) scale(1.04);
}

.about-timeline__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.collage-card--interests {
  width: 100%;
  margin-top: clamp(24px, 4vw, 42px);
  contain-intrinsic-size: 260px;
  background:
    linear-gradient(145deg, var(--about-accent-soft), transparent 48%),
    var(--about-card);
}

.interest-ticket-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 18px;
}

.interest-ticket {
  --ticket-rotate: 0deg;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  min-width: 132px;
  justify-content: center;
  padding: 16px 20px;
  border: 2px dashed var(--about-border-strong);
  background: var(--about-card-soft);
  color: var(--about-ink);
  font-weight: 900;
  transform: rotate(var(--ticket-rotate));
}

.interest-ticket__icon {
  width: 20px;
  height: 20px;
  color: var(--about-accent);
}

@media (max-width: 1100px) {
  .about-cover,
  .about-identity {
    grid-template-columns: 1fr;
  }

  .about-cover__rail {
    min-height: auto;
    flex-direction: row;
    justify-content: flex-start;
    border-left: 0;
    border-bottom: 2px solid var(--about-border-strong);
    padding-bottom: 14px;
    writing-mode: initial;
    transform: none;
  }

  .about-cover__portrait-card {
    width: min(82vw, 360px);
  }
}

@media (max-width: 760px) {
  .about-identity__card,
  .collage-card {
    backdrop-filter: none;
  }
}

@media (max-width: 680px) {
  .about-magazine {
    padding: 42px 12px 72px;
  }

  .about-cover__headline h1 {
    font-size: clamp(4.8rem, 28vw, 7rem);
  }

  .about-identity__card,
  .collage-card {
    box-shadow: 7px 9px 0 color-mix(in srgb, var(--about-accent) 8%, transparent);
  }

  .collage-card__header {
    display: grid;
  }

  .collage-card__header h2 {
    text-align: left;
  }

  .about-timeline::before {
    left: 10px;
  }

  .about-timeline__item {
    grid-template-columns: 1fr;
    gap: 8px;
    padding-left: 34px;
  }

  .about-timeline__body::before {
    left: -31px;
  }
}
</style>
