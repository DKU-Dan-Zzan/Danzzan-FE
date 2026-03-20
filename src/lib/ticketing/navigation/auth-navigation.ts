import { resolveScopedRedirect } from "@/routes/common/authGuard";

export const MY_TICKET_PATH = "/ticket/myticket";
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
