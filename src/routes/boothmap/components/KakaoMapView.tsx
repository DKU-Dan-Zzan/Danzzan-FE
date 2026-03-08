// 카카오맵 2D 지도를 렌더링하고 부스/단과대 마커를 표시하는 컴포넌트

import { useEffect, useRef } from "react"
import useKakaoMapLoader from "../../../hooks/useKakaoMapLoader"
import type {
  Booth,
  College,
  PrimaryFilter,
  SelectedItem,
} from "../types/boothmap.types"

declare global {
  interface Window {
    kakao: any
  }
}

type Props = {
  booths: Booth[]
  colleges: College[]
  primaryFilter: PrimaryFilter
  selectedItem: SelectedItem
  onClickBooth: (id: number) => void
  onClickCollege: (id: number) => void
}

const DEFAULT_CENTER = {
  lat: 37.3226,
  lng: 127.1265,
}

export default function KakaoMapView({
  booths,
  colleges,
  primaryFilter,
  selectedItem,
  onClickBooth,
  onClickCollege,
}: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const { isLoaded, isError } = useKakaoMapLoader()

  // 지도 최초 생성
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return

    const { kakao } = window

    const center = new kakao.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng)

    const map = new kakao.maps.Map(mapRef.current, {
      center,
      level: 4,
    })

    mapInstanceRef.current = map
  }, [isLoaded])

  // 마커 렌더링
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current) return

    const { kakao } = window
    const map = mapInstanceRef.current

    // 기존 마커 제거
    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current = []

    const bounds = new kakao.maps.LatLngBounds()
    let hasMarker = false

    const addBoothMarker = (booth: Booth) => {
      const position = new kakao.maps.LatLng(booth.location_y, booth.location_x)

      const isSelected =
        selectedItem?.kind === "booth" && selectedItem.id === booth.id

      const marker = new kakao.maps.Marker({
        map,
        position,
        title: booth.name,
        zIndex: isSelected ? 10 : 1,
      })

      kakao.maps.event.addListener(marker, "click", () => {
        onClickBooth(booth.id)
      })

      markersRef.current.push(marker)
      bounds.extend(position)
      hasMarker = true
    }

    const addCollegeMarker = (college: College) => {
      const position = new kakao.maps.LatLng(college.location_y, college.location_x)

      const isSelected =
        selectedItem?.kind === "college" && selectedItem.id === college.id

      const marker = new kakao.maps.Marker({
        map,
        position,
        title: `${college.name} 주점`,
        zIndex: isSelected ? 10 : 1,
      })

      kakao.maps.event.addListener(marker, "click", () => {
        onClickCollege(college.id)
      })

      markersRef.current.push(marker)
      bounds.extend(position)
      hasMarker = true
    }

    // 표시 규칙
    if (primaryFilter === "PUB") {
      colleges.forEach(addCollegeMarker)
    } else if (primaryFilter === "ALL") {
      booths.forEach(addBoothMarker)
    } else {
      booths.forEach(addBoothMarker)
    }

    if (hasMarker) {
      if (markersRef.current.length === 1) {
        map.setCenter(bounds.getSouthWest())
      } else {
        map.setBounds(bounds, 40, 40, 40, 40)
      }
    } else {
      map.setCenter(new kakao.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng))
      map.setLevel(4)
    }
  }, [isLoaded, booths, colleges, primaryFilter, selectedItem, onClickBooth, onClickCollege])

  if (isError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
        <div className="rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-500 shadow-sm">
          카카오맵을 불러오지 못했어요.
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-[#f8fafc]">
        <div className="rounded-2xl border border-white/70 bg-white/92 px-4 py-3 text-sm font-semibold text-gray-500 shadow-[0_8px_24px_rgba(0,0,0,0.08)] backdrop-blur-md">
          지도를 불러오는 중...
        </div>
      </div>
    )
  }

  return <div ref={mapRef} className="absolute inset-0" />
}