// 역할: 인증 상태에 따라 티켓팅 라우트 이동 경로를 계산하는 네비게이션 규칙을 제공합니다.
import { MY_TICKET_PATH, getMyTicketNavigationTarget } from "@/lib/common/my-ticket-navigation";
import { resolveScopedRedirect } from "@/lib/common/auth-redirect";
import { TICKETING_PATH } from "@/lib/common/ticketing-navigation";

export const TICKETING_DEFAULT_PATH = TICKETING_PATH;

export { MY_TICKET_PATH, getMyTicketNavigationTarget };

export const resolveTicketingLoginRedirect = (redirectParam: string | null) => {
  return resolveScopedRedirect(redirectParam, {
    scope: "/ticket",
    fallback: TICKETING_DEFAULT_PATH,
  });
};
