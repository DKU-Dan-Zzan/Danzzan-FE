/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_KAKAO_MAP_JS_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}