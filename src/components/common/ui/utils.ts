// 역할: 공용 UI 레이어에서 사용하는 class 병합 유틸리티를 제공합니다.
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
