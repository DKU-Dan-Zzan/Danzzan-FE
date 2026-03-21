import { resolveScopedRedirect } from "@/lib/common/auth-redirect";

export const MY_TICKET_PATH = "/ticket/my-ticket";
export const TICKETING_DEFAULT_PATH = "/ticket/ticketing";

export const getMyTicketNavigationTarget = (isStudentLoggedIn: boolean) =>
  isStudentLoggedIn
    ? MY_TICKET_PATH
    : `/ticket/login?redirect=${encodeURIComponent(MY_TICKET_PATH)}`;

export const resolveTicketingLoginRedirect = (redirectParam: string | null) => {
  return resolveScopedRedirect(redirectParam, {
    scope: "/ticket",
    fallback: TICKETING_DEFAULT_PATH,
  });
};
