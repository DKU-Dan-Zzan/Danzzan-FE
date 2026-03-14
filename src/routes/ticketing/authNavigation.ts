export const MY_TICKET_PATH = "/ticket/myticket";
export const TICKETING_DEFAULT_PATH = "/ticket/ticketing";

export const getMyTicketNavigationTarget = (isStudentLoggedIn: boolean) =>
  isStudentLoggedIn
    ? MY_TICKET_PATH
    : `/ticket/login?redirect=${encodeURIComponent(MY_TICKET_PATH)}`;

const isTicketRouteSegment = (path: string) => /^\/ticket(?:\/|$|[?#])/.test(path);

const isSafeTicketRedirect = (rawPath: string): boolean => {
  try {
    const url = new URL(rawPath, "http://dummy");
    const pathname = url.pathname;

    if (!isTicketRouteSegment(pathname)) {
      return false;
    }

    const segments = pathname.split("/");
    for (const segment of segments) {
      if (!segment) {
        continue;
      }
      if (segment === "." || segment === "..") {
        return false;
      }
      const decoded = decodeURIComponent(segment);
      if (decoded === "." || decoded === "..") {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
};

export const resolveTicketingLoginRedirect = (redirectParam: string | null) => {
  const trimmed = redirectParam?.trim() ?? null;
  return trimmed && isSafeTicketRedirect(trimmed)
    ? trimmed
    : TICKETING_DEFAULT_PATH;
};
