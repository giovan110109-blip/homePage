<script setup lang="ts">
import { ref, useAttrs } from 'vue'
import { omit } from 'lodash-es'

defineOptions({
  inheritAttrs: false //不继承父组件事件
})

const loading = ref(false)

const attrs = useAttrs()
type ClickHandler = (() => unknown) | undefined

async function handleClick() {
  const onClick = attrs.onClick as ClickHandler
  loading.value = true
  //调用父组件传递的点击事件
  //不能使用emit 他不管是同步还是异步
  try {
    await onClick?.()
  } finally {
    console.log('执行完成')
    loading.value = false
  }
}
</script>

<template>
  <el-button
    v-bind="omit(attrs, 'onclick')"
    :loading="loading"
    @click="handleClick"
    ><slot></slot
  ></el-button>
</template>

<style lang="sass" scoped></style>
