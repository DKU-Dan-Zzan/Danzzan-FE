export const MY_TICKET_PATH = "/ticket/my-ticket";

export const getMyTicketNavigationTarget = (isStudentLoggedIn: boolean) => {
  return isStudentLoggedIn
    ? MY_TICKET_PATH
    : `/ticket/login?redirect=${encodeURIComponent(MY_TICKET_PATH)}`;
};
