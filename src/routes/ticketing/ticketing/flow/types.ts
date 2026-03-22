import type { Dispatch, SetStateAction } from "react";

export type TicketingStep =
  | "home"
  | "list"
  | "waiting"
  | "in-progress"
  | "reserving"
  | "soldout"
  | "already"
  | "success";

export type SetStringState = Dispatch<SetStateAction<string>>;
export type SetNullableStringState = Dispatch<SetStateAction<string | null>>;
export type SetTicketingStepState = Dispatch<SetStateAction<TicketingStep>>;
