// 카카오맵 JavaScript SDK를 한 번만 로드하고 준비 상태를 반환하는 훅

import { useEffect, useState } from "react"
import type { KakaoGlobal } from "@/types/kakao-map"

declare global {
  interface Window {
    kakao: KakaoGlobal
  }
}

const KAKAO_SCRIPT_ID = "kakao-map-sdk"

export default function useKakaoMapLoader() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    const kakaoKey = import.meta.env.VITE_KAKAO_MAP_JS_KEY

    if (!kakaoKey) {
      console.error("VITE_KAKAO_MAP_JS_KEY가 설정되지 않았습니다.")
      setIsError(true)
      return
    }

    // 이미 로드된 경우
    if (window.kakao && window.kakao.maps) {
      window.kakao.maps.load(() => {
        setIsLoaded(true)
      })
      return
    }

    const existingScript = document.getElementById(KAKAO_SCRIPT_ID) as HTMLScriptElement | null

    if (existingScript) {
      existingScript.addEventListener("load", handleLoad)
      existingScript.addEventListener("error", handleError)

      return () => {
        existingScript.removeEventListener("load", handleLoad)
        existingScript.removeEventListener("error", handleError)
      }
    }

    const script = document.createElement("script")
    script.id = KAKAO_SCRIPT_ID
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&autoload=false`
    script.async = true

    script.addEventListener("load", handleLoad)
    script.addEventListener("error", handleError)

    document.head.appendChild(script)

    return () => {
      script.removeEventListener("load", handleLoad)
      script.removeEventListener("error", handleError)
    }

    function handleLoad() {
      if (!window.kakao || !window.kakao.maps) {
        setIsError(true)
        return
      }

      window.kakao.maps.load(() => {
        setIsLoaded(true)
      })
    }

    function handleError() {
      console.error("카카오맵 SDK 로드에 실패했습니다.")
      setIsError(true)
    }
  }, [])

  return { isLoaded, isError }
}
