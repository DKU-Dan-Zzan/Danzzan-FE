// 부스맵 페이지에서 사용하는 타입 모음

export type MapMode = "2D" | "3D";

export type BoothType = "EXPERIENCE" | "FOOD_TRUCK" | "FACILITY";
export type PrimaryFilter = "ALL" | "PUB" | BoothType;

export type SheetMode = "LIST" | "DETAIL";
export type SheetSnap = "PEEK" | "HALF" | "FULL";

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
  name: string;
  intro?: string;
  description?: string;
  instagram?: string;
};

export type SelectedItem =
  | { kind: "booth"; id: number }
  | { kind: "pub"; id: number }
  | { kind: "college"; id: number }
  | null;