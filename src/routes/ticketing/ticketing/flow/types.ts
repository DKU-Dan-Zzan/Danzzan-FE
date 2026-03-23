// 역할: 티켓팅 플로우 스텝과 상태 setter 타입 계약을 정의합니다.
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
