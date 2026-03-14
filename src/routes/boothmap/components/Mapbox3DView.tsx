import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import mapboxgl from "mapbox-gl";
import type {
  Booth,
  College,
  MapViewport,
  PrimaryFilter,
  SelectedMapItem,
  SheetSnap,
} from "../types/boothmap.types";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

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

const DEFAULT_ZOOM = 17;
const DEFAULT_PITCH = 55;
const DEFAULT_BEARING = -20;
const DANKOOK_BOUNDS: [[number, number], [number, number]] = [
  [127.1225, 37.3196],
  [127.1305, 37.3256],
];

type MarkerType = "PUB" | "FOOD_TRUCK" | "EXPERIENCE" | "FACILITY";
type VisibleItem = {
  key: string;
  kind: "booth" | "college";
  id: number;
  lng: number;
  lat: number;
  name: string;
  type: MarkerType;
  onClick: () => void;
};

function getMarkerConfig(type: MarkerType) {
  switch (type) {
    case "PUB":
      return {
        color: "#0a559c",
        iconPath: "/markers/booth-pub.svg",
      };
    case "FOOD_TRUCK":
      return {
        color: "#ef4444",
        iconPath: "/markers/booth-foodtruck.svg",
      };
    case "EXPERIENCE":
      return {
        color: "#10b981",
        iconPath: "/markers/booth-experience.svg",
      };
    case "FACILITY":
      return {
        color: "#3b82f6",
        iconPath: "/markers/facility-restroom.svg",
      };
    default:
      return {
        color: "#0a559c",
        iconPath: "/markers/booth-experience.svg",
      };
  }
}

function createPinDataUrl(color: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="60" viewBox="0 0 48 60" fill="none">
      <path d="M24 59C24 59 45 38.5 45 24C45 12.402 35.598 3 24 3C12.402 3 3 12.402 3 24C3 38.5 24 59 24 59Z" fill="${color}"/>
      <path d="M24 8C14.6112 8 7 15.6112 7 25C7 35.5591 16.3091 46.7859 24 54.3936C31.6909 46.7859 41 35.5591 41 25C41 15.6112 33.3888 8 24 8Z" fill="url(#pin-shine)" fill-opacity="0.22"/>
      <defs>
        <linearGradient id="pin-shine" x1="8" y1="8" x2="40" y2="52" gradientUnits="userSpaceOnUse">
          <stop stop-color="white"/>
          <stop offset="1" stop-color="white" stop-opacity="0"/>
        </linearGradient>
      </defs>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getOffsetYBySnap(sheetSnap: SheetSnap) {
  if (sheetSnap === "FULL") return 220;
  if (sheetSnap === "HALF") return 140;
  return 80;
}

function getItemKey(kind: "booth" | "college", id: number) {
  return `${kind}:${id}`;
}

function mapboxZoomToKakaoLevel(zoom: number) {
  return Math.min(4, Math.max(1, Math.round(20 - zoom)));
}

function buildMarkerElement({
  type,
  title,
  isSelected,
  onClick,
}: {
  type: MarkerType;
  title: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  const { iconPath, color } = getMarkerConfig(type);
  const pinUrl = createPinDataUrl(color);

  const wrapper = document.createElement("button");
  wrapper.type = "button";
  wrapper.title = title;
  wrapper.setAttribute("aria-label", title);
  wrapper.style.position = "relative";
  wrapper.style.width = isSelected ? "56px" : "48px";
  wrapper.style.height = isSelected ? "70px" : "62px";
  wrapper.style.padding = "0";
  wrapper.style.border = "0";
  wrapper.style.background = "transparent";
  wrapper.style.cursor = "pointer";
  wrapper.style.userSelect = "none";
  wrapper.style.transform = isSelected
    ? "translate(-50%, -100%) scale(1.03)"
    : "translate(-50%, -100%)";
  wrapper.style.transition =
    "transform 0.18s ease, filter 0.18s ease, opacity 0.18s ease";
  wrapper.style.filter = isSelected
    ? "drop-shadow(0 14px 24px rgba(10,85,156,0.28))"
    : "drop-shadow(0 10px 18px rgba(15,23,42,0.22))";

  const shadow = document.createElement("div");
  shadow.style.position = "absolute";
  shadow.style.left = "50%";
  shadow.style.bottom = "3px";
  shadow.style.width = isSelected ? "28px" : "24px";
  shadow.style.height = isSelected ? "8px" : "7px";
  shadow.style.transform = "translateX(-50%)";
  shadow.style.borderRadius = "9999px";
  shadow.style.background = "rgba(15,23,42,0.18)";
  shadow.style.filter = "blur(3px)";
  shadow.style.pointerEvents = "none";

  const pin = document.createElement("img");
  pin.src = pinUrl;
  pin.alt = `${title} marker`;
  pin.style.position = "absolute";
  pin.style.inset = "0";
  pin.style.width = "100%";
  pin.style.height = "100%";
  pin.style.objectFit = "contain";
  pin.draggable = false;

  const icon = document.createElement("img");
  icon.src = iconPath;
  icon.alt = "";
  icon.style.position = "absolute";
  icon.style.left = "50%";
  icon.style.top = "36%";
  icon.style.width = isSelected ? "22px" : "20px";
  icon.style.height = isSelected ? "22px" : "20px";
  icon.style.transform = "translate(-50%, -50%)";
  icon.style.objectFit = "contain";
  icon.style.pointerEvents = "none";
  icon.style.filter = "brightness(0) invert(1)";
  icon.draggable = false;

  wrapper.onclick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onClick();
  };

  wrapper.appendChild(shadow);
  wrapper.appendChild(pin);
  wrapper.appendChild(icon);

  if (isSelected) {
    const ring = document.createElement("div");
    ring.style.position = "absolute";
    ring.style.left = "50%";
    ring.style.top = "36%";
    ring.style.width = "28px";
    ring.style.height = "28px";
    ring.style.transform = "translate(-50%, -50%)";
    ring.style.borderRadius = "9999px";
    ring.style.boxShadow = "0 0 0 5px rgba(10,85,156,0.18)";
    ring.style.pointerEvents = "none";
    wrapper.appendChild(ring);
  }

  return wrapper;
}

function buildLabelElement(name: string) {
  const bubble = document.createElement("div");
  bubble.className =
    "rounded-full border border-gray-200 bg-white/95 px-3 py-1.5 text-xs font-bold text-gray-800 shadow-[0_6px_18px_rgba(0,0,0,0.16)] whitespace-nowrap backdrop-blur-sm";
  bubble.innerText = name;
  return bubble;
}

export default function Mapbox3DView({
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const markerMapRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const labelMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const lastViewportRef = useRef<MapViewport>(viewport);

  const boothMap = useMemo(() => {
    const map = new Map<number, Booth>();
    booths.forEach((booth) => map.set(booth.id, booth));
    return map;
  }, [booths]);

  const collegeMap = useMemo(() => {
    const map = new Map<number, College>();
    colleges.forEach((college) => map.set(college.id, college));
    return map;
  }, [colleges]);

  const visibleItems = useMemo<VisibleItem[]>(() => {
    const items: VisibleItem[] = [];

    const addBooth = (booth: Booth) => {
      items.push({
        key: getItemKey("booth", booth.id),
        kind: "booth",
        id: booth.id,
        lng: booth.location_x,
        lat: booth.location_y,
        name: booth.name,
        type: booth.type,
        onClick: () => onClickBooth(booth.id),
      });
    };

    const addCollege = (college: College) => {
      items.push({
        key: getItemKey("college", college.id),
        kind: "college",
        id: college.id,
        lng: college.location_x,
        lat: college.location_y,
        name: `${college.name} 주점`,
        type: "PUB",
        onClick: () => onClickCollege(college.id),
      });
    };

    if (primaryFilter === "PUB") {
      colleges.forEach(addCollege);
    } else if (primaryFilter === "ALL") {
      booths.forEach(addBooth);
      colleges.forEach(addCollege);
    } else {
      booths.forEach(addBooth);
    }

    return items;
  }, [booths, colleges, primaryFilter, onClickBooth, onClickCollege]);

  const clearLabelMarker = () => {
    if (labelMarkerRef.current) {
      labelMarkerRef.current.remove();
      labelMarkerRef.current = null;
    }
  };

  const clearAllMarkers = () => {
    markerMapRef.current.forEach((marker) => marker.remove());
    markerMapRef.current.clear();
  };

  const syncMarkers = () => {
    const map = mapRef.current;
    if (!map) return;

    clearAllMarkers();

    visibleItems.forEach((item) => {
      const isSelected =
        selectedMapItem?.kind === item.kind && selectedMapItem.id === item.id;
      const element = buildMarkerElement({
        type: item.type,
        title: item.name,
        isSelected,
        onClick: item.onClick,
      });

      const marker = new mapboxgl.Marker({
        element,
        anchor: "bottom",
      })
        .setLngLat([item.lng, item.lat])
        .addTo(map);

      markerMapRef.current.set(item.key, marker);
    });
  };

  const showLabelMarker = ({
    lng,
    lat,
    name,
  }: {
    lng: number;
    lat: number;
    name: string;
  }) => {
    const map = mapRef.current;
    if (!map) return;

    clearLabelMarker();

    const labelEl = buildLabelElement(name);
    labelMarkerRef.current = new mapboxgl.Marker({
      element: labelEl,
      anchor: "bottom",
      offset: [0, -74],
    })
      .setLngLat([lng, lat])
      .addTo(map);
  };

  const moveCameraWithOffset = ({
    lng,
    lat,
    targetSnap,
  }: {
    lng: number;
    lat: number;
    targetSnap: SheetSnap;
  }) => {
    const map = mapRef.current;
    if (!map) return;

    const point = map.project([lng, lat]);
    const adjustedPoint = new mapboxgl.Point(
      point.x,
      point.y + getOffsetYBySnap(targetSnap)
    );
    const nextCenter = map.unproject(adjustedPoint);

    map.easeTo({
      center: [nextCenter.lng, nextCenter.lat],
      zoom: Math.max(map.getZoom(), 17.2),
      pitch: Math.max(map.getPitch(), DEFAULT_PITCH),
      bearing: map.getBearing() || DEFAULT_BEARING,
      duration: 700,
      essential: true,
    });
  };

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current || !mapboxgl.accessToken) return;

    const initMap = () => {
      if (!containerRef.current || mapRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/standard",
        center: [viewport.lng, viewport.lat],
        zoom: viewport.mapboxZoom || DEFAULT_ZOOM,
        pitch: viewport.mapboxPitch || DEFAULT_PITCH,
        bearing: viewport.mapboxBearing || DEFAULT_BEARING,
        maxBounds: DANKOOK_BOUNDS,
        antialias: true,
      });

      map.setMinZoom(15);
      map.setMaxZoom(18.5);

      mapRef.current = map;

      map.on("load", () => {
        syncMarkers();
        map.resize();

        requestAnimationFrame(() => map.resize());
        setTimeout(() => map.resize(), 200);
      });

      map.on("click", () => {
        clearLabelMarker();
      });

      map.on("moveend", () => {
        const center = map.getCenter();
        const nextViewport: MapViewport = {
          lat: center.lat,
          lng: center.lng,
          kakaoLevel: mapboxZoomToKakaoLevel(map.getZoom()),
          mapboxZoom: map.getZoom(),
          mapboxPitch: map.getPitch(),
          mapboxBearing: map.getBearing(),
        };

        lastViewportRef.current = nextViewport;
        onViewportChange(nextViewport);
      });

      map.on("error", (event) => {
        console.error("[Mapbox] error:", event);
      });
    };

    initMap();

    resizeObserverRef.current = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const { width, height } = entry.contentRect;
      if (width === 0 || height === 0) return;

      if (!mapRef.current) {
        initMap();
        return;
      }

      mapRef.current.resize();
    });

    resizeObserverRef.current.observe(container);

    return () => {
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      clearLabelMarker();
      clearAllMarkers();

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const center = map.getCenter();
    const hasCenterChanged =
      Math.abs(center.lat - viewport.lat) > 0.00001 ||
      Math.abs(center.lng - viewport.lng) > 0.00001;
    const hasZoomChanged = Math.abs(map.getZoom() - viewport.mapboxZoom) > 0.01;
    const hasPitchChanged =
      Math.abs(map.getPitch() - viewport.mapboxPitch) > 0.1;
    const hasBearingChanged =
      Math.abs(map.getBearing() - viewport.mapboxBearing) > 0.1;

    if (
      !hasCenterChanged &&
      !hasZoomChanged &&
      !hasPitchChanged &&
      !hasBearingChanged
    ) {
      lastViewportRef.current = viewport;
      return;
    }

    map.jumpTo({
      center: [viewport.lng, viewport.lat],
      zoom: viewport.mapboxZoom,
      pitch: viewport.mapboxPitch,
      bearing: viewport.mapboxBearing,
    });

    lastViewportRef.current = viewport;
  }, [viewport]);

  useEffect(() => {
    syncMarkers();

    if (!selectedMapItem) {
      clearLabelMarker();
    }
  }, [visibleItems, selectedMapItem]);

  useEffect(() => {
    if (!selectedMapItem) {
      clearLabelMarker();
      return;
    }

    if (selectedMapItem.kind === "booth") {
      const booth = boothMap.get(selectedMapItem.id);
      if (!booth) return;

      showLabelMarker({
        lng: booth.location_x,
        lat: booth.location_y,
        name: booth.name,
      });

      moveCameraWithOffset({
        lng: booth.location_x,
        lat: booth.location_y,
        targetSnap: sheetSnap,
      });
      return;
    }

    const college = collegeMap.get(selectedMapItem.id);
    if (!college) return;

    showLabelMarker({
      lng: college.location_x,
      lat: college.location_y,
      name: `${college.name} 주점`,
    });

    moveCameraWithOffset({
      lng: college.location_x,
      lat: college.location_y,
      targetSnap: "HALF",
    });
  }, [selectedMapItem, sheetSnap, boothMap, collegeMap]);

  if (!mapboxgl.accessToken) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-50">
        <div className="rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-500 shadow-sm">
          Mapbox access token is missing.
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full"
      style={{ minHeight: 0, minWidth: 0 }}
    />
  );
}
