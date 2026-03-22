import { buildLoginRedirectPath } from "@/lib/common/auth-redirect";

export const TICKETING_PATH = "/ticket/ticketing";

export const getTicketingNavigationTarget = (hasTicketingAccess: boolean) => {
  return hasTicketingAccess
    ? TICKETING_PATH
    : buildLoginRedirectPath("/ticket/login", TICKETING_PATH);
};
