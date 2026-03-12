import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import Inspector from "unplugin-vue-dev-locator/vite";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import viteImagemin from "vite-plugin-imagemin";

const coreDeps = ["vue", "vue-router", "pinia"];
const elementDeps = ["element-plus"];
const iconDeps = ["lucide-vue-next", "@heroicons/vue"];
const headlessDeps = ["@headlessui/vue"];
const motionDeps = ["gsap"];

export default defineConfig(({ mode }) => {
  const envDir = path.resolve(__dirname, "..");
  const env = loadEnv(mode, envDir, "");
  const apiTarget = env.VITE_API_BASE_URL_LOCAL || env.VITE_API_BASE_URL || "http://localhost:8998";

  return {
    envDir,
    build: {
      target: "es2020",
      sourcemap: false,
      cssCodeSplit: true,
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
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
            if (!id.includes("node_modules")) {
              if (id.includes("/src/pages/admin/")) {
                return "admin";
              }
              return;
            }

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
          },
        },
      },
    },
    plugins: [
      vue(),
      Inspector(),
      AutoImport({
        imports: ["vue", "vue-router", "pinia"],
        resolvers: [ElementPlusResolver()],
        dts: path.resolve(__dirname, "src/auto-imports.d.ts"),
      }),
      Components({
        resolvers: [ElementPlusResolver()],
      }),
      viteImagemin({
        gifsicle: { optimizationLevel: 3 },
        optipng: { optimizationLevel: 5 },
        mozjpeg: { quality: 80 },
        svgo: {
          plugins: [
            { name: "removeViewBox", active: false },
            { name: "removeEmptyAttrs", active: false },
          ],
        },
        webp: { quality: 80 },
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    optimizeDeps: {
      include: [...coreDeps, ...elementDeps, ...headlessDeps, ...iconDeps, ...motionDeps],
    },
    server: {
      host: "0.0.0.0",
      port: 5173,
      open: true,
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
