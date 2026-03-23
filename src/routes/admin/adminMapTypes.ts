// 역할: 관리자 지도 편집 모드와 선택 상태 타입을 정의합니다.
export type EditorMode = "idle" | "booth" | "college";

export type SelectedItem =
  | { kind: "booth"; id: number }
  | { kind: "college"; id: number }
  | null;
