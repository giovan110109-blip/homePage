<template>
  <div ref="containerRef" class="video-player" :class="{ 'rounded-lg overflow-hidden': rounded }">
    <video
      ref="videoRef"
      :poster="poster"
      :autoplay="autoplay"
      :muted="muted"
      :loop="loop"
      :playsinline="true"
      crossorigin="anonymous"
    >
      <source v-if="src" :src="src" :type="videoType" />
    </video>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import Plyr from "plyr";
import "plyr/dist/plyr.css";

const props = withDefaults(
  defineProps<{
    src?: string;
    poster?: string;
    autoplay?: boolean;
    muted?: boolean;
    loop?: boolean;
    controls?: boolean;
    rounded?: boolean;
    aspectRatio?: string;
    volume?: number;
    playbackRate?: number;
  }>(),
  {
    src: "",
    poster: "",
    autoplay: false,
    muted: false,
    loop: false,
    controls: true,
    rounded: true,
    aspectRatio: "16:9",
    volume: 1,
    playbackRate: 1,
  }
);

const emit = defineEmits<{
  (e: "ready", player: Plyr): void;
  (e: "play"): void;
  (e: "pause"): void;
  (e: "ended"): void;
  (e: "timeupdate", time: number): void;
  (e: "error", error: Error): void;
}>();

const videoRef = ref<HTMLVideoElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);
const player = ref<Plyr | null>(null);

const videoType = computed(() => {
  if (!props.src) return "video/mp4";
  const ext = props.src.split(".").pop()?.toLowerCase();
  const types: Record<string, string> = {
    mp4: "video/mp4",
    webm: "video/webm",
    ogg: "video/ogg",
    mov: "video/quicktime",
    avi: "video/x-msvideo",
    mkv: "video/x-matroska",
    m3u8: "application/x-mpegURL",
    mpd: "application/dash+xml",
  };
  return types[ext || ""] || "video/mp4";
});

onMounted(() => {
  if (!videoRef.value) return;

  player.value = new Plyr(videoRef.value, {
    controls: props.controls
      ? [
          "play-large",
          "play",
          "progress",
          "current-time",
          "duration",
          "mute",
          "volume",
          "settings",
          "fullscreen",
        ]
      : [],
    ratio: props.aspectRatio,
    volume: props.volume,
    speed: {
      selected: props.playbackRate,
      options: [0.5, 0.75, 1, 1.25, 1.5, 2],
    },
    autoplay: props.autoplay,
    muted: props.muted,
    loop: {
      active: props.loop,
    },
    clickToPlay: true,
    hideControls: true,
    invertTime: true,
    toggleInvert: true,
    keyboard: {
      focused: true,
      global: true,
    },
    storage: {
      enabled: true,
      key: "plyr",
    },
  });

  player.value.on("ready", () => {
    emit("ready", player.value!);
  });

  player.value.on("play", () => {
    emit("play");
  });

  player.value.on("pause", () => {
    emit("pause");
  });

  player.value.on("ended", () => {
    emit("ended");
  });

  player.value.on("timeupdate", () => {
    emit("timeupdate", player.value?.currentTime || 0);
  });

  player.value.on("error", (event: any) => {
    emit("error", event);
  });
});

watch(
  () => props.src,
  (newSrc) => {
    if (player.value && newSrc) {
      player.value.source = {
        type: "video",
        sources: [
          {
            src: newSrc,
            type: videoType.value,
          },
        ],
      };
    }
  }
);

watch(
  () => props.volume,
  (newVolume) => {
    if (player.value) {
      player.value.volume = newVolume;
    }
  }
);

watch(
  () => props.playbackRate,
  (newRate) => {
    if (player.value) {
      player.value.speed = newRate;
    }
  }
);

onBeforeUnmount(() => {
  if (player.value) {
    player.value.destroy();
    player.value = null;
  }
});

defineExpose({
  player,
  play: () => player.value?.play(),
  pause: () => player.value?.pause(),
  stop: () => player.value?.stop(),
  restart: () => player.value?.restart(),
  seek: (time: number) => {
    if (player.value) {
      player.value.currentTime = time;
    }
  },
  setVolume: (volume: number) => {
    if (player.value) {
      player.value.volume = volume;
    }
  },
  setPlaybackRate: (rate: number) => {
    if (player.value) {
      player.value.speed = rate;
    }
  },
  toggleFullscreen: () => player.value?.fullscreen.toggle(),
});
</script>

<style scoped>
.video-player {
  width: 100%;
  background: #000;
}

.video-player :deep(.plyr) {
  width: 100%;
  height: 100%;
}

.video-player :deep(.plyr__video-wrapper) {
  background: #000;
}

.video-player :deep(.plyr__control--overlaid) {
  background: rgba(99, 102, 241, 0.9);
}

.video-player :deep(.plyr__control--overlaid:hover) {
  background: rgba(99, 102, 241, 1);
}

.video-player :deep(.plyr__control--overlaid:focus) {
  background: rgba(99, 102, 241, 1);
}

.video-player :deep(.plyr__progress__playback) {
  background: rgba(99, 102, 241, 0.9);
}

.video-player :deep(.plyr__progress input[type="range"]::-webkit-slider-thumb) {
  background: #6366f1;
}

.video-player :deep(.plyr__progress input[type="range"]::-moz-range-thumb) {
  background: #6366f1;
}

.video-player :deep(.plyr__volume input[type="range"]::-webkit-slider-thumb) {
  background: #6366f1;
}

.video-player :deep(.plyr__volume input[type="range"]::-moz-range-thumb) {
  background: #6366f1;
}

.video-player :deep(.plyr--full-ui.plyr--video input[type="range"]::-webkit-slider-thumb) {
  background: #6366f1;
}

.video-player :deep(.plyr--full-ui.plyr--video input[type="range"]::-moz-range-thumb) {
  background: #6366f1;
}

.video-player :deep(.plyr__controls) {
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
}

.video-player :deep(.plyr__control:hover) {
  background: rgba(99, 102, 241, 0.3);
}

.video-player :deep(.plyr__control:focus) {
  background: rgba(99, 102, 241, 0.3);
}

.video-player :deep(.plyr__control[aria-expanded="true"]) {
  background: rgba(99, 102, 241, 0.3);
}
</style>
