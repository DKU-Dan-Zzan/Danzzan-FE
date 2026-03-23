// 역할: 마이티켓 화면 전환에 필요한 내비게이션 규칙을 제공한다.

export const MY_TICKET_PATH = "/ticket/my-ticket";

export const getMyTicketNavigationTarget = (isStudentLoggedIn: boolean) => {
  return isStudentLoggedIn
    ? MY_TICKET_PATH
    : `/ticket/login?redirect=${encodeURIComponent(MY_TICKET_PATH)}`;
};
