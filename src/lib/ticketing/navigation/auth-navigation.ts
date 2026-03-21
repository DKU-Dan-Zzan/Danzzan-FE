import { MY_TICKET_PATH, getMyTicketNavigationTarget } from "@/lib/common/my-ticket-navigation";
import { resolveScopedRedirect } from "@/lib/common/auth-redirect";

export const TICKETING_DEFAULT_PATH = "/ticket/ticketing";

export { MY_TICKET_PATH, getMyTicketNavigationTarget };

export const resolveTicketingLoginRedirect = (redirectParam: string | null) => {
  return resolveScopedRedirect(redirectParam, {
    scope: "/ticket",
    fallback: TICKETING_DEFAULT_PATH,
  });
};
