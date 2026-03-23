// 역할: 티켓팅 플로우 단계별 이동 경로 계산 로직을 제공한다.

import { buildLoginRedirectPath } from "@/lib/common/auth-redirect";

export const TICKETING_PATH = "/ticket/ticketing";

export const getTicketingNavigationTarget = (hasTicketingAccess: boolean) => {
  return hasTicketingAccess
    ? TICKETING_PATH
    : buildLoginRedirectPath("/ticket/login", TICKETING_PATH);
};
