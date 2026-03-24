// 역할: Vite 클라이언트 환경 타입 선언을 프로젝트 전역으로 확장한다.

/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_KAKAO_MAP_JS_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}