import { defineConfig, loadEnv } from "vite"
import path from "path"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { VitePWA } from "vite-plugin-pwa"

const resolveManualChunk = (id: string) => {
  if (!id.includes("node_modules")) {
    return undefined
  }

  if (
    id.includes("/@remix-run/router/") ||
    id.includes("/react-router/") ||
    id.includes("/react-router-dom/")
  ) {
    return "router"
  }

  if (
    id.includes("/react-dom/") ||
    id.includes("/react/") ||
    id.includes("/scheduler/")
  ) {
    return "react-vendor"
  }

  if (id.includes("/@tanstack/")) {
    return "react-query"
  }

  if (id.includes("/axios/")) {
    return "http"
  }

  if (id.includes("/tailwind-merge/")) {
    return "tailwind-merge"
  }

  return undefined
}

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
      allowedHosts: [".ngrok-free.app", ".ngrok-free.dev", ".ngrok.app", ".ngrok.io"],
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
          theme_color: "#e2e8f0",
          background_color: "#e2e8f0",
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
      chunkSizeWarningLimit: 1750,
      rollupOptions: {
        output: {
          manualChunks: resolveManualChunk,
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
      coverage: {
        provider: "v8",
        reporter: ["text", "json-summary", "lcov"],
        reportsDirectory: "coverage",
        include: ["src/**/*.{ts,tsx}"],
        exclude: [
          "src/main.tsx",
          "src/vite-env.d.ts",
          "**/*.d.ts",
          "**/*.test.ts",
          "**/*.test.tsx",
          "src/api/ticketing/generated/**",
          "src/components/common/ui/**",
          "src/mocks/**",
          "src/types/**",
        ],
        thresholds: {
          statements: 20,
          branches: 20,
          functions: 20,
          lines: 20,
        },
      },
    },
  }
})
