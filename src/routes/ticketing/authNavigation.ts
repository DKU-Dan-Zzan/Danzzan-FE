export const MY_TICKET_PATH = "/ticket/myticket";
export const TICKETING_DEFAULT_PATH = "/ticket/ticketing";

export const getMyTicketNavigationTarget = (isStudentLoggedIn: boolean) =>
  isStudentLoggedIn
    ? MY_TICKET_PATH
    : `/ticket/login?redirect=${encodeURIComponent(MY_TICKET_PATH)}`;

const isTicketRouteSegment = (path: string) => /^\/ticket(?:\/|$|[?#])/.test(path);

export const resolveTicketingLoginRedirect = (redirectParam: string | null) => {
  const trimmed = redirectParam?.trim() ?? null;
  return trimmed && isTicketRouteSegment(trimmed)
    ? trimmed
    : TICKETING_DEFAULT_PATH;
};
