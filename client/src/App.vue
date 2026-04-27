<template>
  <div class="contents">
    <AppConfigProvider>
      <Layout />
      <LoginModal />
    </AppConfigProvider>
  </div>
</template>

<script setup lang="ts">
import AppConfigProvider from "@/components/ui/AppConfigProvider";
import Layout from "@/components/layout/Layout.vue";
import LoginModal from "@/components/auth/LoginModal.vue";
</script>
