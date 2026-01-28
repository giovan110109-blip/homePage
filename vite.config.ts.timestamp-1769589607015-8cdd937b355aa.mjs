// vite.config.ts
import { defineConfig, loadEnv, splitVendorChunkPlugin } from "file:///Volumes/%E8%B5%B0%E8%AF%BB%E7%94%9F/homePage/node_modules/.pnpm/vite@5.4.21_@types+node@22.19.7_sass@1.97.3_terser@5.46.0/node_modules/vite/dist/node/index.js";
import vue from "file:///Volumes/%E8%B5%B0%E8%AF%BB%E7%94%9F/homePage/node_modules/.pnpm/@vitejs+plugin-vue@5.2.4_vite@5.4.21_@types+node@22.19.7_sass@1.97.3_terser@5.46.0__vue@3.5.27_typescript@5.3.3_/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import path from "path";
import Inspector from "file:///Volumes/%E8%B5%B0%E8%AF%BB%E7%94%9F/homePage/node_modules/.pnpm/unplugin-vue-dev-locator@1.0.3_vite@5.4.21_@types+node@22.19.7_sass@1.97.3_terser@5.46.0_/node_modules/unplugin-vue-dev-locator/dist/vite.mjs";
import AutoImport from "file:///Volumes/%E8%B5%B0%E8%AF%BB%E7%94%9F/homePage/node_modules/.pnpm/unplugin-auto-import@21.0.0_@nuxt+kit@4.3.0_@vueuse+core@10.11.1_vue@3.5.27_typescript@5.3.3__/node_modules/unplugin-auto-import/dist/vite.mjs";
import Components from "file:///Volumes/%E8%B5%B0%E8%AF%BB%E7%94%9F/homePage/node_modules/.pnpm/unplugin-vue-components@31.0.0_@nuxt+kit@4.3.0_vue@3.5.27_typescript@5.3.3_/node_modules/unplugin-vue-components/dist/vite.mjs";
import { ElementPlusResolver } from "file:///Volumes/%E8%B5%B0%E8%AF%BB%E7%94%9F/homePage/node_modules/.pnpm/unplugin-vue-components@31.0.0_@nuxt+kit@4.3.0_vue@3.5.27_typescript@5.3.3_/node_modules/unplugin-vue-components/dist/resolvers.mjs";
var __vite_injected_original_dirname = "/Volumes/\u8D70\u8BFB\u751F/homePage";
var coreDeps = ["vue", "vue-router", "pinia"];
var elementDeps = ["element-plus"];
var iconDeps = ["lucide-vue-next", "@heroicons/vue"];
var headlessDeps = ["@headlessui/vue"];
var motionDeps = ["gsap"];
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_API_BASE_URL || "http://localhost:3000";
  return {
    build: {
      target: "es2020",
      sourcemap: false,
      cssCodeSplit: true,
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      },
      rollupOptions: {
        output: {
          entryFileNames: "js/[name]-[hash].js",
          chunkFileNames: "js/[name]-[hash].js",
          assetFileNames: ({ name }) => {
            if (!name) return "assets/[name]-[hash][extname]";
            if (/\.(png|jpe?g|gif|svg|webp|avif)$/.test(name)) {
              return "img/[name]-[hash][extname]";
            }
            if (/\.(css)$/.test(name)) {
              return "css/[name]-[hash][extname]";
            }
            if (/\.(woff2?|ttf|eot|otf)$/.test(name)) {
              return "fonts/[name]-[hash][extname]";
            }
            return "assets/[name]-[hash][extname]";
          },
          manualChunks(id) {
            if (!id.includes("node_modules")) return;
            if (coreDeps.some((dep) => id.includes(`/node_modules/${dep}/`))) {
              return "vendor-core";
            }
            if (elementDeps.some((dep) => id.includes(`/node_modules/${dep}/`))) {
              return "vendor-element";
            }
            if (headlessDeps.some((dep) => id.includes(`/node_modules/${dep}/`))) {
              return "vendor-headless";
            }
            if (iconDeps.some((dep) => id.includes(`/node_modules/${dep}/`))) {
              return "vendor-icons";
            }
            if (motionDeps.some((dep) => id.includes(`/node_modules/${dep}/`))) {
              return "vendor-motion";
            }
            return "vendor";
          }
        }
      }
    },
    plugins: [
      vue(),
      Inspector(),
      splitVendorChunkPlugin(),
      AutoImport({
        imports: [
          "vue",
          // 自动导入vue的ref、reactive、computed等
          "vue-router",
          // 可选：自动导入vue-router的useRoute、useRouter等
          "pinia"
          // 可选：自动导入pinia的useStore等
        ],
        resolvers: [ElementPlusResolver()],
        dts: path.resolve(__vite_injected_original_dirname, "src/auto-imports.d.ts")
      }),
      Components({
        resolvers: [ElementPlusResolver()]
      })
    ],
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src")
        // ✅ 定义 @ = src
      }
    },
    optimizeDeps: {
      include: [
        ...coreDeps,
        ...elementDeps,
        ...headlessDeps,
        ...iconDeps,
        ...motionDeps
      ]
    },
    server: {
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true
        }
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVm9sdW1lcy9cdThENzBcdThCRkJcdTc1MUYvaG9tZVBhZ2VcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Wb2x1bWVzL1x1OEQ3MFx1OEJGQlx1NzUxRi9ob21lUGFnZS92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVm9sdW1lcy8lRTglQjUlQjAlRTglQUYlQkIlRTclOTQlOUYvaG9tZVBhZ2Uvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYsIHNwbGl0VmVuZG9yQ2h1bmtQbHVnaW4gfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHZ1ZSBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tdnVlXCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IEluc3BlY3RvciBmcm9tIFwidW5wbHVnaW4tdnVlLWRldi1sb2NhdG9yL3ZpdGVcIjtcbmltcG9ydCBBdXRvSW1wb3J0IGZyb20gXCJ1bnBsdWdpbi1hdXRvLWltcG9ydC92aXRlXCI7XG5pbXBvcnQgQ29tcG9uZW50cyBmcm9tIFwidW5wbHVnaW4tdnVlLWNvbXBvbmVudHMvdml0ZVwiO1xuaW1wb3J0IHsgRWxlbWVudFBsdXNSZXNvbHZlciB9IGZyb20gXCJ1bnBsdWdpbi12dWUtY29tcG9uZW50cy9yZXNvbHZlcnNcIjtcblxuY29uc3QgY29yZURlcHMgPSBbXCJ2dWVcIiwgXCJ2dWUtcm91dGVyXCIsIFwicGluaWFcIl07XG5jb25zdCBlbGVtZW50RGVwcyA9IFtcImVsZW1lbnQtcGx1c1wiXTtcbmNvbnN0IGljb25EZXBzID0gW1wibHVjaWRlLXZ1ZS1uZXh0XCIsIFwiQGhlcm9pY29ucy92dWVcIl07XG5jb25zdCBoZWFkbGVzc0RlcHMgPSBbXCJAaGVhZGxlc3N1aS92dWVcIl07XG5jb25zdCBtb3Rpb25EZXBzID0gW1wiZ3NhcFwiXTtcblxuLy8gaHR0cHM6Ly92aXRlLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiB7XG4gIGNvbnN0IGVudiA9IGxvYWRFbnYobW9kZSwgcHJvY2Vzcy5jd2QoKSwgXCJcIik7XG4gIGNvbnN0IGFwaVRhcmdldCA9IGVudi5WSVRFX0FQSV9CQVNFX1VSTCB8fCBcImh0dHA6Ly9sb2NhbGhvc3Q6MzAwMFwiO1xuXG4gIHJldHVybiB7XG4gICAgYnVpbGQ6IHtcbiAgICAgIHRhcmdldDogXCJlczIwMjBcIixcbiAgICAgIHNvdXJjZW1hcDogZmFsc2UsXG4gICAgICBjc3NDb2RlU3BsaXQ6IHRydWUsXG4gICAgICBtaW5pZnk6IFwidGVyc2VyXCIsXG4gICAgICB0ZXJzZXJPcHRpb25zOiB7XG4gICAgICAgIGNvbXByZXNzOiB7XG4gICAgICAgICAgZHJvcF9jb25zb2xlOiB0cnVlLFxuICAgICAgICAgIGRyb3BfZGVidWdnZXI6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgICBvdXRwdXQ6IHtcbiAgICAgICAgICBlbnRyeUZpbGVOYW1lczogXCJqcy9bbmFtZV0tW2hhc2hdLmpzXCIsXG4gICAgICAgICAgY2h1bmtGaWxlTmFtZXM6IFwianMvW25hbWVdLVtoYXNoXS5qc1wiLFxuICAgICAgICAgIGFzc2V0RmlsZU5hbWVzOiAoeyBuYW1lIH0pID0+IHtcbiAgICAgICAgICAgIGlmICghbmFtZSkgcmV0dXJuIFwiYXNzZXRzL1tuYW1lXS1baGFzaF1bZXh0bmFtZV1cIjtcbiAgICAgICAgICAgIGlmICgvXFwuKHBuZ3xqcGU/Z3xnaWZ8c3ZnfHdlYnB8YXZpZikkLy50ZXN0KG5hbWUpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBcImltZy9bbmFtZV0tW2hhc2hdW2V4dG5hbWVdXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoL1xcLihjc3MpJC8udGVzdChuYW1lKSkge1xuICAgICAgICAgICAgICByZXR1cm4gXCJjc3MvW25hbWVdLVtoYXNoXVtleHRuYW1lXVwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKC9cXC4od29mZjI/fHR0Znxlb3R8b3RmKSQvLnRlc3QobmFtZSkpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFwiZm9udHMvW25hbWVdLVtoYXNoXVtleHRuYW1lXVwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIFwiYXNzZXRzL1tuYW1lXS1baGFzaF1bZXh0bmFtZV1cIjtcbiAgICAgICAgICB9LFxuICAgICAgICAgIG1hbnVhbENodW5rcyhpZCkge1xuICAgICAgICAgICAgaWYgKCFpZC5pbmNsdWRlcyhcIm5vZGVfbW9kdWxlc1wiKSkgcmV0dXJuO1xuXG4gICAgICAgICAgICBpZiAoY29yZURlcHMuc29tZSgoZGVwKSA9PiBpZC5pbmNsdWRlcyhgL25vZGVfbW9kdWxlcy8ke2RlcH0vYCkpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBcInZlbmRvci1jb3JlXCI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChlbGVtZW50RGVwcy5zb21lKChkZXApID0+IGlkLmluY2x1ZGVzKGAvbm9kZV9tb2R1bGVzLyR7ZGVwfS9gKSkpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFwidmVuZG9yLWVsZW1lbnRcIjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGhlYWRsZXNzRGVwcy5zb21lKChkZXApID0+IGlkLmluY2x1ZGVzKGAvbm9kZV9tb2R1bGVzLyR7ZGVwfS9gKSkpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFwidmVuZG9yLWhlYWRsZXNzXCI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChpY29uRGVwcy5zb21lKChkZXApID0+IGlkLmluY2x1ZGVzKGAvbm9kZV9tb2R1bGVzLyR7ZGVwfS9gKSkpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFwidmVuZG9yLWljb25zXCI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChtb3Rpb25EZXBzLnNvbWUoKGRlcCkgPT4gaWQuaW5jbHVkZXMoYC9ub2RlX21vZHVsZXMvJHtkZXB9L2ApKSkge1xuICAgICAgICAgICAgICByZXR1cm4gXCJ2ZW5kb3ItbW90aW9uXCI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBcInZlbmRvclwiO1xuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gICAgcGx1Z2luczogW1xuICAgICAgdnVlKCksXG4gICAgICBJbnNwZWN0b3IoKSxcbiAgICAgIHNwbGl0VmVuZG9yQ2h1bmtQbHVnaW4oKSxcbiAgICAgIEF1dG9JbXBvcnQoe1xuICAgICAgICBpbXBvcnRzOiBbXG4gICAgICAgICAgXCJ2dWVcIiwgLy8gXHU4MUVBXHU1MkE4XHU1QkZDXHU1MTY1dnVlXHU3Njg0cmVmXHUzMDAxcmVhY3RpdmVcdTMwMDFjb21wdXRlZFx1N0I0OVxuICAgICAgICAgIFwidnVlLXJvdXRlclwiLCAvLyBcdTUzRUZcdTkwMDlcdUZGMUFcdTgxRUFcdTUyQThcdTVCRkNcdTUxNjV2dWUtcm91dGVyXHU3Njg0dXNlUm91dGVcdTMwMDF1c2VSb3V0ZXJcdTdCNDlcbiAgICAgICAgICBcInBpbmlhXCIsIC8vIFx1NTNFRlx1OTAwOVx1RkYxQVx1ODFFQVx1NTJBOFx1NUJGQ1x1NTE2NXBpbmlhXHU3Njg0dXNlU3RvcmVcdTdCNDlcbiAgICAgICAgXSxcbiAgICAgICAgcmVzb2x2ZXJzOiBbRWxlbWVudFBsdXNSZXNvbHZlcigpXSxcbiAgICAgICAgZHRzOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcInNyYy9hdXRvLWltcG9ydHMuZC50c1wiKSxcbiAgICAgIH0pLFxuICAgICAgQ29tcG9uZW50cyh7XG4gICAgICAgIHJlc29sdmVyczogW0VsZW1lbnRQbHVzUmVzb2x2ZXIoKV0sXG4gICAgICB9KSxcbiAgICBdLFxuICAgIHJlc29sdmU6IHtcbiAgICAgIGFsaWFzOiB7XG4gICAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLCAvLyBcdTI3MDUgXHU1QjlBXHU0RTQ5IEAgPSBzcmNcbiAgICAgIH0sXG4gICAgfSxcbiAgICBvcHRpbWl6ZURlcHM6IHtcbiAgICAgIGluY2x1ZGU6IFtcbiAgICAgICAgLi4uY29yZURlcHMsXG4gICAgICAgIC4uLmVsZW1lbnREZXBzLFxuICAgICAgICAuLi5oZWFkbGVzc0RlcHMsXG4gICAgICAgIC4uLmljb25EZXBzLFxuICAgICAgICAuLi5tb3Rpb25EZXBzLFxuICAgICAgXSxcbiAgICB9LFxuICAgIHNlcnZlcjoge1xuICAgICAgcHJveHk6IHtcbiAgICAgICAgXCIvYXBpXCI6IHtcbiAgICAgICAgICB0YXJnZXQ6IGFwaVRhcmdldCxcbiAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gIH07XG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBeVEsU0FBUyxjQUFjLFNBQVMsOEJBQThCO0FBQ3ZVLE9BQU8sU0FBUztBQUNoQixPQUFPLFVBQVU7QUFDakIsT0FBTyxlQUFlO0FBQ3RCLE9BQU8sZ0JBQWdCO0FBQ3ZCLE9BQU8sZ0JBQWdCO0FBQ3ZCLFNBQVMsMkJBQTJCO0FBTnBDLElBQU0sbUNBQW1DO0FBUXpDLElBQU0sV0FBVyxDQUFDLE9BQU8sY0FBYyxPQUFPO0FBQzlDLElBQU0sY0FBYyxDQUFDLGNBQWM7QUFDbkMsSUFBTSxXQUFXLENBQUMsbUJBQW1CLGdCQUFnQjtBQUNyRCxJQUFNLGVBQWUsQ0FBQyxpQkFBaUI7QUFDdkMsSUFBTSxhQUFhLENBQUMsTUFBTTtBQUcxQixJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUss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
