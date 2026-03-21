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
import { MAP_ZONES } from "../constants/mapZones";

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
  onPrimaryFilterChange: (next: PrimaryFilter) => void;
};

const DEFAULT_ZOOM = 16.6;
const DEFAULT_PITCH = 55;
const DEFAULT_BEARING = -20;
const FOCUSED_ZOOM = 17.8;
const DANKOOK_BOUNDS: [[number, number], [number, number]] = [
  [127.116, 37.315],
  [127.137, 37.3295],
];

const SOURCE_ID = "booth-points";
const BASE_CIRCLE_LAYER_ID = "booth-base-circle";
const BASE_ICON_LAYER_ID = "booth-base-icon";
const HIT_AREA_LAYER_ID = "booth-hit-area";

const PUB_ZONE_SOURCE_ID = "pub-zone-source";
const PUB_ZONE_FILL_LAYER_ID = "pub-zone-fill-layer";

const FOOD_TRUCK_ZONE_SOURCE_ID = "foodtruck-zone-source";
const FOOD_TRUCK_ZONE_FILL_LAYER_ID = "foodtruck-zone-fill-layer";

type MarkerType = "PUB" | "FOOD_TRUCK" | "EXPERIENCE" | "EVENT" | "FACILITY";

type MapFeatureProperties = {
  id: number;
  kind: "booth" | "college";
  name: string;
  markerType: MarkerType;
  isSelected: boolean;
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
    case "EVENT":
      return {
        color: "#f6da3b",
        iconPath: "/markers/booth-event.svg",
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

function mapboxZoomToKakaoLevel(zoom: number) {
  return Math.min(4, Math.max(1, Math.round((20.4 - zoom) / 1.5)));
}

function buildSelectedMarkerElement(type: MarkerType, title: string) {
  const { iconPath, color } = getMarkerConfig(type);
  const pinUrl = createPinDataUrl(color);

  const wrapper = document.createElement("button");
  wrapper.type = "button";
  wrapper.title = title;
  wrapper.setAttribute("aria-label", title);
  wrapper.style.position = "relative";
  wrapper.style.width = "52px";
  wrapper.style.height = "66px";
  wrapper.style.padding = "0";
  wrapper.style.border = "0";
  wrapper.style.background = "transparent";
  wrapper.style.cursor = "pointer";
  wrapper.style.userSelect = "none";
  wrapper.style.filter = "drop-shadow(0 14px 24px rgba(10,85,156,0.28))";

  const shadow = document.createElement("div");
  shadow.style.position = "absolute";
  shadow.style.left = "50%";
  shadow.style.bottom = "3px";
  shadow.style.width = "26px";
  shadow.style.height = "8px";
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
  icon.style.width = "21px";
  icon.style.height = "21px";
  icon.style.transform = "translate(-50%, -50%)";
  icon.style.objectFit = "contain";
  icon.style.pointerEvents = "none";
  icon.style.filter = "brightness(0) invert(1)";
  icon.draggable = false;

  const ring = document.createElement("div");
  ring.style.position = "absolute";
  ring.style.left = "50%";
  ring.style.top = "36%";
  ring.style.width = "26px";
  ring.style.height = "26px";
  ring.style.transform = "translate(-50%, -50%)";
  ring.style.borderRadius = "9999px";
  ring.style.boxShadow = "0 0 0 5px rgba(10,85,156,0.18)";
  ring.style.pointerEvents = "none";

  wrapper.appendChild(shadow);
  wrapper.appendChild(pin);
  wrapper.appendChild(icon);
  wrapper.appendChild(ring);

  return wrapper;
}

function buildZoneDotElement(color: string, label: string, count: number) {
  const wrapper = document.createElement("button");
  wrapper.type = "button";
  wrapper.title = label;
  wrapper.setAttribute("aria-label", label);
  wrapper.style.position = "relative";
  wrapper.style.width = "22px";
  wrapper.style.height = "22px";
  wrapper.style.padding = "0";
  wrapper.style.border = "0";
  wrapper.style.background = "transparent";
  wrapper.style.cursor = "pointer";

  const dot = document.createElement("div");
  dot.style.width = "22px";
  dot.style.height = "22px";
  dot.style.borderRadius = "9999px";
  dot.style.background = color;
  dot.style.border = "3px solid white";
  dot.style.boxShadow = "0 8px 18px rgba(15,23,42,0.18)";

  const badge = document.createElement("div");
  badge.textContent = String(count);
  badge.style.position = "absolute";
  badge.style.left = "50%";
  badge.style.top = "-28px";
  badge.style.transform = "translateX(-50%)";
  badge.style.padding = "4px 8px";
  badge.style.borderRadius = "9999px";
  badge.style.background = "#111827";
  badge.style.color = "white";
  badge.style.fontSize = "11px";
  badge.style.fontWeight = "700";
  badge.style.whiteSpace = "nowrap";
  badge.style.boxShadow = "0 6px 14px rgba(15,23,42,0.18)";
  badge.style.pointerEvents = "none";

  wrapper.appendChild(dot);
  wrapper.appendChild(badge);

  return wrapper;
}

function buildLabelElement(name: string) {
  const bubble = document.createElement("div");
  bubble.className =
    "rounded-full border border-gray-200 bg-white/95 px-3 py-1.5 text-xs font-bold text-gray-800 shadow-[0_6px_18px_rgba(0,0,0,0.16)] whitespace-nowrap backdrop-blur-sm";
  bubble.innerText = name;
  return bubble;
}

async function loadSvgAsImageBitmap(
  src: string,
  {
    size = 32,
    padding = 4,
    tintColor = "#ffffff",
  }: { size?: number; padding?: number; tintColor?: string } = {}
): Promise<ImageBitmap> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("canvas context creation failed");
  }

  ctx.clearRect(0, 0, size, size);

  const drawSize = size - padding * 2;
  ctx.drawImage(img, padding, padding, drawSize, drawSize);
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = tintColor;
  ctx.fillRect(0, 0, size, size);
  ctx.globalCompositeOperation = "source-over";

  return createImageBitmap(canvas);
}

function getSelectedItemData(
  selectedMapItem: SelectedMapItem,
  boothMap: Map<number, Booth>,
  collegeMap: Map<number, College>
) {
  if (!selectedMapItem) return null;

  if (selectedMapItem.kind === "booth") {
    const booth = boothMap.get(selectedMapItem.id);
    if (!booth) return null;

    return {
      lng: booth.location_x,
      lat: booth.location_y,
      name: booth.name,
      type: booth.type,
    };
  }

  const college = collegeMap.get(selectedMapItem.id);
  if (!college) return null;

  return {
    lng: college.location_x,
    lat: college.location_y,
    name: `${college.name} 주점`,
    type: "PUB" as const,
  };
}

function buildZoneFeatureCollection(
  polygons: Array<Array<{ lat: number; lng: number }>>
): GeoJSON.FeatureCollection<GeoJSON.Polygon> {
  return {
    type: "FeatureCollection",
    features: polygons.map((polygon, index) => ({
      type: "Feature",
      id: index,
      geometry: {
        type: "Polygon",
        coordinates: [[
          ...polygon.map((point) => [point.lng, point.lat] as [number, number]),
          [polygon[0].lng, polygon[0].lat],
        ]],
      },
      properties: {},
    })),
  };
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
  onPrimaryFilterChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const selectedMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const labelMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const imagesLoadedRef = useRef(false);
  const lastViewportRef = useRef<MapViewport>(viewport);
  const zoneMarkerRefs = useRef<mapboxgl.Marker[]>([]);
  const prevPrimaryFilterRef = useRef<PrimaryFilter>(primaryFilter);

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

  const pubZone = useMemo(
    () => MAP_ZONES.find((zone) => zone.type === "PUB") ?? null,
    []
  );

  const foodTruckZone = useMemo(
    () => MAP_ZONES.find((zone) => zone.type === "FOOD_TRUCK") ?? null,
    []
  );

  const pubCount = colleges.length;
  const foodTruckCount = booths.filter(
    (booth) => booth.type === "FOOD_TRUCK"
  ).length;

  const layerGeoJson = useMemo<GeoJSON.FeatureCollection<GeoJSON.Point>>(() => {
    const features: GeoJSON.Feature<GeoJSON.Point>[] = [];

    const addBooth = (booth: Booth) => {
      const isSelected =
        selectedMapItem?.kind === "booth" && selectedMapItem.id === booth.id;
      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [booth.location_x, booth.location_y],
        },
        properties: {
          id: booth.id,
          kind: "booth",
          name: booth.name,
          markerType: booth.type,
          isSelected,
        } satisfies MapFeatureProperties,
      });
    };

    const addCollege = (college: College) => {
      const isSelected =
        selectedMapItem?.kind === "college" && selectedMapItem.id === college.id;
      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [college.location_x, college.location_y],
        },
        properties: {
          id: college.id,
          kind: "college",
          name: `${college.name} 주점`,
          markerType: "PUB",
          isSelected,
        } satisfies MapFeatureProperties,
      });
    };

    if (primaryFilter === "PUB") {
      colleges.forEach(addCollege);
    } else if (primaryFilter === "ALL") {
      booths
        .filter((booth) => booth.type !== "FOOD_TRUCK")
        .forEach(addBooth);
    } else {
      booths.forEach(addBooth);
    }

    return {
      type: "FeatureCollection",
      features,
    };
  }, [booths, colleges, primaryFilter, selectedMapItem]);

  const clearSelectedMarker = () => {
    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.remove();
      selectedMarkerRef.current = null;
    }
  };

  const clearLabelMarker = () => {
    if (labelMarkerRef.current) {
      labelMarkerRef.current.remove();
      labelMarkerRef.current = null;
    }
  };

  const clearZoneMarkers = () => {
    zoneMarkerRefs.current.forEach((marker) => marker.remove());
    zoneMarkerRefs.current = [];
  };

  const clearSelectionOverlays = () => {
    clearSelectedMarker();
    clearLabelMarker();
  };

  const clearAllCustomMarkers = () => {
    clearSelectionOverlays();
    clearZoneMarkers();
  };

  const ensureImages = async (map: mapboxgl.Map) => {
    if (imagesLoadedRef.current) return;

    const imageDefs = [
      { id: "marker-pub", src: "/markers/booth-pub.svg" },
      { id: "marker-foodtruck", src: "/markers/booth-foodtruck.svg" },
      { id: "marker-experience", src: "/markers/booth-experience.svg" },
      { id: "marker-event", src: "/markers/booth-event.svg" },
      { id: "marker-facility", src: "/markers/facility-restroom.svg" },
    ];

    for (const imageDef of imageDefs) {
      if (map.hasImage(imageDef.id)) continue;

      const bitmap = await loadSvgAsImageBitmap(imageDef.src, {
        size: 40,
        padding: 3,
      });

      map.addImage(imageDef.id, bitmap, { pixelRatio: 2 });
    }

    imagesLoadedRef.current = true;
  };

  const createLayers = async (map: mapboxgl.Map) => {
    await ensureImages(map);

    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, {
        type: "geojson",
        data: layerGeoJson,
      });
    }

    if (!map.getLayer(BASE_CIRCLE_LAYER_ID)) {
      map.addLayer({
        id: BASE_CIRCLE_LAYER_ID,
        type: "circle",
        source: SOURCE_ID,
        filter: ["!", ["get", "isSelected"]],
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            8,
            9,
            12,
            10.5,
            16,
            12.5,
            18,
            14,
          ],
          "circle-color": [
            "match",
            ["get", "markerType"],
            "PUB",
            "#0a559c",
            "FOOD_TRUCK",
            "#ef4444",
            "EXPERIENCE",
            "#10b981",
            "EVENT",
            "#f6da3b",
            "FACILITY",
            "#3b82f6",
            "#0a559c",
          ],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
          "circle-opacity": 0.96,
          "circle-pitch-alignment": "viewport",
        },
      });
    }

    if (!map.getLayer(BASE_ICON_LAYER_ID)) {
      map.addLayer({
        id: BASE_ICON_LAYER_ID,
        type: "symbol",
        source: SOURCE_ID,
        filter: ["!", ["get", "isSelected"]],
        layout: {
          "icon-image": [
            "match",
            ["get", "markerType"],
            "PUB",
            "marker-pub",
            "FOOD_TRUCK",
            "marker-foodtruck",
            "EXPERIENCE",
            "marker-experience",
            "EVENT",
            "marker-event",
            "FACILITY",
            "marker-facility",
            "marker-experience",
          ],
          "icon-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            8,
            0.58,
            12,
            0.66,
            16,
            0.74,
            18,
            0.8,
          ],
          "icon-anchor": "center",
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
          "icon-rotation-alignment": "viewport",
          "icon-pitch-alignment": "viewport",
        },
        paint: {
          "icon-opacity": 0.98,
        },
      });
    }

    if (!map.getLayer(HIT_AREA_LAYER_ID)) {
      map.addLayer({
        id: HIT_AREA_LAYER_ID,
        type: "circle",
        source: SOURCE_ID,
        paint: {
          "circle-radius": 20,
          "circle-color": "#000000",
          "circle-opacity": 0,
        },
      });

      upsertZonePolygons(map);

      map.on("click", HIT_AREA_LAYER_ID, (event) => {
        const feature = event.features?.[0];
        if (!feature) return;

        const id = Number(feature.properties?.id);
        const kind = String(feature.properties?.kind);

        if (kind === "booth") {
          onClickBooth(id);
          return;
        }

        if (kind === "college") {
          onClickCollege(id);
        }
      });

      map.on("mouseenter", HIT_AREA_LAYER_ID, () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", HIT_AREA_LAYER_ID, () => {
        map.getCanvas().style.cursor = "";
      });

      map.on("click", (event) => {
        const hitFeatures = map.queryRenderedFeatures(event.point, {
          layers: [HIT_AREA_LAYER_ID],
        });

        if (hitFeatures.length === 0) {
          clearSelectionOverlays();
        }
      });
    }
  };

  const upsertZonePolygons = (map: mapboxgl.Map) => {
    const pubData = buildZoneFeatureCollection(pubZone?.polygons ?? []);
    const foodTruckData = buildZoneFeatureCollection(foodTruckZone?.polygons ?? []);

    const upsertSource = (sourceId: string, data: GeoJSON.FeatureCollection<GeoJSON.Polygon>) => {
      const source = map.getSource(sourceId) as mapboxgl.GeoJSONSource | undefined;
      if (source) {
        source.setData(data);
        return;
      }

      map.addSource(sourceId, {
        type: "geojson",
        data,
      });
    };

    upsertSource(PUB_ZONE_SOURCE_ID, pubData);
    upsertSource(FOOD_TRUCK_ZONE_SOURCE_ID, foodTruckData);

    if (!map.getLayer(PUB_ZONE_FILL_LAYER_ID)) {
      map.addLayer({
        id: PUB_ZONE_FILL_LAYER_ID,
        type: "fill",
        source: PUB_ZONE_SOURCE_ID,
        paint: {
          "fill-color": "#5aa3f8",
          "fill-opacity": 0,
        },
      });
    }

    if (!map.getLayer(FOOD_TRUCK_ZONE_FILL_LAYER_ID)) {
      map.addLayer({
        id: FOOD_TRUCK_ZONE_FILL_LAYER_ID,
        type: "fill",
        source: FOOD_TRUCK_ZONE_SOURCE_ID,
        paint: {
          "fill-color": "#fa6464",
          "fill-opacity": 0,
        },
      });
    }
  };

  const showSelectedOverlays = ({
    lng,
    lat,
    name,
    type,
  }: {
    lng: number;
    lat: number;
    name: string;
    type: MarkerType;
  }) => {
    const map = mapRef.current;
    if (!map) return;

    clearSelectionOverlays();

    const selectedEl = buildSelectedMarkerElement(type, name);
    selectedMarkerRef.current = new mapboxgl.Marker({
      element: selectedEl,
      anchor: "bottom",
    })
      .setLngLat([lng, lat])
      .addTo(map);

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
    targetZoom = FOCUSED_ZOOM,
  }: {
    lng: number;
    lat: number;
    targetSnap: SheetSnap;
    targetZoom?: number;
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
      zoom: Math.max(map.getZoom(), targetZoom),
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

      map.setMinZoom(2.8);
      map.setMaxZoom(18.5);
      map.setRenderWorldCopies(false);

      mapRef.current = map;

      map.on("load", async () => {
        await createLayers(map);
        map.resize();

        requestAnimationFrame(() => map.resize());
        setTimeout(() => map.resize(), 200);
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
      clearAllCustomMarkers();

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- map 인스턴스 초기화/해제는 마운트 1회로 고정
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const source = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (!source) return;

    source.setData(layerGeoJson);
  }, [layerGeoJson]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    upsertZonePolygons(map);
    clearZoneMarkers();

    const showPubSummary = primaryFilter === "ALL" && !!pubZone;
    const showFoodTruckSummary = primaryFilter === "ALL" && !!foodTruckZone;
    const showPubDetail = primaryFilter === "PUB" && !!pubZone;
    const showFoodTruckDetail =
      primaryFilter === "FOOD_TRUCK" && !!foodTruckZone;

    if (map.getLayer(PUB_ZONE_FILL_LAYER_ID)) {
      map.setPaintProperty(
        PUB_ZONE_FILL_LAYER_ID,
        "fill-opacity",
        showPubSummary || showPubDetail ? (showPubSummary ? 0.22 : 0.12) : 0
      );
    }

    if (map.getLayer(FOOD_TRUCK_ZONE_FILL_LAYER_ID)) {
      map.setPaintProperty(
        FOOD_TRUCK_ZONE_FILL_LAYER_ID,
        "fill-opacity",
        showFoodTruckSummary || showFoodTruckDetail
          ? showFoodTruckSummary
            ? 0.22
            : 0.12
          : 0
      );
    }

    if (showPubSummary && pubZone) {
      pubZone.markers.forEach((marker) => {
        const element = buildZoneDotElement("#2563eb", "주점 구역", pubCount);
        element.onclick = (event) => {
          event.stopPropagation();
          onPrimaryFilterChange("PUB");
        };

        const zoneMarker = new mapboxgl.Marker({
          element,
          anchor: "center",
        })
          .setLngLat([marker.lng, marker.lat])
          .addTo(map);

        zoneMarkerRefs.current.push(zoneMarker);
      });
    }

    if (showFoodTruckSummary && foodTruckZone) {
      foodTruckZone.markers.forEach((marker) => {
        const element = buildZoneDotElement(
          "#ef4444",
          "푸드트럭 구역",
          foodTruckCount
        );
        element.onclick = (event) => {
          event.stopPropagation();
          onPrimaryFilterChange("FOOD_TRUCK");
        };

        const zoneMarker = new mapboxgl.Marker({
          element,
          anchor: "center",
        })
          .setLngLat([marker.lng, marker.lat])
          .addTo(map);

        zoneMarkerRefs.current.push(zoneMarker);
      });
    }

    return () => {
      clearZoneMarkers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- zone marker 갱신은 필터/zone 변경 시점만 추적
  }, [
    primaryFilter,
    pubZone,
    foodTruckZone,
    pubCount,
    foodTruckCount,
    onPrimaryFilterChange,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const previous = prevPrimaryFilterRef.current;
    if (previous === primaryFilter) return;

    if (primaryFilter === "PUB" && pubZone) {
      const bounds = new mapboxgl.LngLatBounds();
      pubZone.polygons.forEach((polygon) => {
        polygon.forEach((point) => {
          bounds.extend([point.lng, point.lat]);
        });
      });

      const currentBearing = map.getBearing();
      const currentPitch = map.getPitch();

      map.fitBounds(bounds, {
        padding: 60,
        duration: 800,
        essential: true,
        bearing: currentBearing,
        pitch: currentPitch,
      });
    }

    if (primaryFilter === "FOOD_TRUCK" && foodTruckZone) {
      const bounds = new mapboxgl.LngLatBounds();
      foodTruckZone.polygons.forEach((polygon) => {
        polygon.forEach((point) => {
          bounds.extend([point.lng, point.lat]);
        });
      });

      const currentBearing = map.getBearing();
      const currentPitch = map.getPitch();

      map.fitBounds(bounds, {
        padding: 60,
        duration: 800,
        essential: true,
        bearing: currentBearing,
        pitch: currentPitch,
      });
    }

    prevPrimaryFilterRef.current = primaryFilter;
  }, [primaryFilter, pubZone, foodTruckZone]);

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
    const selectedData = getSelectedItemData(
      selectedMapItem,
      boothMap,
      collegeMap
    );

    if (!selectedData) {
      clearSelectionOverlays();
      return;
    }

    showSelectedOverlays(selectedData);
    moveCameraWithOffset({
      lng: selectedData.lng,
      lat: selectedData.lat,
      targetSnap:
        selectedMapItem?.kind === "college" ? "HALF" : sheetSnap,
      targetZoom: FOCUSED_ZOOM,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 선택 overlay 전환은 선택 데이터 변경 시점 기준으로 유지
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
