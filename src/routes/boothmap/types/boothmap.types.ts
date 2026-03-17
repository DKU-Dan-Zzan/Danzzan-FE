// 부스맵 페이지에서 사용하는 타입 모음

export type MapMode = "2D" | "3D";

export type BoothType = "EXPERIENCE" | "FOOD_TRUCK" | "FACILITY";
export type PrimaryFilter = "ALL" | "PUB" | BoothType;

export type SheetMode = "LIST" | "DETAIL";
export type SheetSnap = "PEEK" | "HALF" | "FULL";

export type MapViewport = {
  lat: number;
  lng: number;
  kakaoLevel: number;
  mapboxZoom: number;
  mapboxPitch: number;
  mapboxBearing: number;
};

export type College = {
  id: number;
  name: string;
  location_x: number; // lng
  location_y: number; // lat
};

export type Booth = {
  id: number;
  name: string;
  type: BoothType;
  description?: string;
  image_url?: string;
  location_x: number; // lng
  location_y: number; // lat
};

export type Pub = {
  id: number;
  college_id: number;
  department_id: number;
  department?: string;
  name: string;
  intro?: string;
  description?: string;
  instagram?: string;
  images?: string[];
  mainImageUrl?: string;
};

export type SelectedMapItem =
  | { kind: "booth"; id: number }
  | { kind: "college"; id: number }
  | null;

export type SelectedDetailItem =
  | { kind: "booth"; id: number }
  | { kind: "pub"; id: number }
  | null;
