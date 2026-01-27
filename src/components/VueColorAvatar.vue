<template>
  <div
    ref="avatarRef"
    class="vue-color-avatar"
    :style="{
      width: `${avatarSize}px`,
      height: `${avatarSize}px`,
      ...getWrapperShapeStyle(),
    }"
    :class="getWrapperShapeClassName()"
  >
    <Background :color="avatarOption.background.color" />

    <div class="avatar-payload" v-html="svgContent" />

    <Border
      :color="avatarOption.background.borderColor"
      :radius="getWrapperShapeStyle().borderRadius"
    />
  </div>
</template>

<script lang="ts">
export interface VueColorAvatarRef {
  avatarRef: HTMLDivElement
}
</script>

<script lang="ts" setup>
import { WrapperShape } from '@/enums/avatar.ts'
import type { AvatarOption } from '@/types'
import { SHAPE_STYLE_SET } from '@/utils/constant'

import Background from './widgets/Background.vue'
import Border from './widgets/Border.vue'
import { onMounted } from 'vue';

interface VueColorAvatarProps {
  option: AvatarOption
  size?: number
}

const props = withDefaults(defineProps<VueColorAvatarProps>(), {
  option: () => getRandomAvatarOption(),
  size: 280,
})

const { option: avatarOption, size: avatarSize } = toRefs(props)

const avatarRef = ref<VueColorAvatarRef['avatarRef']>()

defineExpose({ avatarRef })

function getWrapperShapeClassName() {
  return {
    [WrapperShape.Circle]:
      avatarOption.value.wrapperShape === WrapperShape.Circle,
    [WrapperShape.Square]:
      avatarOption.value.wrapperShape === WrapperShape.Square,
    [WrapperShape.Squircle]:
      avatarOption.value.wrapperShape === WrapperShape.Squircle,
  }
}

function getWrapperShapeStyle() {
  return SHAPE_STYLE_SET[avatarOption.value.wrapperShape ?? WrapperShape.Circle]
}

const svgContent = ref('')

watchEffect(async () => {

  
})

onMounted(async() => {
  console.log(11);
  
    svgContent.value = await buildAvatarSvg(avatarOption.value, avatarSize.value)
  console.log(svgContent.value,'s');
});
</script>

<style lang="scss" scoped>
.vue-color-avatar {
  position: relative;
  overflow: hidden;

  .avatar-payload {
    position: relative;
    z-index: 2;
    width: 100%;
    height: 100%;
  }
}
</style>
