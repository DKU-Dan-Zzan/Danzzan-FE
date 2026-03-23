// 역할: Enter Queue 변경 요청과 후속 상태 동기화를 캡슐화한 훅이다.

import { ticketApi } from "@/api/ticketing/ticketApi";
import { useAppMutation } from "@/lib/query";

export const useEnterQueueMutation = () => {
  return useAppMutation({
    mutationFn: async (eventId: string) => ticketApi.enterTicketQueue(eventId),
  });
};
