// 카카오맵 2D 지도를 렌더링하고, 커스텀 오버레이 핀 마커와 이름 말풍선을 표시하는 컴포넌트

import { useEffect, useMemo, useRef } from "react"
import useKakaoMapLoader from "../../../hooks/useKakaoMapLoader"
import {
  BOOTHMAP_MARKER_THEME,
  BOOTHMAP_SELECTED_RING,
  BOOTHMAP_SELECTED_SHADOW_SOFT,
  type BoothmapMarkerType,
} from "../constants/boothmapTheme"
import type {
  Booth,
  College,
  MapViewport,
  PrimaryFilter,
  SelectedMapItem,
  SheetSnap,
} from "../types/boothmap.types"

declare global {
  interface Window {
    kakao: any
  }
}

type Props = {
  booths: Booth[];
  colleges: College[];
  primaryFilter: PrimaryFilter;
  selectedMapItem: SelectedMapItem;
  sheetSnap: SheetSnap;
  viewport: MapViewport;
  onViewportChange: (next: MapViewport) => void;
  onClickBooth: (id: number) => void;
  onClickCollege: (id: number) => void;
};

const DEFAULT_CENTER = {
  lat: 37.3201,
  lng: 127.1276,
}

const DANKOOK_BOUNDS = {
  south: 37.315,
  north: 37.3295,
  west: 127.116,
  east: 127.137,
}

type MarkerType = BoothmapMarkerType

type OverlayRecord = {
  overlay: any
  kind: "booth" | "college"
  id: number
  lat: number
  lng: number
  name: string
  type: MarkerType
  onClick: () => void
}

function getMarkerConfig(type: MarkerType) {
  return BOOTHMAP_MARKER_THEME[type] ?? BOOTHMAP_MARKER_THEME.PUB
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

// type별 pin url 캐싱
const PIN_URL_MAP: Record<MarkerType, string> = {
  PUB: createPinDataUrl(BOOTHMAP_MARKER_THEME.PUB.color),
  FOOD_TRUCK: createPinDataUrl(BOOTHMAP_MARKER_THEME.FOOD_TRUCK.color),
  EXPERIENCE: createPinDataUrl(BOOTHMAP_MARKER_THEME.EXPERIENCE.color),
  FACILITY: createPinDataUrl(BOOTHMAP_MARKER_THEME.FACILITY.color),
}

function kakaoLevelToMapboxZoom(level: number) {
  return 20.4 - level * 1.5
}

function getOverlayKey(kind: "booth" | "college", id: number) {
  return `${kind}:${id}`
}

function getMarkerScaleByLevel(level: number, isSelected: boolean) {
  const baseScale =
    level <= 2 ? 0.9 :
    level === 3 ? 0.8 :
    0.68

  if (isSelected) {
    return Math.max(0.84, baseScale)
  }

  return baseScale
}

export default function KakaoMapView({
  booths,
  colleges,
  primaryFilter,
  selectedMapItem,
  sheetSnap,
  viewport,
  onViewportChange,
  onClickBooth,
  onClickCollege,
}: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<any>(null)
  const isInitialBoundsAppliedRef = useRef(false)
  const lastViewportRef = useRef<MapViewport>(viewport)
  const isClampingBoundsRef = useRef(false)

  // 전체 오버레이를 배열 대신 Map으로 관리
  const overlayMapRef = useRef<Map<string, OverlayRecord>>(new Map())

  // 이름 말풍선

  // 이전 선택 항목 추적
  const prevSelectedKeyRef = useRef<string | null>(null)

  const { isLoaded, isError } = useKakaoMapLoader()

  // 선택된 booth/college 빠르게 찾기 위한 맵
  const boothMap = useMemo(() => {
    const map = new Map<number, Booth>()
    booths.forEach((booth) => map.set(booth.id, booth))
    return map
  }, [booths])

  const collegeMap = useMemo(() => {
    const map = new Map<number, College>()
    colleges.forEach((college) => map.set(college.id, college))
    return map
  }, [colleges])

  // 지도 최초 생성
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return

    const { kakao } = window
    const center = new kakao.maps.LatLng(viewport.lat, viewport.lng)

    const map = new kakao.maps.Map(mapRef.current, {
      center,
      level: viewport.kakaoLevel,
    })

    // 줌 제한
    map.setMaxLevel(4) // 최대 축소

    // 지도 빈 곳 클릭 시 말풍선 닫기
    kakao.maps.event.addListener(map, "idle", () => {
      if (clampMapCenter()) {
        return
      }

      const center = map.getCenter()
      const nextViewport: MapViewport = {
        lat: center.getLat(),
        lng: center.getLng(),
        kakaoLevel: map.getLevel(),
        mapboxZoom: kakaoLevelToMapboxZoom(map.getLevel()),
        mapboxPitch: lastViewportRef.current.mapboxPitch,
        mapboxBearing: lastViewportRef.current.mapboxBearing,
      }

      const prevViewport = lastViewportRef.current
      const isSameViewport =
        Math.abs(prevViewport.lat - nextViewport.lat) < 0.00001 &&
        Math.abs(prevViewport.lng - nextViewport.lng) < 0.00001 &&
        prevViewport.kakaoLevel === nextViewport.kakaoLevel

      if (isSameViewport) {
        return
      }

      lastViewportRef.current = nextViewport
      onViewportChange(nextViewport)
    })

    mapInstanceRef.current = map
    isInitialBoundsAppliedRef.current = true
  }, [isLoaded, onViewportChange, viewport])

  useEffect(() => {
    const { kakao } = window
    const map = mapInstanceRef.current
    if (!map || !kakao) return

    const currentCenter = map.getCenter()
    const hasCenterChanged =
      Math.abs(currentCenter.getLat() - viewport.lat) > 0.00001 ||
      Math.abs(currentCenter.getLng() - viewport.lng) > 0.00001
    const hasLevelChanged = map.getLevel() !== viewport.kakaoLevel

    if (!hasCenterChanged && !hasLevelChanged) {
      lastViewportRef.current = viewport
      return
    }

    if (hasLevelChanged) {
      map.setLevel(viewport.kakaoLevel, { animate: false })
    }

    if (hasCenterChanged) {
      map.setCenter(new kakao.maps.LatLng(viewport.lat, viewport.lng))
    }

    lastViewportRef.current = viewport
  }, [viewport])

  const clearAllOverlays = () => {
    overlayMapRef.current.forEach(({ overlay }) => {
      overlay.setMap(null)
    })
    overlayMapRef.current.clear()
  }

  const clampLatLng = (lat: number, lng: number) => ({
    lat: Math.min(DANKOOK_BOUNDS.north, Math.max(DANKOOK_BOUNDS.south, lat)),
    lng: Math.min(DANKOOK_BOUNDS.east, Math.max(DANKOOK_BOUNDS.west, lng)),
  })

  const clampMapCenter = () => {
    const { kakao } = window
    const map = mapInstanceRef.current
    if (!map || !kakao || isClampingBoundsRef.current) return false

    const center = map.getCenter()
    const clamped = clampLatLng(center.getLat(), center.getLng())
    const isOutOfBounds =
      Math.abs(clamped.lat - center.getLat()) > 0.000001 ||
      Math.abs(clamped.lng - center.getLng()) > 0.000001

    if (!isOutOfBounds) return false

    isClampingBoundsRef.current = true
    map.setCenter(new kakao.maps.LatLng(clamped.lat, clamped.lng))
    isClampingBoundsRef.current = false
    return true
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
  const buildLabelBubble = (name: string) => {
    const bubble = document.createElement("div")
    bubble.className =
      "rounded-full border border-gray-200 bg-white/95 px-3 py-1.5 text-xs font-bold text-gray-800 shadow-[0_6px_18px_rgba(0,0,0,0.16)] whitespace-nowrap backdrop-blur-sm"
    bubble.innerText = name
    bubble.style.position = "absolute"
    bubble.style.left = "50%"
    bubble.style.transform = "translateX(-50%)"
    bubble.style.pointerEvents = "none"
    return bubble
  }

  // 마커 DOM 생성
  const createMarkerElement = ({
    type,
    isSelected,
    title,
    selectedLabel,
    level,
    onClick,
  }: {
    type: MarkerType
    isSelected: boolean
    title: string
    selectedLabel?: string
    level: number
    onClick: () => void
  }) => {
    const { iconPath } = getMarkerConfig(type)
    const pinUrl = PIN_URL_MAP[type]
    const scale = getMarkerScaleByLevel(level, isSelected)
    const width = Math.round((isSelected ? 50 : 42) * scale)
    const height = Math.round((isSelected ? 61 : 53) * scale)
    const iconSize = Math.round((isSelected ? 20 : 18) * scale)
    const ringSize = Math.round(24 * scale)

    const wrapper = document.createElement("div")
    wrapper.title = title
    wrapper.style.position = "relative"
    wrapper.style.width = `${width}px`
    wrapper.style.height = `${height}px`
    wrapper.style.transform = "translate(-50%, -100%)"
    wrapper.style.cursor = "pointer"
    wrapper.style.userSelect = "none"
    wrapper.style.transition = "transform 0.18s ease"
    wrapper.style.filter = isSelected
      ? `drop-shadow(0 10px 22px ${BOOTHMAP_SELECTED_SHADOW_SOFT})`
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
    icon.style.width = `${iconSize}px`
    icon.style.height = `${iconSize}px`
    icon.style.transform = "translate(-50%, -50%)"
    icon.style.objectFit = "contain"
    icon.style.pointerEvents = "none"
    icon.style.filter = "brightness(0) invert(1)"
    icon.draggable = false

    wrapper.appendChild(pin)
    wrapper.appendChild(icon)

    if (isSelected) {
      if (selectedLabel) {
        const bubble = buildLabelBubble(selectedLabel)
        bubble.style.bottom = `${height + 6}px`
        wrapper.appendChild(bubble)
      }

      const ring = document.createElement("div")
      ring.style.position = "absolute"
      ring.style.left = "50%"
      ring.style.top = "36%"
      ring.style.width = `${ringSize}px`
      ring.style.height = `${ringSize}px`
      ring.style.transform = "translate(-50%, -50%)"
      ring.style.borderRadius = "9999px"
      ring.style.boxShadow = `0 0 0 5px ${BOOTHMAP_SELECTED_RING}`
      ring.style.pointerEvents = "none"
      wrapper.appendChild(ring)
    }

    wrapper.onclick = (e) => {
      e.stopPropagation()
      onClick()
    }

    return wrapper
  }

  // 개별 overlay 생성
  const createOverlayRecord = ({
    kind,
    id,
    lat,
    lng,
    name,
    type,
    isSelected,
    onClick,
  }: {
    kind: "booth" | "college"
    id: number
    lat: number
    lng: number
    name: string
    type: MarkerType
    isSelected: boolean
    onClick: () => void
  }): OverlayRecord => {
    const { kakao } = window
    const map = mapInstanceRef.current

    const position = new kakao.maps.LatLng(lat, lng)
    const level = map?.getLevel?.() ?? 3
    const content = createMarkerElement({
      type,
      isSelected,
      title: name,
      selectedLabel: isSelected ? name : undefined,
      level,
      onClick,
    })

    const overlay = new kakao.maps.CustomOverlay({
      position,
      content,
      yAnchor: 1,
      zIndex: isSelected ? 10 : 1,
    })

    overlay.setMap(map)

    return {
      overlay,
      kind,
      id,
      lat,
      lng,
      name,
      type,
      onClick,
    }
  }

  // 특정 overlay만 선택/비선택 스타일로 교체
  const replaceOverlaySelection = (
    key: string,
    isSelected: boolean
  ) => {
    const record = overlayMapRef.current.get(key)
    const map = mapInstanceRef.current
    if (!record) return

    const content = createMarkerElement({
      type: record.type,
      isSelected,
      title: record.name,
      selectedLabel: isSelected ? record.name : undefined,
      level: map?.getLevel?.() ?? 3,
      onClick: record.onClick,
    })

    record.overlay.setContent(content)
    record.overlay.setZIndex(isSelected ? 10 : 1)
  }

  // 현재 필터 기준으로 보여줄 데이터 계산
  const visibleItems = useMemo(() => {
    const items: Array<{
      key: string
      kind: "booth" | "college"
      id: number
      lat: number
      lng: number
      name: string
      type: MarkerType
      onClick: () => void
    }> = []

    const addBooth = (booth: Booth) => {
      items.push({
        key: getOverlayKey("booth", booth.id),
        kind: "booth",
        id: booth.id,
        lat: booth.location_y,
        lng: booth.location_x,
        name: booth.name,
        type: booth.type,
        onClick: () => onClickBooth(booth.id),
      })
    }

    const addCollege = (college: College) => {
      items.push({
        key: getOverlayKey("college", college.id),
        kind: "college",
        id: college.id,
        lat: college.location_y,
        lng: college.location_x,
        name: `${college.name} 주점`,
        type: "PUB",
        onClick: () => onClickCollege(college.id),
      })
    }

    if (primaryFilter === "PUB") {
      colleges.forEach(addCollege)
    } else if (primaryFilter === "ALL") {
      booths.forEach(addBooth)
      colleges.forEach(addCollege)
    } else {
      booths.forEach(addBooth)
    }

    return items
  }, [booths, colleges, primaryFilter, onClickBooth, onClickCollege])

  // 1) 마커 목록이 바뀔 때만 전체 오버레이 재구성
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current) return

    const { kakao } = window
    const map = mapInstanceRef.current
    const bounds = new kakao.maps.LatLngBounds()
    const nextKeys = new Set(visibleItems.map((item) => item.key))
    let hasMarker = false

    overlayMapRef.current.forEach((record, key) => {
      if (nextKeys.has(key)) return
      record.overlay.setMap(null)
      overlayMapRef.current.delete(key)
    })

    visibleItems.forEach((item) => {
      const existing = overlayMapRef.current.get(item.key)
      const isSelected =
        selectedMapItem?.kind === item.kind && selectedMapItem.id === item.id

      if (!existing) {
        const record = createOverlayRecord({
          kind: item.kind,
          id: item.id,
          lat: item.lat,
          lng: item.lng,
          name: item.name,
          type: item.type,
          isSelected,
          onClick: item.onClick,
        })
        overlayMapRef.current.set(item.key, record)
      } else {
        const hasChanged =
          existing.lat !== item.lat ||
          existing.lng !== item.lng ||
          existing.name !== item.name ||
          existing.type !== item.type

        if (hasChanged) {
          existing.overlay.setMap(null)
          const record = createOverlayRecord({
            kind: item.kind,
            id: item.id,
            lat: item.lat,
            lng: item.lng,
            name: item.name,
            type: item.type,
            isSelected,
            onClick: item.onClick,
          })
          overlayMapRef.current.set(item.key, record)
        }
      }

      bounds.extend(new kakao.maps.LatLng(item.lat, item.lng))
      hasMarker = true
    })

    if (!isInitialBoundsAppliedRef.current) {
      if (hasMarker) {
        if (visibleItems.length === 1) {
          const only = visibleItems[0]
          map.setCenter(new kakao.maps.LatLng(only.lat, only.lng))
          map.setLevel(3)
        }
      } else {
        map.setCenter(new kakao.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng))
        map.setLevel(4)
      }

      isInitialBoundsAppliedRef.current = true
    }
  }, [
    isLoaded,
    visibleItems,
    selectedMapItem,
  ])

  // 2) 선택 상태만 바뀔 때는 필요한 overlay만 교체
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current) return

    const { kakao } = window
    const map = mapInstanceRef.current

    const prevKey = prevSelectedKeyRef.current
    const nextKey = selectedMapItem
      ? getOverlayKey(selectedMapItem.kind, selectedMapItem.id)
      : null

    // 이전 선택 해제
    if (prevKey && prevKey !== nextKey && overlayMapRef.current.has(prevKey)) {
      replaceOverlaySelection(prevKey, false)
    }

    // 새 선택 강조
    if (nextKey && overlayMapRef.current.has(nextKey)) {
      if (prevKey !== nextKey) {
        replaceOverlaySelection(nextKey, true)
      }

      if (selectedMapItem?.kind === "booth") {
        const selectedBooth = boothMap.get(selectedMapItem.id)
        if (selectedBooth) {
          const target = new kakao.maps.LatLng(
            selectedBooth.location_y,
            selectedBooth.location_x
          )


          map.setLevel(2, { anchor: target }) // 클릭한 마커 기준 확대
          map.panTo(target)
        }
      }

      if (selectedMapItem?.kind === "college") {
        const selectedCollege = collegeMap.get(selectedMapItem.id)
        if (selectedCollege) {
          const target = new kakao.maps.LatLng(
            selectedCollege.location_y,
            selectedCollege.location_x
          )


          map.setLevel(2, { anchor: target }) // 클릭한 마커 기준 확대

          panToWithSheetOffset({
            lat: selectedCollege.location_y,
            lng: selectedCollege.location_x,
            targetSnap: "HALF",
          })
        }
      }
    }

    prevSelectedKeyRef.current = nextKey
  }, [isLoaded, selectedMapItem, boothMap, collegeMap, sheetSnap, onClickBooth, onClickCollege, visibleItems])

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
