<template>
  <div
    class="min-h-screen bg-black"
    @mousemove="handleGlobalMouseMove"
    @mouseleave="handleGlobalMouseLeave"
  >
    <!-- Hero Banner Section -->
    <section
      class="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      <!-- DotGrid Background -->
      <div class="fixed inset-0 w-full h-full bg-black z-0">
        <DotGrid
          ref="dotGridRef"
          :dot-size="4"
          :gap="20"
          base-color="#6B7280"
          active-color="#9CA3AF"
          :proximity="120"
          :speed-trigger="60"
          :shock-radius="80"
          :shock-strength="0.8"
          :max-speed="2000"
          :resistance="800"
          :return-duration="1.5"
          class="w-full h-full"
        />
      </div>

      <!-- Main Content -->
      <div
        class="relative z-10 flex flex-col lg:flex-row items-center justify-between max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full"
      >
        <!-- Avatar (Mobile First) -->
        <div class="flex-shrink-0 mb-8 lg:mb-0 lg:order-2 lg:ml-12">
          <div class="relative">
            <div
              class="w-64 h-64 lg:w-80 lg:h-80 rounded-full overflow-hidden border-4 border-white/20 dark:border-white/10 shadow-2xl backdrop-blur-sm"
            >
              <img
                :src="personalStore.info.avatar"
                :alt="personalStore.fullName"
                class="w-full h-full object-cover"
              />
            </div>
            <!-- Glow effect around avatar -->
            <div
              class="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-blue-500/20 blur-xl -z-10"
            ></div>
          </div>
        </div>

        <!-- Profile Info -->
        <div class="flex-1 max-w-2xl text-center lg:text-left lg:order-1">
          <div class="animate-fade-in-up">
            <div class="mb-6">
              <SplitText
                :text="personalStore.info.title"
                class-name="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white"
                :delay="100"
                :duration="0.8"
                ease="power3.out"
                split-type="chars"
                :from="{ opacity: 0, y: 60, rotationX: -90 }"
                :to="{ opacity: 1, y: 0, rotationX: 0 }"
                :threshold="0.2"
                text-align="left"
              />
            </div>

            <SplitText
              :text="`我是 ${personalStore.fullName}`"
              class-name="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-4"
              :delay="120"
              :duration="0.6"
              ease="power2.out"
              split-type="chars"
              :from="{ opacity: 0, y: 30, scale: 0.8 }"
              :to="{ opacity: 1, y: 0, scale: 1 }"
              :threshold="0.1"
              text-align="left"
            />

            <SplitText
              :text="personalStore.info.bio"
              class-name="text-base sm:text-lg text-gray-700 dark:text-gray-300 mb-8 leading-relaxed"
              :delay="80"
              :duration="0.5"
              ease="power2.out"
              split-type="words"
              :from="{ opacity: 0, y: 20 }"
              :to="{ opacity: 1, y: 0 }"
              :threshold="0.1"
              text-align="left"
            />

            <!-- Social Links -->
            <!-- <div class="flex flex-wrap gap-3 justify-center lg:justify-start">
              <a
                v-for="link in personalStore.info.socialLinks"
                :key="link.platform"
                :href="link.url"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-white/20 dark:bg-white/10 backdrop-blur-md border border-gray-300/30 dark:border-white/20 rounded-lg hover:bg-white/30 dark:hover:bg-white/20 hover:border-gray-400/40 dark:hover:border-white/30 transition-all duration-300 shadow-lg"
              >
                <Github v-if="link.icon === 'github'" class="w-4 h-4 mr-2" />
                <ExternalLink v-else-if="link.icon === 'globe'" class="w-4 h-4 mr-2" />
                {{ link.platform }}
              </a>
            </div> -->
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import {
  Eye,
  Mail,
  Code,
  ArrowRight,
  ExternalLink,
  Github,
  Phone,
} from "lucide-vue-next";
import { usePersonalStore } from "@/stores/personal";
import Button from "@/components/ui/Button.vue";
import Card from "@/components/ui/Card.vue";
import TenYearPromise from "@/components/ui/TenYearPromise.vue";
import SplitText from "@/components/SplitText.vue";
import MagicCard from "@/components/ui/MagicCard.vue";
import DotGrid from "@/components/DotGrid.vue";

const dotGridRef = ref<InstanceType<typeof DotGrid>>();

const handleGlobalMouseMove = (event: MouseEvent) => {
  if (dotGridRef.value) {
    dotGridRef.value.handleMouseMove(event);
  }
};

const handleGlobalMouseLeave = () => {
  if (dotGridRef.value) {
    dotGridRef.value.handleMouseLeave();
  }
};

const personalStore = usePersonalStore();

const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: "smooth" });
  }
};
</script>

<style scoped>
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out;
}

.project-card {
  animation: fadeInUp 0.6s ease-out both;
}

.site-card {
  animation: fadeInUp 0.6s ease-out both;
}
</style>
