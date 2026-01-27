import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import Inspector from "unplugin-vue-dev-locator/vite";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

// https://vite.dev/config/
export default defineConfig({
  build: {
    sourcemap: "hidden",
  },
  plugins: [
    vue(),
    Inspector(),
    AutoImport({
      imports: [
        "vue", // 自动导入vue的ref、reactive、computed等
        "vue-router", // 可选：自动导入vue-router的useRoute、useRouter等
        "pinia", // 可选：自动导入pinia的useStore等
      ],
      resolvers: [ElementPlusResolver()],
      dts: path.resolve(__dirname, "src/auto-imports.d.ts"),
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // ✅ 定义 @ = src
    },
  },
  server: {
    historyApiFallback: {
      index: "/index.html",
    },
  },
});
