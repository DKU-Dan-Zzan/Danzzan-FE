// 역할: 관리자 화면 공통 확인 다이얼로그의 상태 계약 타입을 정의합니다.
export type AdminConfirmDialogState = {
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => Promise<void> | void;
};
