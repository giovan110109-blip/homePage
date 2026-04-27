<template>
  <div class="contents">
    <AppConfigProvider>
      <Layout />
    </AppConfigProvider>
  </div>
</template>

<script setup lang="ts">
import AppConfigProvider from "@/components/ui/AppConfigProvider";
import Layout from "@/components/layout/Layout.vue";
</script>
