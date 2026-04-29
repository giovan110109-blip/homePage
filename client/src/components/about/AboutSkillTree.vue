<script setup lang="ts">
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
  branches: SkillBranch[];
}

const props = defineProps<Props>();

const nodeStrength = (level: number) => Math.max(0.72, Math.min(level / 100, 1));
</script>

<template>
  <article class="skill-tree-card" aria-labelledby="skill-tree-title">
    <div class="skill-tree-card__scan" aria-hidden="true"></div>
    <div class="skill-tree-card__header">
      <span>E / 05</span>
      <h2 id="skill-tree-title">技能星图</h2>
    </div>

    <div class="skill-galaxy">
      <div class="skill-galaxy__orbit skill-galaxy__orbit--outer" aria-hidden="true"></div>
      <div class="skill-galaxy__orbit skill-galaxy__orbit--middle" aria-hidden="true"></div>
      <div class="skill-galaxy__orbit skill-galaxy__orbit--inner" aria-hidden="true"></div>

      <div class="skill-core" aria-label="技能核心">
        <span>CORE</span>
        <strong>BUILD</strong>
        <small>ONLINE</small>
      </div>

      <section
        v-for="(branch, branchIndex) in props.branches"
        :key="branch.title"
        class="skill-constellation"
        :class="`skill-constellation--${branchIndex + 1}`"
      >
        <div class="skill-constellation__signal">
          <span>{{ branch.signal }}</span>
        </div>
        <h3>{{ branch.title }}</h3>
        <div class="skill-constellation__chips">
          <span
            v-for="(skill, skillIndex) in branch.skills"
            :key="skill.name"
            class="skill-chip"
            :style="{
              '--skill-strength': nodeStrength(skill.level),
              '--chip-index': skillIndex,
            }"
          >
            <i aria-hidden="true"></i>
            {{ skill.name }}
          </span>
        </div>
      </section>

      <div class="skill-satellite skill-satellite--a" aria-hidden="true"></div>
      <div class="skill-satellite skill-satellite--b" aria-hidden="true"></div>
      <div class="skill-satellite skill-satellite--c" aria-hidden="true"></div>
      <div class="skill-satellite skill-satellite--d" aria-hidden="true"></div>
    </div>
  </article>
</template>

<style scoped>
.skill-tree-card {
  --skill-ink: var(--theme-text-primary);
  --skill-muted: var(--theme-text-secondary);
  --skill-card: var(--theme-surface);
  --skill-soft: var(--theme-surface-soft);
  --skill-border: var(--theme-border-strong);
  --skill-accent: var(--theme-accent);
  --skill-accent-strong: var(--theme-accent-strong);
  --skill-accent-soft: var(--theme-accent-soft);
  position: relative;
  width: 100%;
  margin-top: clamp(24px, 4vw, 42px);
  padding: clamp(24px, 4vw, 46px);
  overflow: hidden;
  border: 1px solid var(--skill-border);
  background:
    radial-gradient(circle at 50% 48%, color-mix(in srgb, var(--skill-accent) 24%, transparent), transparent 35%),
    radial-gradient(circle at 15% 18%, color-mix(in srgb, var(--skill-accent) 10%, transparent), transparent 24%),
    linear-gradient(135deg, color-mix(in srgb, var(--skill-accent) 12%, transparent), transparent 46%),
    var(--skill-card);
  box-shadow:
    12px 16px 0 color-mix(in srgb, var(--skill-accent) 7%, transparent),
    inset 0 0 80px color-mix(in srgb, var(--skill-accent) 8%, transparent);
  backdrop-filter: blur(18px);
}

.skill-tree-card::before,
.skill-tree-card::after {
  content: "";
  position: absolute;
  pointer-events: none;
}

.skill-tree-card::before {
  inset: 18px;
  border: 1px dashed color-mix(in srgb, var(--skill-accent) 32%, transparent);
}

.skill-tree-card::after {
  inset: 0;
  background:
    radial-gradient(circle, color-mix(in srgb, var(--skill-accent) 30%, transparent) 1px, transparent 1px) 0 0 / 22px 22px,
    linear-gradient(90deg, color-mix(in srgb, var(--skill-border) 30%, transparent) 1px, transparent 1px) 0 0 / 44px 44px,
    linear-gradient(180deg, color-mix(in srgb, var(--skill-border) 24%, transparent) 1px, transparent 1px) 0 0 / 44px 44px;
  opacity: 0.42;
  mask-image: radial-gradient(circle at 50% 48%, black, transparent 72%);
}

.skill-tree-card__scan {
  position: absolute;
  inset: -40% 0;
  pointer-events: none;
  background: linear-gradient(
    180deg,
    transparent 0%,
    color-mix(in srgb, var(--skill-accent) 16%, transparent) 48%,
    transparent 56%
  );
  opacity: 0.5;
  animation: scanSweep 7s linear infinite;
}

.skill-tree-card__header {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 14px;
}

.skill-tree-card__header span {
  color: var(--skill-accent);
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.skill-tree-card__header h2 {
  margin: 0;
  color: var(--skill-ink);
  font-family: Georgia, "Songti SC", serif;
  font-size: clamp(2.2rem, 4.6vw, 5rem);
  line-height: 1;
  text-shadow: 6px 6px 0 var(--skill-accent-soft);
}

.skill-galaxy {
  position: relative;
  z-index: 2;
  min-height: clamp(620px, 72vw, 760px);
}

.skill-galaxy__orbit {
  position: absolute;
  top: 50%;
  left: 50%;
  border: 1px solid color-mix(in srgb, var(--skill-accent) 32%, transparent);
  border-radius: 999px;
  pointer-events: none;
  transform: translate(-50%, -50%);
}

.skill-galaxy__orbit--outer {
  width: min(94%, 720px);
  aspect-ratio: 1;
  border-style: dashed;
  animation: orbitSpin 28s linear infinite;
}

.skill-galaxy__orbit--middle {
  width: min(70%, 520px);
  aspect-ratio: 1;
  animation: orbitSpin 22s linear infinite reverse;
}

.skill-galaxy__orbit--inner {
  width: min(42%, 310px);
  aspect-ratio: 1;
  border-style: dashed;
  animation: orbitSpin 18s linear infinite;
}

.skill-core {
  position: absolute;
  top: 50%;
  left: 50%;
  display: grid;
  place-items: center;
  width: clamp(148px, 22vw, 210px);
  aspect-ratio: 1;
  background:
    radial-gradient(circle, var(--skill-accent-soft), transparent 62%),
    var(--skill-soft);
  clip-path: polygon(25% 4%, 75% 4%, 100% 50%, 75% 96%, 25% 96%, 0 50%);
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--skill-accent) 70%, transparent),
    0 0 0 18px color-mix(in srgb, var(--skill-accent) 8%, transparent),
    0 0 60px color-mix(in srgb, var(--skill-accent) 22%, transparent),
    inset 0 0 38px color-mix(in srgb, var(--skill-accent) 20%, transparent);
  transform: translate(-50%, -50%);
}

.skill-core::before,
.skill-core::after {
  content: "";
  position: absolute;
  inset: -18px;
  border: 1px solid color-mix(in srgb, var(--skill-accent) 48%, transparent);
  border-radius: 999px;
  animation: corePulse 3.2s ease-in-out infinite;
}

.skill-core::after {
  inset: -34px;
  border-style: dashed;
  animation: orbitSpin 14s linear infinite;
}

.skill-core span,
.skill-core small {
  color: var(--skill-accent);
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.22em;
}

.skill-core strong {
  color: var(--skill-ink);
  font-family: Georgia, "Times New Roman", serif;
  font-size: clamp(1.8rem, 4vw, 3.1rem);
  line-height: 0.9;
}

.skill-constellation {
  position: absolute;
  display: grid;
  gap: 14px;
  width: min(38%, 300px);
  padding: 18px;
  border: 1px solid var(--skill-border);
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--skill-accent) 10%, transparent), transparent),
    color-mix(in srgb, var(--skill-soft) 88%, transparent);
  box-shadow:
    10px 14px 0 color-mix(in srgb, var(--skill-accent) 7%, transparent),
    0 0 36px color-mix(in srgb, var(--skill-accent) 8%, transparent);
  transition:
    transform 220ms ease,
    border-color 220ms ease,
    box-shadow 220ms ease;
}

.skill-constellation::before {
  content: "";
  position: absolute;
  inset: -1px;
  pointer-events: none;
  background: linear-gradient(120deg, transparent, color-mix(in srgb, var(--skill-accent) 18%, transparent), transparent);
  opacity: 0;
  transition: opacity 220ms ease;
}

.skill-constellation:hover {
  border-color: color-mix(in srgb, var(--skill-accent) 58%, var(--skill-border));
  box-shadow:
    14px 18px 0 color-mix(in srgb, var(--skill-accent) 12%, transparent),
    0 0 62px color-mix(in srgb, var(--skill-accent) 18%, transparent);
}

.skill-constellation:hover::before {
  opacity: 1;
}

.skill-constellation--1 {
  top: 56px;
  left: 2%;
  transform: rotate(-1.3deg);
}

.skill-constellation--1:hover {
  transform: translateY(-5px) rotate(0deg);
}

.skill-constellation--2 {
  top: 54px;
  right: 2%;
  transform: rotate(1.2deg);
}

.skill-constellation--2:hover {
  transform: translateY(-5px) rotate(0deg);
}

.skill-constellation--3 {
  bottom: 54px;
  left: 2%;
  transform: rotate(1deg);
}

.skill-constellation--3:hover {
  transform: translateY(-5px) rotate(0deg);
}

.skill-constellation--4 {
  right: 2%;
  bottom: 54px;
  transform: rotate(-1deg);
}

.skill-constellation--4:hover {
  transform: translateY(-5px) rotate(0deg);
}

.skill-constellation__signal {
  position: absolute;
  top: -17px;
  right: 18px;
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border: 1px solid color-mix(in srgb, var(--skill-accent) 56%, transparent);
  border-radius: 999px;
  background: var(--skill-card);
  box-shadow: 0 0 0 10px color-mix(in srgb, var(--skill-accent) 10%, transparent), 0 0 28px color-mix(in srgb, var(--skill-accent) 28%, transparent);
  animation: beaconBlink 2s ease-in-out infinite;
}

.skill-constellation__signal span {
  color: var(--skill-accent);
  font-size: 0.62rem;
  font-weight: 900;
  letter-spacing: 0.12em;
}

.skill-constellation h3 {
  margin: 0;
  color: var(--skill-ink);
  font-family: Georgia, "Songti SC", serif;
  font-size: clamp(1.35rem, 2.4vw, 2rem);
}

.skill-constellation__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.skill-chip {
  --skill-strength: 0.8;
  --chip-index: 0;
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 11px;
  border: 1px solid color-mix(in srgb, var(--skill-border) 72%, transparent);
  background: color-mix(in srgb, var(--skill-card) 86%, transparent);
  color: var(--skill-muted);
  font-size: 0.86rem;
  font-weight: 800;
  transform: translateY(calc((var(--chip-index) % 2) * 4px));
}

.skill-chip i {
  width: calc(7px + (var(--skill-strength) * 6px));
  height: calc(7px + (var(--skill-strength) * 6px));
  border-radius: 999px;
  background: var(--skill-accent);
  box-shadow: 0 0 calc(12px + (var(--skill-strength) * 20px)) color-mix(in srgb, var(--skill-accent) 76%, transparent);
  animation: nodePulse 2.4s ease-in-out infinite;
}

.skill-satellite {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: var(--skill-accent-strong);
  box-shadow: 0 0 20px var(--skill-accent);
}

.skill-satellite--a {
  animation: satelliteOuter 14s linear infinite;
}

.skill-satellite--b {
  animation: satelliteOuter 14s linear infinite -4s;
}

.skill-satellite--c {
  animation: satelliteInner 9s linear infinite -2s;
}

.skill-satellite--d {
  animation: satelliteInner 9s linear infinite -6s;
}

@keyframes scanSweep {
  from {
    transform: translateY(-30%);
  }
  to {
    transform: translateY(30%);
  }
}

@keyframes orbitSpin {
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

@keyframes corePulse {
  0%, 100% {
    opacity: 0.4;
    transform: scale(0.96);
  }
  50% {
    opacity: 1;
    transform: scale(1.04);
  }
}

@keyframes beaconBlink {
  0%, 100% {
    opacity: 0.72;
  }
  50% {
    opacity: 1;
  }
}

@keyframes nodePulse {
  0%, 100% {
    transform: scale(0.9);
  }
  50% {
    transform: scale(1.18);
  }
}

@keyframes satelliteOuter {
  from {
    transform: rotate(0deg) translateX(min(35vw, 330px)) rotate(0deg);
  }
  to {
    transform: rotate(360deg) translateX(min(35vw, 330px)) rotate(-360deg);
  }
}

@keyframes satelliteInner {
  from {
    transform: rotate(0deg) translateX(min(23vw, 210px)) rotate(0deg);
  }
  to {
    transform: rotate(-360deg) translateX(min(23vw, 210px)) rotate(360deg);
  }
}

@media (max-width: 760px) {
  .skill-tree-card__header {
    display: grid;
  }

  .skill-galaxy {
    display: grid;
    gap: 18px;
    min-height: auto;
  }

  .skill-galaxy__orbit,
  .skill-satellite {
    display: none;
  }

  .skill-core,
  .skill-constellation {
    position: relative;
    inset: auto;
    width: 100%;
    transform: none;
  }

  .skill-core {
    width: min(210px, 70vw);
    margin: 10px auto 22px;
  }

  .skill-constellation:hover,
  .skill-constellation--1:hover,
  .skill-constellation--2:hover,
  .skill-constellation--3:hover,
  .skill-constellation--4:hover {
    transform: translateY(-4px);
  }
}
</style>
