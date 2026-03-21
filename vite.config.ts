import { defineConfig, loadEnv } from "vite"
import path from "path"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { VitePWA } from "vite-plugin-pwa"

const resolveProxyTarget = (env: Record<string, string>) => {
  const explicitTarget = env.VITE_PROXY_TARGET?.trim()
  if (explicitTarget) {
    return explicitTarget
  }

  return env.VITE_BACKEND_TARGET === "compose"
    ? "http://127.0.0.1:8081"
    : "http://127.0.0.1:8080"
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const proxyTarget = resolveProxyTarget(env)

  return {
    server: {
      host: "0.0.0.0",
      port: 5173,
      allowedHosts: [".ngrok-free.app", ".ngrok.app", ".ngrok.io"],
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (requestPath: string) => requestPath.replace(/^\/api/, ""),
        },
      },
    },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.ico", "apple-touch-icon.png"],
        workbox: {
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        },
        manifest: {
          name: "DAN-ZZAN",
          short_name: "DAN-ZZAN",
          description: "DAN-ZZAN festival service",
          lang: "ko",
          theme_color: "#f1f6fd",
          background_color: "#f1f6fd",
          display: "standalone",
          start_url: "/",
          scope: "/",
          icons: [
            { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
            { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
            {
              src: "/pwa-512-maskable.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable"
            }
          ]
        }
      })
    ],
    build: {
      // mapbox-gl is intentionally isolated in a lazy-loaded chunk.
      // Keep warning enabled, but lift threshold to avoid noisy false positives.
      chunkSizeWarningLimit: 1800,
      rollupOptions: {
        output: {
          manualChunks: {
            mapbox: ["mapbox-gl"],
          },
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    test: {
      globals: true,
    },
  }
})
