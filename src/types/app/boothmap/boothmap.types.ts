// 역할: 부스맵 화면의 필터/시트/상세 뷰 타입을 정의합니다.

// 부스맵 페이지에서 사용하는 타입 모음

export type BoothType = "EXPERIENCE" | "FOOD_TRUCK" | "EVENT" | "FACILITY";
export type BoothSubType = "TOILET" | "RESTROOM" | "SMOKING_AREA";
export type PrimaryFilter = "ALL" | "PUB" | BoothType;

export type SheetMode = "LIST" | "DETAIL";
export type SheetSnap = "PEEK" | "HALF" | "FULL";

export type MapViewport = {
  lat: number;
  lng: number;
  kakaoLevel: number;
};

export type College = {
  id: number;
  name: string;
  location_x: number;
  location_y: number;
};

export type Booth = {
  id: number;
  name: string;
  type: BoothType;
  subType?: BoothSubType | null;
  description?: string | null;
  image_url?: string;
  location_x: number;
  location_y: number;
  startTime?: string | null;
  endTime?: string | null;
};

export type Pub = {
  id: number;
  college_id: number;
  department_id: number;
  department?: string | null;
  name: string;
  intro?: string | null;
  description?: string | null;
  instagram?: string | null;
  images?: string[];
  mainImageUrl?: string;
  startTime?: string | null;
  endTime?: string | null;
};

export type SelectedMapItem =
  | { kind: "booth"; id: number }
  | { kind: "college"; id: number }
  | null;

export type SelectedDetailItem =
  | { kind: "booth"; id: number }
  | { kind: "pub"; id: number }
  | null;
