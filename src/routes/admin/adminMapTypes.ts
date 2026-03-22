export type EditorMode = "idle" | "booth" | "college";

export type SelectedItem =
  | { kind: "booth"; id: number }
  | { kind: "college"; id: number }
  | null;
