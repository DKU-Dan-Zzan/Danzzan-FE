import { createHttpClient } from "@/api/httpClient";
import { mapTicketListDtoToModel } from "@/mappers/ticketMapper";
import { authStore } from "@/store/authStore";
import type { TicketListResponseDto } from "@/types/dto/ticket.dto";
import type { Ticket } from "@/types/model/ticket.model";
import { env, requireEnv } from "@/utils/env";

const getTicketingClient = () =>
  createHttpClient({
    baseUrl: requireEnv(env.ticketingApiBaseUrl, "VITE_TICKETING_API_BASE_URL"),
    getAccessToken: authStore.getAccessToken,
  });

export const ticketApi = {
  getMyTickets: async (): Promise<Ticket[]> => {
    const client = getTicketingClient();
    // TODO: Confirm ticketing endpoint for student ticket list.
    const dto = await client.get<TicketListResponseDto>("/tickets/me");
    return mapTicketListDtoToModel(dto ?? {});
  },
};
