export type KakaoLatLng = {
  getLat: () => number;
  getLng: () => number;
};

export type KakaoPoint = {
  x: number;
  y: number;
};

export type KakaoProjection = {
  containerPointFromCoords: (coords: KakaoLatLng) => KakaoPoint;
  coordsFromContainerPoint: (point: KakaoPoint) => KakaoLatLng;
};

export type KakaoLatLngBounds = {
  extend: (coords: KakaoLatLng) => void;
};

export type KakaoMap = {
  setMaxLevel: (level: number) => void;
  getCenter: () => KakaoLatLng;
  getLevel: () => number;
  setLevel: (level: number, options?: { animate?: boolean; anchor?: KakaoLatLng }) => void;
  setCenter: (coords: KakaoLatLng) => void;
  panTo: (coords: KakaoLatLng) => void;
  setBounds: (bounds: KakaoLatLngBounds) => void;
  getProjection: () => KakaoProjection | null;
};

export type KakaoMarker = {
  setMap: (map: KakaoMap | null) => void;
  getPosition: () => KakaoLatLng;
  setImage?: (image: unknown) => void;
  setPosition?: (coords: KakaoLatLng) => void;
  setOpacity?: (value: number) => void;
  setZIndex?: (value: number) => void;
};

export type KakaoCustomOverlay = {
  setMap: (map: KakaoMap | null) => void;
  setPosition: (coords: KakaoLatLng) => void;
  setContent: (content: string | HTMLElement) => void;
  setZIndex: (value: number) => void;
};

export type KakaoPolygon = {
  setMap: (map: KakaoMap | null) => void;
};

export type KakaoMouseEvent = {
  latLng: KakaoLatLng;
};

export type KakaoMapsNamespace = {
  load: (callback: () => void) => void;
  Size: new (width: number, height: number) => unknown;
  Point: new (x: number, y: number) => KakaoPoint;
  MarkerImage: new (src: string, size: unknown, options?: { offset?: unknown }) => unknown;
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  LatLngBounds: new () => KakaoLatLngBounds;
  Map: new (container: HTMLElement, options: Record<string, unknown>) => KakaoMap;
  Marker: new (options: Record<string, unknown>) => KakaoMarker;
  CustomOverlay: new (options: Record<string, unknown>) => KakaoCustomOverlay;
  Polygon: new (options: Record<string, unknown>) => KakaoPolygon;
  event: {
    addListener: (target: unknown, eventName: string, handler: (event: KakaoMouseEvent) => void) => void;
    removeListener: (target: unknown, eventName: string, handler: (event: KakaoMouseEvent) => void) => void;
  };
};

export type KakaoGlobal = {
  maps: KakaoMapsNamespace;
};
