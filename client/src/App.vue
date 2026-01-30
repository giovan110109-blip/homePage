<template>
  <el-config-provider :locale="zhCn">
    <Layout />
  </el-config-provider>
</template>

<script setup lang="ts">
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import Layout from "@/components/layout/Layout.vue";
</script>
