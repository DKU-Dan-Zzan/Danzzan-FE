// 역할: React 루트 렌더링과 QueryClient/RouterProvider 초기화를 수행하는 엔트리포인트다.

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { queryClient } from "@/lib/query"

// PWA 서비스워커 등록
import { registerSW } from "virtual:pwa-register"
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
)
