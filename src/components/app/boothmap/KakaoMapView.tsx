// 역할: boothmap 화면에서 사용하는 Kakao Map View UI 블록을 렌더링합니다.
// 카카오맵 2D 지도를 렌더링하고, 커스텀 오버레이 핀 마커와 이름 말풍선을 표시하는 컴포넌트

import { useEffect, useMemo, useRef, useState } from "react"
import useKakaoMapLoader from "@/hooks/app/boothmap/useKakaoMapLoader"
import { useT } from "@/i18n"
import {
  BOOTHMAP_MARKER_THEME,
  getBoothmapColor,
  getBoothmapBoothMarkerTheme,
  getBoothmapZonePalette,
  type BoothmapMarkerType,
} from "@/utils/app/boothmap/boothmapTheme"
import { getBottomSheetCoveredRatio } from "@/utils/app/boothmap/sheetSnap";
import type {
  Booth,
  College,
  MapViewport,
  PrimaryFilter,
  SelectedMapItem,
  SheetSnap,
} from "@/types/app/boothmap/boothmap.types"
import { MAP_ZONES } from "@/utils/app/boothmap/mapZones";
import type {
  KakaoCustomOverlay,
  KakaoGlobal,
  KakaoMap,
  KakaoMarker,
  KakaoPolygon,
} from "@/types/app/boothmap/kakao-map"

declare global {
  interface Window {
    kakao: KakaoGlobal
  }
}

type Props = {
  booths: Booth[];
  colleges: College[];
  primaryFilter: PrimaryFilter;
  isBoothExpanded: boolean;
  selectedMapItem: SelectedMapItem;
  sheetSnap: SheetSnap;
  viewport: MapViewport;
  onViewportChange: (next: MapViewport) => void;
  onClickBooth: (id: number) => void;
  onClickCollege: (id: number) => void;
  onExpandBooth: () => void;
  onPrimaryFilterChange: (next: PrimaryFilter) => void;
};

const DEFAULT_CENTER = {
  lat: 37.32045,
  lng: 127.12805,
}

const DANKOOK_BOUNDS = {
  south: 37.315,
  north: 37.3295,
  west: 127.116,
  east: 127.137,
}

type MarkerType = BoothmapMarkerType

type OverlayRecord = {
  marker: KakaoMarker
  labelOverlay: KakaoCustomOverlay | null
  kind: "booth" | "college"
  id: number
  lat: number
  lng: number
  name: string
  type: MarkerType
  subType?: Booth["subType"]
  onClick: () => void
}

function getMarkerConfig(params: {
  type: MarkerType
  subType?: Booth["subType"]
  name?: string
}) {
  return getBoothmapBoothMarkerTheme(params)
}

function createMarkerDataUrl(params: {
  color: string
  selected: boolean
  useCircleShape: boolean
  iconMarkup: string
}) {
  if (params.useCircleShape) {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="12.5" fill="${params.color}" stroke="rgba(255,255,255,0.92)" stroke-width="2.5"/>
        ${params.iconMarkup}
      </svg>
    `

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
  }

  const stroke = params.selected ? params.color : "rgba(255,255,255,0.92)"
  const fill = params.selected ? getBoothmapColor("overlayBadgeText") : params.color

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="60" viewBox="0 0 48 60" fill="none">
      <path d="M24 59C24 59 45 38.5 45 24C45 12.402 35.598 3 24 3C12.402 3 3 12.402 3 24C3 38.5 24 59 24 59Z" fill="${fill}" stroke="${stroke}" stroke-width="${params.selected ? 3.5 : 2.5}"/>
      ${params.iconMarkup}
    </svg>
  `

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

const RAW_MARKER_ICON_PATHS = Array.from(
  new Set([
    ...Object.values(BOOTHMAP_MARKER_THEME).map((theme) => theme.iconPath),
    "/markers/facility-info.svg",
    "/markers/facility-smoking.svg",
  ]),
)

function extractSvgInnerMarkup(raw: string) {
  const trimmed = raw.trim().replace(/^\uFEFF/, "")
  const match = trimmed.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i)
  const inner = match?.[1] ?? trimmed

  return inner
    .replace(/fill="[^"]*"/gi, 'fill="currentColor"')
    .replace(/stroke="[^"]*"/gi, 'stroke="currentColor"')
}

function createInlineMarkerIconMarkup(params: {
  type: MarkerType
  subType?: Booth["subType"]
  color: string
  x: number
  y: number
  size: number
}) {
  const strokeWidth = Math.max(1.7, params.size * 0.13)
  const half = params.size / 2
  const centerX = params.x + half
  const centerY = params.y + half
  const left = params.x
  const top = params.y
  const right = params.x + params.size
  const bottom = params.y + params.size
  const color = params.color

  if (params.type === "PUB") {
    return `
      <path d="M ${left + params.size * 0.22} ${top + params.size * 0.18} H ${centerX - params.size * 0.02} V ${top + params.size * 0.62} Q ${centerX - params.size * 0.02} ${bottom - params.size * 0.08} ${centerX - params.size * 0.12} ${bottom - params.size * 0.08} H ${centerX + params.size * 0.04}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M ${centerX + params.size * 0.12} ${top + params.size * 0.18} V ${top + params.size * 0.54} Q ${centerX + params.size * 0.12} ${top + params.size * 0.68} ${right - params.size * 0.16} ${top + params.size * 0.68} V ${top + params.size * 0.18}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
    `
  }

  if (params.type === "FOOD_TRUCK") {
    return `
      <rect x="${left + params.size * 0.12}" y="${top + params.size * 0.34}" width="${params.size * 0.48}" height="${params.size * 0.26}" rx="${params.size * 0.04}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" />
      <path d="M ${left + params.size * 0.6} ${top + params.size * 0.4} H ${right - params.size * 0.18} V ${top + params.size * 0.6} H ${left + params.size * 0.6} Z" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linejoin="round"/>
      <circle cx="${left + params.size * 0.3}" cy="${bottom - params.size * 0.15}" r="${params.size * 0.08}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" />
      <circle cx="${right - params.size * 0.24}" cy="${bottom - params.size * 0.15}" r="${params.size * 0.08}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" />
    `
  }

  if (params.type === "EXPERIENCE") {
    return `
      <path d="M ${left + params.size * 0.22} ${top + params.size * 0.2} L ${right - params.size * 0.18} ${centerY} L ${left + params.size * 0.22} ${bottom - params.size * 0.12} Z" fill="${color}" />
    `
  }

  if (params.type === "FACILITY") {
    if (typeof params.subType === "string" && params.subType.trim().toUpperCase() === "SMOKING_AREA") {
      return `
        <path d="M ${left + params.size * 0.18} ${centerY} H ${right - params.size * 0.22}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round"/>
        <path d="M ${right - params.size * 0.22} ${centerY} V ${top + params.size * 0.22} Q ${right - params.size * 0.22} ${top + params.size * 0.12} ${right - params.size * 0.32} ${top + params.size * 0.12}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round"/>
        <path d="M ${left + params.size * 0.3} ${top + params.size * 0.22} C ${left + params.size * 0.18} ${top + params.size * 0.1}, ${left + params.size * 0.34} ${top + params.size * 0.06}, ${left + params.size * 0.24} ${top - params.size * 0.02}" fill="none" stroke="${color}" stroke-width="${strokeWidth * 0.85}" stroke-linecap="round"/>
      `
    }

    return `
      <circle cx="${centerX}" cy="${top + params.size * 0.22}" r="${params.size * 0.09}" fill="${color}" />
      <path d="M ${centerX} ${top + params.size * 0.34} V ${bottom - params.size * 0.16}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round"/>
      <path d="M ${left + params.size * 0.24} ${top + params.size * 0.48} H ${right - params.size * 0.24}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round"/>
      <path d="M ${centerX} ${bottom - params.size * 0.16} L ${left + params.size * 0.26} ${bottom - params.size * 0.02}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round"/>
      <path d="M ${centerX} ${bottom - params.size * 0.16} L ${right - params.size * 0.26} ${bottom - params.size * 0.02}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round"/>
    `
  }

  return `
    <path d="M ${centerX} ${top + params.size * 0.12} L ${centerX + params.size * 0.16} ${centerY - params.size * 0.02} L ${right - params.size * 0.1} ${centerY - params.size * 0.02} L ${centerX + params.size * 0.22} ${centerY + params.size * 0.1} L ${centerX + params.size * 0.32} ${bottom - params.size * 0.04} L ${centerX} ${centerY + params.size * 0.18} L ${centerX - params.size * 0.32} ${bottom - params.size * 0.04} L ${centerX - params.size * 0.22} ${centerY + params.size * 0.1} L ${left + params.size * 0.1} ${centerY - params.size * 0.02} L ${centerX - params.size * 0.16} ${centerY - params.size * 0.02} Z" fill="${color}"/>
  `
}

function createRawMarkerIconMarkup(params: {
  rawSvgContent: string
  color: string
  x: number
  y: number
  size: number
}) {
  return `
    <svg x="${params.x}" y="${params.y}" width="${params.size}" height="${params.size}" viewBox="0 0 512 512" preserveAspectRatio="xMidYMid meet" color="${params.color}">
      ${params.rawSvgContent}
    </svg>
  `
}

function getOverlayKey(kind: "booth" | "college", id: number) {
  return `${kind}:${id}`
}

function getBoothDisplayName(name: string) {
  return name.replace("(기업)", "").trim()
}

export default function KakaoMapView({
  booths,
  colleges,
  primaryFilter,
  isBoothExpanded,
  selectedMapItem,
  sheetSnap,
  viewport,
  onViewportChange,
  onClickBooth,
  onClickCollege,
  onExpandBooth,
  onPrimaryFilterChange,
}: Props) {
  const t = useT()
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<KakaoMap | null>(null)
  const isInitialBoundsAppliedRef = useRef(false)
  const lastViewportRef = useRef<MapViewport>(viewport)
  const isClampingBoundsRef = useRef(false)

  // 전체 오버레이를 배열 대신 Map으로 관리
  const overlayMapRef = useRef<Map<string, OverlayRecord>>(new Map())

  const zoneOverlaysRef = useRef<Array<KakaoMarker | KakaoCustomOverlay | KakaoPolygon>>([])
  const prevPrimaryFilterRef = useRef<PrimaryFilter>(primaryFilter)
  const selectedMapItemRef = useRef<SelectedMapItem>(selectedMapItem)
  const markerIconMarkupRef = useRef<Map<string, string>>(new Map())
  const [markerAssetVersion, setMarkerAssetVersion] = useState(0)
  const [markerAssetsReady, setMarkerAssetsReady] = useState(false)

  // 이름 말풍선

  // 이전 선택 항목 추적
  const prevSelectedKeyRef = useRef<string | null>(null)

  const { isLoaded, isError } = useKakaoMapLoader()

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    let cancelled = false

    const missingPaths = RAW_MARKER_ICON_PATHS.filter((iconPath) => {
      return !markerIconMarkupRef.current.has(iconPath)
    })

    if (missingPaths.length === 0) {
      setMarkerAssetsReady(true)
      return () => {
        cancelled = true
      }
    }

    void Promise.all(
      missingPaths.map(async (iconPath) => {
        try {
          const response = await fetch(iconPath)
          if (!response.ok) {
            throw new Error(`Failed to load marker asset: ${iconPath}`)
          }

          const raw = await response.text()
          return [iconPath, extractSvgInnerMarkup(raw)] as const
        } catch {
          return [iconPath, ""] as const
        }
      }),
    ).then((entries) => {
      if (cancelled) {
        return
      }

      let didChange = false

      entries.forEach(([iconPath, markup]) => {
        if (markup && !markerIconMarkupRef.current.has(iconPath)) {
          markerIconMarkupRef.current.set(iconPath, markup)
          didChange = true
        }
      })

      if (didChange) {
        setMarkerAssetVersion((version) => version + 1)
      }

      setMarkerAssetsReady(true)
    })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    selectedMapItemRef.current = selectedMapItem
  }, [selectedMapItem])

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

  const clampLatLng = (lat: number, lng: number) => ({
    lat: Math.min(DANKOOK_BOUNDS.north, Math.max(DANKOOK_BOUNDS.south, lat)),
    lng: Math.min(DANKOOK_BOUNDS.east, Math.max(DANKOOK_BOUNDS.west, lng)),
  })

  function clampMapCenter() {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 지도 idle 핸들러는 초기 마운트 시점 함수 캡처를 유지
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
    const mapWidth = mapRef.current.clientWidth
    const mapHeight = mapRef.current.clientHeight

    const coveredHeight = mapHeight * getBottomSheetCoveredRatio(targetSnap)

    const visibleCenterX = mapWidth / 2
    const visibleCenterY = (mapHeight - coveredHeight) / 2 + 65

    const markerPoint = projection.containerPointFromCoords(targetLatLng)
    const currentCenter = map.getCenter()
    const currentCenterPoint = projection.containerPointFromCoords(currentCenter)

    const deltaX = markerPoint.x - visibleCenterX
    const deltaY = markerPoint.y - visibleCenterY

    const nextCenterPoint = new kakao.maps.Point(
      currentCenterPoint.x + deltaX,
      currentCenterPoint.y + deltaY
    )

    const nextCenterLatLng = projection.coordsFromContainerPoint(nextCenterPoint)
    map.panTo(nextCenterLatLng)
  }

  const createMarkerImage = ({
    type,
    subType,
    name,
    selected,
    useCircleShape = false,
  }: {
    type: MarkerType
    subType?: Booth["subType"]
    name?: string
    selected: boolean
    useCircleShape?: boolean
  }) => {
    const { kakao } = window
    const { color, iconPath } = getMarkerConfig({ type, subType, name })
    const width = selected ? 44 : useCircleShape ? 40 : 34
    const height = selected ? 54 : useCircleShape ? 40 : 42
    const size = new kakao.maps.Size(width, height)
    const offset = new kakao.maps.Point(width / 2, useCircleShape ? height / 2 : height)
    const isFacilityInfoIcon = iconPath === "/markers/facility-info.svg"
    const iconSize = isFacilityInfoIcon
      ? selected
        ? 21
        : useCircleShape
          ? 14
          : 18
      : selected
        ? 17
        : useCircleShape
          ? 12
          : 15
    const iconCenterX = useCircleShape ? width / 2 : 24
    const iconCenterY = useCircleShape ? height / 2 : 24
    const iconX = iconCenterX - iconSize / 2
    const iconY = iconCenterY - iconSize / 2
    const iconColor = selected ? color : getBoothmapColor("overlayBadgeText")
    const rawSvgContent = markerIconMarkupRef.current.get(iconPath)
    const iconMarkup = rawSvgContent
      ? createRawMarkerIconMarkup({
        rawSvgContent,
        color: iconColor,
        x: iconX,
        y: iconY,
        size: iconSize,
      })
      : createInlineMarkerIconMarkup({
        type,
        subType,
        color: iconColor,
        x: iconX,
        y: iconY,
        size: iconSize,
      })
    const src = createMarkerDataUrl({ color, selected, useCircleShape, iconMarkup })
    return new kakao.maps.MarkerImage(src, size, { offset })
  }

  // 이름 말풍선 생성
  const buildLabelBubble = (name: string) => {
    const bubble = document.createElement("div")
    bubble.className =
      "rounded-full border border-[var(--boothmap-overlay-label-border)] bg-[color:color-mix(in_srgb,var(--boothmap-overlay-label-bg)_96%,white)] px-3.5 py-2 text-xs font-bold tracking-[-0.01em] text-[var(--boothmap-overlay-label-text)] shadow-[0_14px_30px_-20px_var(--boothmap-overlay-shadow-soft)] whitespace-nowrap backdrop-blur-md"
    bubble.innerText = name
    bubble.style.position = "absolute"
    bubble.style.left = "50%"
    bubble.style.transform = "translateX(-50%)"
    bubble.style.pointerEvents = "none"
    return bubble
  }

  const createLabelOverlay = ({
    lat,
    lng,
    name,
  }: {
    lat: number
    lng: number
    name: string
  }) => {
    const { kakao } = window
    const wrapper = document.createElement("div")
    wrapper.style.transform = "translateY(-92px)"
    wrapper.style.pointerEvents = "none"
    wrapper.appendChild(buildLabelBubble(name))

    return new kakao.maps.CustomOverlay({
      position: new kakao.maps.LatLng(lat, lng),
      content: wrapper,
      xAnchor: 0.5,
      yAnchor: 1,
      zIndex: 11,
    })
  }

  // 개별 overlay 생성
  const createOverlayRecord = ({
    kind,
    id,
    lat,
    lng,
    name,
    type,
    subType,
    isSelected,
    onClick,
  }: {
    kind: "booth" | "college"
    id: number
    lat: number
    lng: number
    name: string
    type: MarkerType
    subType?: Booth["subType"]
    isSelected: boolean
    onClick: () => void
  }): OverlayRecord => {
    const { kakao } = window
    const map = mapInstanceRef.current
    const useCircleShape = kind === "booth" && type === "EXPERIENCE" && !isSelected

    const position = new kakao.maps.LatLng(lat, lng)
    const marker = new kakao.maps.Marker({
      position,
      image: createMarkerImage({ type, subType, name, selected: isSelected, useCircleShape }),
      zIndex: isSelected ? 10 : 1,
    })

    marker.setMap(map)
    marker.setZIndex?.(isSelected ? 10 : 1)
    kakao.maps.event.addListener(marker, "click", onClick)

    const labelOverlay = isSelected
      ? createLabelOverlay({ lat, lng, name })
      : null

    labelOverlay?.setMap(map)

    return {
      marker,
      labelOverlay,
      kind,
      id,
      lat,
      lng,
      name,
      type,
      subType,
      onClick,
    }
  }

  const createZoneMarkerRecord = ({
    lat,
    lng,
    label,
    type,
    onClick,
  }: {
    lat: number
    lng: number
    label: string
    type: MarkerType
    onClick: () => void
  }) => {
    const { kakao } = window
    const map = mapInstanceRef.current
    const position = new kakao.maps.LatLng(lat, lng)

    const marker = new kakao.maps.Marker({
      position,
      image: createMarkerImage({ type, selected: false }),
      title: label,
      zIndex: 7,
    })

    marker.setMap(map)
    marker.setZIndex?.(7)
    kakao.maps.event.addListener(marker, "click", onClick)

    zoneOverlaysRef.current.push(marker)
    return marker
  }

  const clearZoneOverlays = () => {
    zoneOverlaysRef.current.forEach((overlay) => {
      if (typeof overlay?.setMap === "function") {
        overlay.setMap(null)
      }
    })
    zoneOverlaysRef.current = []
  }

  const createZoneBounds = (polygons: Array<Array<{ lat: number; lng: number }>>) => {
    const { kakao } = window
    const bounds = new kakao.maps.LatLngBounds()

    polygons.forEach((paths) => {
      paths.forEach((point) => {
        bounds.extend(new kakao.maps.LatLng(point.lat, point.lng))
      })
    })

    return bounds
  }

  const createItemBounds = (items: Array<{ lat: number; lng: number }>) => {
    const { kakao } = window
    const bounds = new kakao.maps.LatLngBounds()

    items.forEach((item) => {
      bounds.extend(new kakao.maps.LatLng(item.lat, item.lng))
    })

    return bounds
  }

  const fitBoundsWithSheetPadding = (
    bounds: import("@/types/app/boothmap/kakao-map").KakaoLatLngBounds,
    targetSnap: SheetSnap,
  ) => {
    const map = mapInstanceRef.current
    if (!map || !mapRef.current) return

    const coveredHeight = Math.max(
      Math.round(mapRef.current.clientHeight * getBottomSheetCoveredRatio(targetSnap)),
      0,
    )
    const horizontalPadding = 24
    const topPadding = 24
    const centerShift = Math.max(Math.round(coveredHeight / 2 - 65), 0)
    const bottomPadding = topPadding + centerShift * 2

    map.setBounds(bounds, topPadding, horizontalPadding, bottomPadding, horizontalPadding)
  }

  const createZonePolygon = ({
    paths,
    strokeColor,
    fillColor,
    fillOpacity,
  }: {
    paths: Array<{ lat: number; lng: number }>
    strokeColor: string
    fillColor: string
    fillOpacity: number
  }) => {
    const { kakao } = window
    const map = mapInstanceRef.current
    if (!map) return null

    const polygon = new kakao.maps.Polygon({
      path: paths.map((point) => new kakao.maps.LatLng(point.lat, point.lng)),
      strokeWeight: 2,
      strokeColor,
      strokeOpacity: 0.9,
      fillColor,
      fillOpacity,
    })

    polygon.setMap(map)
    zoneOverlaysRef.current.push(polygon)
    return polygon
  }

  // 특정 overlay만 선택/비선택 스타일로 교체
  const replaceOverlaySelection = (
    key: string,
    isSelected: boolean
  ) => {
    const record = overlayMapRef.current.get(key)
    const map = mapInstanceRef.current
    if (!record) return

    record.marker.setImage?.(
      createMarkerImage({
        type: record.type,
        subType: record.subType,
        name: record.name,
        selected: isSelected,
        useCircleShape:
          record.kind === "booth" && record.type === "EXPERIENCE" && !isSelected,
      }),
    )
    record.marker.setZIndex?.(isSelected ? 10 : 1)

    if (isSelected) {
      if (!record.labelOverlay) {
        record.labelOverlay = createLabelOverlay({
          lat: record.lat,
          lng: record.lng,
          name: record.name,
        })
      }
      record.labelOverlay.setMap(map)
      record.labelOverlay.setZIndex(11)
      return
    }

    record.labelOverlay?.setMap(null)
  }

  const boothZone = MAP_ZONES.find((zone) => zone.type === "BOOTH") ?? null
  const pubZone = MAP_ZONES.find((zone) => zone.type === "PUB") ?? null
  const foodTruckZone = MAP_ZONES.find((zone) => zone.type === "FOOD_TRUCK") ?? null
  const smokingZones = MAP_ZONES.filter((zone) => zone.type === "SMOKING_AREA")

  const shouldShowBoothZoneSummary =
    primaryFilter === "ALL" && !isBoothExpanded && boothZone
  const shouldShowPubZoneSummary = primaryFilter === "ALL" && pubZone
  const shouldShowFoodTruckZoneSummary = primaryFilter === "ALL" && foodTruckZone
  const shouldShowSmokingZoneSummary = primaryFilter === "ALL" && smokingZones.length > 0

  const shouldShowPubZoneDetail = primaryFilter === "PUB" && pubZone
  const shouldShowFoodTruckZoneDetail =
    primaryFilter === "FOOD_TRUCK" && foodTruckZone
  const shouldShowSmokingZoneDetail =
    primaryFilter === "FACILITY" && smokingZones.length > 0
  const shouldShowPersistentFoodTruckZoneMarker =
    primaryFilter === "FOOD_TRUCK" && foodTruckZone

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
      subType?: Booth["subType"]
      onClick: () => void
    }> = []

    const addBooth = (booth: Booth) => {
      if (booth.location_x == null || booth.location_y == null) {
        return
      }

      items.push({
        key: getOverlayKey("booth", booth.id),
        kind: "booth",
        id: booth.id,
        lat: booth.location_y,
        lng: booth.location_x,
        name: getBoothDisplayName(booth.name),
        type: booth.type,
        subType: booth.subType,
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
        name: t("boothmap.collegePubMarkerName", { college: college.name }),
        type: "PUB",
        onClick: () => onClickCollege(college.id),
      })
    }

    if (primaryFilter === "PUB") {
      colleges.forEach(addCollege)
    } else if (primaryFilter === "ALL") {
      booths
        .filter((booth) => {
          if (booth.type === "FOOD_TRUCK") {
            return false
          }

          if (booth.type === "EXPERIENCE") {
            return isBoothExpanded
          }

          return true
        })
        .forEach(addBooth)
    } else if (primaryFilter === "FOOD_TRUCK") {
      // Food trucks stay grouped under the shared zone marker.
    } else {
      booths.forEach(addBooth)
    }

    return items
  }, [booths, colleges, isBoothExpanded, primaryFilter, onClickBooth, onClickCollege, t])

  // 1) 마커 목록이 바뀔 때만 전체 오버레이 재구성
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current || !markerAssetsReady) return

    const { kakao } = window
    const map = mapInstanceRef.current
    const nextKeys = new Set(visibleItems.map((item) => item.key))
    let hasMarker = false

    overlayMapRef.current.forEach((record, key) => {
      if (nextKeys.has(key)) return
      record.marker.setMap(null)
      record.labelOverlay?.setMap(null)
      overlayMapRef.current.delete(key)
    })

    visibleItems.forEach((item) => {
      const existing = overlayMapRef.current.get(item.key)
      const selectedItem = selectedMapItemRef.current
      const isSelected =
        selectedItem?.kind === item.kind && selectedItem.id === item.id

      if (!existing) {
        const record = createOverlayRecord({
          kind: item.kind,
          id: item.id,
          lat: item.lat,
          lng: item.lng,
          name: item.name,
          type: item.type,
          subType: item.subType,
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
          existing.marker.setMap(null)
          existing.labelOverlay?.setMap(null)
          const record = createOverlayRecord({
            kind: item.kind,
            id: item.id,
            lat: item.lat,
            lng: item.lng,
            name: item.name,
            type: item.type,
            subType: item.subType,
            isSelected,
            onClick: item.onClick,
          })
          overlayMapRef.current.set(item.key, record)
        }
      }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- overlay 재구성은 현재 계산된 visibleItems 기준으로만 동작
  }, [
    isLoaded,
    markerAssetsReady,
    visibleItems,
    markerAssetVersion,
  ])

  // 2) 선택 상태만 바뀔 때는 필요한 overlay만 교체
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current || !markerAssetsReady) return

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
        if (
          selectedBooth &&
          selectedBooth.type !== "FOOD_TRUCK" &&
          selectedBooth.location_x != null &&
          selectedBooth.location_y != null
        ) {
          const target = new kakao.maps.LatLng(
            selectedBooth.location_y,
            selectedBooth.location_x
          )


          map.setLevel(2, { anchor: target }) // 클릭한 마커 기준 확대
          if (selectedBooth.type === "EXPERIENCE") {
            map.setLevel(1, { anchor: target })
          }
          if (sheetSnap === "PEEK") {
            map.panTo(target)
          } else {
            panToWithSheetOffset({
              lat: selectedBooth.location_y,
              lng: selectedBooth.location_x,
              targetSnap: sheetSnap,
            })
          }
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

          if (sheetSnap === "PEEK") {
            map.panTo(target)
          } else {
            panToWithSheetOffset({
              lat: selectedCollege.location_y,
              lng: selectedCollege.location_x,
              targetSnap: sheetSnap,
            })
          }
        }
      }
    }

    prevSelectedKeyRef.current = nextKey
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 선택 상태 effect는 현재 선택 key 전이만 추적
  }, [isLoaded, markerAssetsReady, selectedMapItem, boothMap, collegeMap, sheetSnap])

  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current || !markerAssetsReady) return

    clearZoneOverlays()
    const pubZonePalette = getBoothmapZonePalette("PUB")
    const foodTruckZonePalette = getBoothmapZonePalette("FOOD_TRUCK")
    const smokingZonePalette = getBoothmapZonePalette("SMOKING_AREA")

    if (shouldShowBoothZoneSummary && boothZone) {
      boothZone.polygons.forEach((paths) => {
        createZonePolygon({
          paths,
          strokeColor: getBoothmapColor("markerExperience"),
          fillColor: getBoothmapColor("markerExperience"),
          fillOpacity: 0.16,
        })
      })

      boothZone.markers.forEach((marker) => {
        createZoneMarkerRecord({
          lat: marker.lat,
          lng: marker.lng,
          label: t("boothmap.zoneLabel.booth"),
          type: "EXPERIENCE",
          onClick: onExpandBooth,
        })
      })
    }

    if (shouldShowPubZoneSummary && pubZone) {
      pubZone.polygons.forEach((paths) => {
        createZonePolygon({
          paths,
          strokeColor: pubZonePalette.stroke,
          fillColor: pubZonePalette.fill,
          fillOpacity: 0.22,
        })
      })

      pubZone.markers.forEach((marker) => {
        createZoneMarkerRecord({
          lat: marker.lat,
          lng: marker.lng,
          label: t("boothmap.zoneLabel.pub"),
          type: "PUB",
          onClick: () => onPrimaryFilterChange("PUB"),
        })
      })
    }

    if (shouldShowFoodTruckZoneSummary && foodTruckZone) {
      foodTruckZone.polygons.forEach((paths) => {
        createZonePolygon({
          paths,
          strokeColor: foodTruckZonePalette.stroke,
          fillColor: foodTruckZonePalette.fill,
          fillOpacity: 0.22,
        })
      })

      foodTruckZone.markers.forEach((marker) => {
        createZoneMarkerRecord({
          lat: marker.lat,
          lng: marker.lng,
          label: t("boothmap.zoneLabel.foodTruck"),
          type: "FOOD_TRUCK",
          onClick: () => onPrimaryFilterChange("FOOD_TRUCK"),
        })
      })
    }

    if (shouldShowPubZoneDetail && pubZone) {
      pubZone.polygons.forEach((paths) => {
        createZonePolygon({
          paths,
          strokeColor: pubZonePalette.stroke,
          fillColor: pubZonePalette.fill,
          fillOpacity: 0.12,
        })
      })
    }

    if (shouldShowFoodTruckZoneDetail && foodTruckZone) {
      foodTruckZone.polygons.forEach((paths) => {
        createZonePolygon({
          paths,
          strokeColor: foodTruckZonePalette.stroke,
          fillColor: foodTruckZonePalette.fill,
          fillOpacity: 0.12,
        })
      })
    }

    if (shouldShowSmokingZoneSummary) {
      smokingZones.forEach((zone) => {
        zone.polygons.forEach((paths) => {
          createZonePolygon({
            paths,
            strokeColor: smokingZonePalette.stroke,
            fillColor: smokingZonePalette.fill,
            fillOpacity: 0.22,
          })
        })
      })
    }

    if (shouldShowSmokingZoneDetail) {
      smokingZones.forEach((zone) => {
        zone.polygons.forEach((paths) => {
          createZonePolygon({
            paths,
            strokeColor: smokingZonePalette.stroke,
            fillColor: smokingZonePalette.fill,
            fillOpacity: 0.12,
          })
        })
      })
    }

    if (shouldShowPersistentFoodTruckZoneMarker && foodTruckZone) {
      foodTruckZone.markers.forEach((marker) => {
        createZoneMarkerRecord({
          lat: marker.lat,
          lng: marker.lng,
          label: t("boothmap.zoneLabel.foodTruck"),
          type: "FOOD_TRUCK",
          onClick: () => onPrimaryFilterChange("FOOD_TRUCK"),
        })
      })
    }

    return () => {
      clearZoneOverlays()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- zone overlay는 filter 변화만 반영하고 기존 핸들러 참조를 유지
  }, [
    boothZone,
    isLoaded,
    isBoothExpanded,
    markerAssetsReady,
    onExpandBooth,
    primaryFilter,
    shouldShowBoothZoneSummary,
    shouldShowPubZoneSummary,
    shouldShowFoodTruckZoneSummary,
    shouldShowSmokingZoneSummary,
    shouldShowPubZoneDetail,
    shouldShowFoodTruckZoneDetail,
    shouldShowSmokingZoneDetail,
    shouldShowPersistentFoodTruckZoneMarker,
    pubZone,
    foodTruckZone,
    smokingZones,
    onPrimaryFilterChange,
    t,
  ])

  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current || !window.kakao?.maps) return

    const previous = prevPrimaryFilterRef.current

    if (previous === primaryFilter) return

    if (primaryFilter === "PUB" && pubZone) {
      const bounds = createZoneBounds(pubZone.polygons)
      fitBoundsWithSheetPadding(bounds, sheetSnap)
    }

    if (primaryFilter === "FOOD_TRUCK" && foodTruckZone) {
      const bounds = createZoneBounds(foodTruckZone.polygons)
      fitBoundsWithSheetPadding(bounds, sheetSnap)
    }

    if (primaryFilter === "FACILITY" && smokingZones.length > 0) {
      const bounds = createZoneBounds(smokingZones.flatMap((zone) => zone.polygons))
      fitBoundsWithSheetPadding(bounds, sheetSnap)
    }

    if (
      primaryFilter !== "ALL" &&
      primaryFilter !== "PUB" &&
      primaryFilter !== "FOOD_TRUCK" &&
      visibleItems.length > 0
    ) {
      const bounds = createItemBounds(visibleItems)
      fitBoundsWithSheetPadding(bounds, sheetSnap)
      if (primaryFilter === "FACILITY") {
        const currentLevel = mapInstanceRef.current?.getLevel()
        if (typeof currentLevel === "number") {
          mapInstanceRef.current?.setLevel(currentLevel + 1)
        }
      }
      if (primaryFilter === "EXPERIENCE") {
        const currentLevel = mapInstanceRef.current?.getLevel()
        if (typeof currentLevel === "number") {
          mapInstanceRef.current?.setLevel(Math.max(1, currentLevel - 1))
        }

        const centerLat =
          visibleItems.reduce((sum, item) => sum + item.lat, 0) / visibleItems.length
        const centerLng =
          visibleItems.reduce((sum, item) => sum + item.lng, 0) / visibleItems.length
        panToWithSheetOffset({
          lat: centerLat,
          lng: centerLng,
          targetSnap: sheetSnap,
        })
      }
    }

    prevPrimaryFilterRef.current = primaryFilter
  }, [isLoaded, primaryFilter, pubZone, foodTruckZone, sheetSnap, smokingZones, visibleItems])

  if (isError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-[var(--boothmap-surface-muted)]">
        <div className="rounded-2xl border border-[var(--boothmap-danger-border)] bg-[var(--boothmap-surface)] px-4 py-3 text-sm font-semibold text-[var(--boothmap-danger-text)] shadow-sm">
          {t("boothmap.kakaoMapLoadError")}
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-[var(--boothmap-surface-muted)]">
        <div className="rounded-2xl border border-[var(--boothmap-panel-border)] bg-[var(--boothmap-panel-bg)] px-4 py-3 text-sm font-semibold text-[var(--boothmap-text-subtle)] shadow-[var(--boothmap-panel-shadow)] backdrop-blur-md">
          {t("boothmap.mapLoading")}
        </div>
      </div>
    )
  }

  return <div ref={mapRef} className="absolute inset-0" />
}
