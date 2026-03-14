export const MY_TICKET_PATH = "/ticket/myticket";
export const TICKETING_DEFAULT_PATH = "/ticket/ticketing";

export const getMyTicketNavigationTarget = (isStudentLoggedIn: boolean) =>
  isStudentLoggedIn
    ? MY_TICKET_PATH
    : `/ticket/login?redirect=${encodeURIComponent(MY_TICKET_PATH)}`;

export const resolveTicketingLoginRedirect = (redirectParam: string | null) =>
  redirectParam?.startsWith("/ticket") ? redirectParam : TICKETING_DEFAULT_PATH;
