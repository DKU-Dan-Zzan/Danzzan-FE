// 카카오맵 2D 지도를 렌더링하고, 커스텀 오버레이 핀 마커와 이름 말풍선을 표시하는 컴포넌트입니다.

import { useEffect, useRef } from "react"
import useKakaoMapLoader from "../../../hooks/useKakaoMapLoader"
import type {
  Booth,
  College,
  PrimaryFilter,
  SelectedItem,
  SheetSnap,
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
  sheetSnap: SheetSnap
  onClickBooth: (id: number) => void
  onClickCollege: (id: number) => void
}

const DEFAULT_CENTER = {
  lat: 37.3226,
  lng: 127.1265,
}

function getMarkerConfig(type: "PUB" | "FOOD_TRUCK" | "EXPERIENCE" | "FACILITY") {
  switch (type) {
    case "PUB":
      return {
        color: "#0a559c",
        iconPath: "/markers/booth-pub.svg",
      }
    case "FOOD_TRUCK":
      return {
        color: "#ef4444",
        iconPath: "/markers/booth-foodtruck.svg",
      }
    case "EXPERIENCE":
      return {
        color: "#10b981",
        iconPath: "/markers/booth-experience.svg",
      }
    case "FACILITY":
      return {
        color: "#3b82f6",
        iconPath: "/markers/facility-restroom.svg",
      }
    default:
      return {
        color: "#0a559c",
        iconPath: "/markers/booth-experience.svg",
      }
  }
}

// 물방울 핀 모양 SVG를 data url로 생성
function createPinDataUrl(color: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="60" viewBox="0 0 48 60" fill="none">
      <path d="M24 59C24 59 45 38.5 45 24C45 12.402 35.598 3 24 3C12.402 3 3 12.402 3 24C3 38.5 24 59 24 59Z" fill="${color}"/>
    </svg>
  `
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

export default function KakaoMapView({
  booths,
  colleges,
  primaryFilter,
  selectedItem,
  sheetSnap,
  onClickBooth,
  onClickCollege,
}: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<any>(null)
  const overlaysRef = useRef<any[]>([])
  const labelOverlayRef = useRef<any>(null)

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

    // 지도 빈 곳 클릭 시 말풍선 닫기
    kakao.maps.event.addListener(map, "click", () => {
      clearLabelOverlay()
    })

    mapInstanceRef.current = map
  }, [isLoaded])

  // 기존 일반 오버레이 제거
  const clearOverlays = () => {
    overlaysRef.current.forEach((overlay) => overlay.setMap(null))
    overlaysRef.current = []
  }

  // 기존 이름 말풍선 제거
  const clearLabelOverlay = () => {
    if (labelOverlayRef.current) {
      labelOverlayRef.current.setMap(null)
      labelOverlayRef.current = null
    }
  }

  // offset 이동 함수
  const panToWithSheetOffset = ({
    lat,
    lng,
    targetSnap,
  }: {
    lat: number
    lng: number
    targetSnap: SheetSnap
  }) => {
    const { kakao } = window
    const map = mapInstanceRef.current
    if (!map || !mapRef.current) return

    const projection = map.getProjection()
    if (!projection) {
      map.panTo(new kakao.maps.LatLng(lat, lng))
      return
    }

    const targetLatLng = new kakao.maps.LatLng(lat, lng)
    const mapHeight = mapRef.current.clientHeight

    let coveredHeight = 0
    if (targetSnap === "HALF") {
      coveredHeight = mapHeight * 0.48
    } else if (targetSnap === "FULL") {
      coveredHeight = mapHeight * 0.82
    }

    const visibleCenterY = (mapHeight - coveredHeight) / 2 + 65

    const markerPoint = projection.containerPointFromCoords(targetLatLng)
    const currentCenter = map.getCenter()
    const currentCenterPoint = projection.containerPointFromCoords(currentCenter)

    const deltaY = markerPoint.y - visibleCenterY

    const nextCenterPoint = new kakao.maps.Point(
      currentCenterPoint.x,
      currentCenterPoint.y + deltaY
    )

    const nextCenterLatLng = projection.coordsFromContainerPoint(nextCenterPoint)
    map.panTo(nextCenterLatLng)
  }

  // 이름 말풍선 생성
  const showLabelOverlay = ({
    lat,
    lng,
    name,
  }: {
    lat: number
    lng: number
    name: string
  }) => {
    const { kakao } = window
    const map = mapInstanceRef.current
    if (!map) return

    clearLabelOverlay()

    const position = new kakao.maps.LatLng(lat, lng)

    const bubble = document.createElement("div")
    bubble.className =
      "rounded-full border border-gray-200 bg-white/95 px-3 py-1.5 text-xs font-bold text-gray-800 shadow-[0_6px_18px_rgba(0,0,0,0.16)] whitespace-nowrap backdrop-blur-sm"
    bubble.innerText = name

    const overlay = new kakao.maps.CustomOverlay({
      position,
      content: bubble,
      yAnchor: 2.2, // 마커 위쪽에 뜨게
      zIndex: 20,
    })

    overlay.setMap(map)
    labelOverlayRef.current = overlay
  }

  // 커스텀 핀 DOM 생성
  const createMarkerElement = ({
    type,
    isSelected,
    title,
    onClick,
  }: {
    type: "PUB" | "FOOD_TRUCK" | "EXPERIENCE" | "FACILITY"
    isSelected: boolean
    title: string
    onClick: () => void
  }) => {
    const { color, iconPath } = getMarkerConfig(type)
    const pinUrl = createPinDataUrl(color)

    const wrapper = document.createElement("div")
    wrapper.title = title
    wrapper.style.position = "relative"
    wrapper.style.width = isSelected ? "56px" : "48px"
    wrapper.style.height = isSelected ? "68px" : "60px"
    wrapper.style.transform = "translate(-50%, -100%)"
    wrapper.style.cursor = "pointer"
    wrapper.style.userSelect = "none"
    wrapper.style.transition = "transform 0.18s ease"
    wrapper.style.filter = isSelected
      ? "drop-shadow(0 10px 22px rgba(10,85,156,0.25))"
      : "drop-shadow(0 8px 18px rgba(0,0,0,0.18))"

    const pin = document.createElement("img")
    pin.src = pinUrl
    pin.alt = `${title} 핀`
    pin.style.position = "absolute"
    pin.style.inset = "0"
    pin.style.width = "100%"
    pin.style.height = "100%"
    pin.style.objectFit = "contain"
    pin.draggable = false

    const icon = document.createElement("img")
    icon.src = iconPath
    icon.alt = `${title} 아이콘`
    icon.style.position = "absolute"
    icon.style.left = "50%"
    icon.style.top = "36%"
    icon.style.width = isSelected ? "22px" : "20px"
    icon.style.height = isSelected ? "22px" : "20px"
    icon.style.transform = "translate(-50%, -50%)"
    icon.style.objectFit = "contain"
    icon.style.pointerEvents = "none"
    icon.style.filter = "brightness(0) invert(1)" // 검은 svg -> 흰색
    icon.draggable = false

    if (isSelected) {
      const ring = document.createElement("div")
      ring.style.position = "absolute"
      ring.style.left = "50%"
      ring.style.top = "36%"
      ring.style.width = "28px"
      ring.style.height = "28px"
      ring.style.transform = "translate(-50%, -50%)"
      ring.style.borderRadius = "9999px"
      ring.style.boxShadow = "0 0 0 5px rgba(10,85,156,0.18)"
      ring.style.pointerEvents = "none"
      wrapper.appendChild(ring)
    }

    wrapper.appendChild(pin)
    wrapper.appendChild(icon)

    wrapper.onclick = (e) => {
      e.stopPropagation()
      onClick()
    }

    return wrapper
  }

  // 오버레이 렌더링
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current) return

    const { kakao } = window
    const map = mapInstanceRef.current

    clearOverlays()
    clearLabelOverlay()

    const bounds = new kakao.maps.LatLngBounds()
    let hasMarker = false

    const addOverlay = ({
      lat,
      lng,
      type,
      isSelected,
      title,
      onClick,
    }: {
      lat: number
      lng: number
      type: "PUB" | "FOOD_TRUCK" | "EXPERIENCE" | "FACILITY"
      isSelected: boolean
      title: string
      onClick: () => void
    }) => {
      const position = new kakao.maps.LatLng(lat, lng)

      const content = createMarkerElement({
        type,
        isSelected,
        title,
        onClick: () => {
          onClick()
        },
      })

      const overlay = new kakao.maps.CustomOverlay({
        position,
        content,
        yAnchor: 1,
        zIndex: isSelected ? 10 : 1,
      })

      overlay.setMap(map)
      overlaysRef.current.push(overlay)
      bounds.extend(position)
      hasMarker = true
    }

    const addBoothMarker = (booth: Booth) => {
      const isSelected =
        selectedItem?.kind === "booth" && selectedItem.id === booth.id

      addOverlay({
        lat: booth.location_y,
        lng: booth.location_x,
        type: booth.type,
        isSelected,
        title: booth.name,
        onClick: () => onClickBooth(booth.id),
      })
    }

    const addCollegeMarker = (college: College) => {
      const isSelected =
        selectedItem?.kind === "college" && selectedItem.id === college.id

      addOverlay({
        lat: college.location_y,
        lng: college.location_x,
        type: "PUB",
        isSelected,
        title: `${college.name} 주점`,
        onClick: () => onClickCollege(college.id),
      })
    }

    // 표시 규칙
    if (primaryFilter === "PUB") {
      colleges.forEach(addCollegeMarker)
    } else if (primaryFilter === "ALL") {
      booths.forEach(addBoothMarker)
      colleges.forEach(addCollegeMarker)
    } else {
      booths.forEach(addBoothMarker)
    }

    let shouldSkipBounds = false

    // 선택된 항목이 있으면 이름 말풍선 표시
    if (selectedItem?.kind === "booth") {
      const selectedBooth = booths.find((booth) => booth.id === selectedItem.id)

      if (selectedBooth) {
        showLabelOverlay({
          lat: selectedBooth.location_y,
          lng: selectedBooth.location_x,
          name: selectedBooth.name,
        })

        // 일반 부스는 바텀시트가 PEEK라서 기본 중앙 이동
        map.panTo(new kakao.maps.LatLng(selectedBooth.location_y, selectedBooth.location_x))
        shouldSkipBounds = true
      }
    }

    if (selectedItem?.kind === "college") {
      const selectedCollege = colleges.find((college) => college.id === selectedItem.id)

      if (selectedCollege) {
        showLabelOverlay({
          lat: selectedCollege.location_y,
          lng: selectedCollege.location_x,
          name: selectedCollege.name,
        })

        // 단과대 마커는 HALF 시트를 고려해서 보이는 영역 중심으로 이동
        panToWithSheetOffset({
          lat: selectedCollege.location_y,
          lng: selectedCollege.location_x,
          targetSnap: "HALF",
        })
        shouldSkipBounds = true
      }
    }

    if (!shouldSkipBounds) {
      if (hasMarker) {
        if (overlaysRef.current.length === 1) {
          map.setCenter(bounds.getSouthWest())
          map.setLevel(3)
        } else {
          map.setBounds(bounds, 60, 60, 140, 60)
        }
      } else {
        map.setCenter(new kakao.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng))
        map.setLevel(4)
      }
    }

    return () => {
      clearOverlays()
      clearLabelOverlay()
    }
  }, [
    isLoaded,
    booths,
    colleges,
    primaryFilter,
    selectedItem,
    onClickBooth,
    onClickCollege,
  ])

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