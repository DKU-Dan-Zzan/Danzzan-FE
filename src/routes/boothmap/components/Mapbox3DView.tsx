import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import mapboxgl from "mapbox-gl";
import type {
  Booth,
  College,
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
  onClickBooth: (id: number) => void;
  onClickCollege: (id: number) => void;
};

const DEFAULT_CENTER: [number, number] = [127.1265, 37.3226];
const DANKOOK_BOUNDS: [[number, number], [number, number]] = [
  [127.1225, 37.3196],
  [127.1305, 37.3256],
];

type MarkerType = "PUB" | "FOOD_TRUCK" | "EXPERIENCE" | "FACILITY";

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
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getOffsetYBySnap(sheetSnap: SheetSnap) {
  if (sheetSnap === "FULL") return 220;
  if (sheetSnap === "HALF") return 140;
  return 80;
}

async function loadSvgAsImageBitmap(
  src: string,
  {
    size = 32,
    padding = 4,
  }: { size?: number; padding?: number } = {}
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
    throw new Error("canvas context 생성 실패");
  }

  ctx.clearRect(0, 0, size, size);

  const drawSize = size - padding * 2;
  ctx.drawImage(img, padding, padding, drawSize, drawSize);

  return await createImageBitmap(canvas);
}

function sourceExists(map: mapboxgl.Map, id: string) {
  return !!map.getSource(id);
}

function layerExists(map: mapboxgl.Map, id: string) {
  return !!map.getLayer(id);
}

function buildSelectedMarkerElement(type: MarkerType, title: string) {
  const { iconPath, color } = getMarkerConfig(type);
  const pinUrl = createPinDataUrl(color);

  const wrapper = document.createElement("div");
  wrapper.title = title;
  wrapper.style.position = "relative";
  wrapper.style.width = "56px";
  wrapper.style.height = "68px";
  wrapper.style.cursor = "pointer";
  wrapper.style.userSelect = "none";
  wrapper.style.filter = "drop-shadow(0 10px 22px rgba(10,85,156,0.25))";

  const pin = document.createElement("img");
  pin.src = pinUrl;
  pin.alt = `${title} 핀`;
  pin.style.position = "absolute";
  pin.style.inset = "0";
  pin.style.width = "100%";
  pin.style.height = "100%";
  pin.style.objectFit = "contain";
  pin.draggable = false;

  const icon = document.createElement("img");
  icon.src = iconPath;
  icon.alt = `${title} 아이콘`;
  icon.style.position = "absolute";
  icon.style.left = "50%";
  icon.style.top = "36%";
  icon.style.width = "22px";
  icon.style.height = "22px";
  icon.style.transform = "translate(-50%, -50%)";
  icon.style.objectFit = "contain";
  icon.style.pointerEvents = "none";
  icon.style.filter = "brightness(0) invert(1)";
  icon.draggable = false;

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

  wrapper.appendChild(pin);
  wrapper.appendChild(icon);
  wrapper.appendChild(ring);

  return wrapper;
}

function buildLabelElement(name: string) {
  const bubble = document.createElement("div");
  bubble.className =
    "rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-extrabold text-gray-800 shadow-[0_8px_24px_rgba(0,0,0,0.12)] whitespace-nowrap";
  bubble.innerText = name;
  return bubble;
}

export default function Mapbox3DView({
  booths,
  colleges,
  primaryFilter,
  selectedMapItem,
  sheetSnap,
  onClickBooth,
  onClickCollege,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const selectedMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const labelMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const imagesLoadedRef = useRef(false);

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

  const layerGeoJson = useMemo<GeoJSON.FeatureCollection>(() => {
    const features: GeoJSON.Feature[] = [];

    if (primaryFilter === "PUB") {
      colleges.forEach((college) => {
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
          },
        });
      });
    } else if (primaryFilter === "ALL") {
      booths.forEach((booth) => {
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
          },
        });
      });

      colleges.forEach((college) => {
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
          },
        });
      });
    } else {
      booths.forEach((booth) => {
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
          },
        });
      });
    }

    return {
      type: "FeatureCollection",
      features,
    };
  }, [booths, colleges, primaryFilter]);

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

  const clearSelectionOverlays = () => {
    clearSelectedMarker();
    clearLabelMarker();
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
    const adjusted = new mapboxgl.Point(
      point.x,
      point.y + getOffsetYBySnap(targetSnap)
    );
    const nextCenter = map.unproject(adjusted);

    map.easeTo({
      center: [nextCenter.lng, nextCenter.lat],
      zoom: 17.2,
      pitch: 55,
      bearing: -20,
      duration: 700,
      essential: true,
    });
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
      offset: [0, -12],
    })
      .setLngLat([lng, lat])
      .addTo(map);

    const labelEl = buildLabelElement(name);
    labelMarkerRef.current = new mapboxgl.Marker({
      element: labelEl,
      anchor: "bottom",
      offset: [0, -84],
    })
      .setLngLat([lng, lat])
      .addTo(map);
  };

  const ensureImages = async (map: mapboxgl.Map) => {
		if (imagesLoadedRef.current) return;

		const imageDefs: Array<{ id: string; src: string }> = [
			{ id: "marker-pub", src: "/markers/booth-pub.svg" },
			{ id: "marker-foodtruck", src: "/markers/booth-foodtruck.svg" },
			{ id: "marker-experience", src: "/markers/booth-experience.svg" },
			{ id: "marker-facility", src: "/markers/facility-restroom.svg" },
		];

		for (const imageDef of imageDefs) {
			if (map.hasImage(imageDef.id)) continue;

			const bitmap = await loadSvgAsImageBitmap(imageDef.src, {
				size: 32,
				padding: 5,
			});

			map.addImage(imageDef.id, bitmap, { pixelRatio: 2 });
		}

		imagesLoadedRef.current = true;
	};

  const createLayers = async (map: mapboxgl.Map) => {
    await ensureImages(map);

    if (!sourceExists(map, "booth-points")) {
      map.addSource("booth-points", {
        type: "geojson",
        data: layerGeoJson,
      });
    }

    if (!layerExists(map, "booth-pin-bg")) {
      map.addLayer({
        id: "booth-pin-bg",
        type: "circle",
        source: "booth-points",
        paint: {
          "circle-radius": 18,
          "circle-color": [
            "match",
            ["get", "markerType"],
            "PUB",
            "#0a559c",
            "FOOD_TRUCK",
            "#ef4444",
            "EXPERIENCE",
            "#10b981",
            "FACILITY",
            "#3b82f6",
            "#0a559c",
          ],
          "circle-opacity": 1,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2.5,
          "circle-translate": [0, -20],
          "circle-pitch-alignment": "map",
        },
      });
    }

    if (!layerExists(map, "booth-pin-icon")) {
      map.addLayer({
        id: "booth-pin-icon",
        type: "symbol",
        source: "booth-points",
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
            "FACILITY",
            "marker-facility",
            "marker-experience",
          ],
          "icon-size": 0.7,
          "icon-anchor": "center",
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
          "icon-offset": [0, -14],
        },
        paint: {
          "icon-opacity": 1,
        },
      });
    }

    if (!layerExists(map, "booth-hit-area")) {
      map.addLayer({
        id: "booth-hit-area",
        type: "circle",
        source: "booth-points",
        paint: {
          "circle-radius": 26,
          "circle-color": "#000000",
          "circle-opacity": 0,
        },
      });

      map.on("click", "booth-hit-area", (e) => {
        const feature = e.features?.[0];
        if (!feature) return;

        const id = Number(feature.properties?.id);
        const kind = String(feature.properties?.kind);

        if (kind === "booth") {
          onClickBooth(id);
        }

        if (kind === "college") {
          onClickCollege(id);
        }
      });

      map.on("mouseenter", "booth-hit-area", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "booth-hit-area", () => {
        map.getCanvas().style.cursor = "";
      });

      map.on("click", (e) => {
        const hitFeatures = map.queryRenderedFeatures(e.point, {
          layers: ["booth-hit-area"],
        });

        if (hitFeatures.length === 0) {
          clearSelectionOverlays();
        }
      });
    }
  };

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;
    if (!mapboxgl.accessToken) return;

    const initMap = () => {
      if (!containerRef.current || mapRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/standard",
        center: DEFAULT_CENTER,
        zoom: 17,
        pitch: 55,
        bearing: -20,
        maxBounds: DANKOOK_BOUNDS,
        antialias: true,
      });

      map.setMinZoom(15);
      map.setMaxZoom(18);

      mapRef.current = map;

      map.on("load", async () => {
        await createLayers(map);
        map.resize();

        requestAnimationFrame(() => map.resize());
        setTimeout(() => map.resize(), 200);
      });

      map.on("error", (e) => {
        console.error("[Mapbox] error:", e);
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
      clearSelectionOverlays();

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const source = map.getSource("booth-points") as mapboxgl.GeoJSONSource | undefined;
    if (!source) return;

    source.setData(layerGeoJson);
    clearSelectionOverlays();
  }, [layerGeoJson]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!selectedMapItem) {
      clearSelectionOverlays();
      return;
    }

    if (selectedMapItem.kind === "booth") {
      const booth = boothMap.get(selectedMapItem.id);
      if (!booth) return;

      showSelectedOverlays({
        lng: booth.location_x,
        lat: booth.location_y,
        name: booth.name,
        type: booth.type,
      });

      moveCameraWithOffset({
        lng: booth.location_x,
        lat: booth.location_y,
        targetSnap: sheetSnap,
      });
    }

    if (selectedMapItem.kind === "college") {
      const college = collegeMap.get(selectedMapItem.id);
      if (!college) return;

      showSelectedOverlays({
        lng: college.location_x,
        lat: college.location_y,
        name: `${college.name} 주점`,
        type: "PUB",
      });

      moveCameraWithOffset({
        lng: college.location_x,
        lat: college.location_y,
        targetSnap: "HALF",
      });
    }
  }, [selectedMapItem, sheetSnap, boothMap, collegeMap]);

  if (!mapboxgl.accessToken) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-50">
        <div className="rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-500 shadow-sm">
          Mapbox 토큰이 설정되지 않았어요.
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