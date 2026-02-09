import type { TicketDto, TicketListResponseDto } from "@/types/dto/ticket.dto";
import type { Ticket, TicketStatus } from "@/types/model/ticket.model";

const mapTicketStatus = (status?: string): TicketStatus => {
  switch (status) {
    case "issued":
    case "used":
    case "cancelled":
      return status;
    default:
      return "unknown";
  }
};

export const mapTicketDtoToModel = (dto: TicketDto): Ticket => {
  return {
    id: dto.id?.toString() ?? "",
    status: mapTicketStatus(dto.status),
    eventName: dto.eventName ?? "",
    eventDate: dto.eventDate ?? "",
    issuedAt: dto.issuedAt ?? "",
    seat: dto.seat ?? "",
    qrCodeUrl: dto.qrCodeUrl ?? "",
  };
};

export const mapTicketListDtoToModel = (
  dto: TicketListResponseDto,
): Ticket[] => {
  const items = dto.items ?? [];
  return items.map((item) => mapTicketDtoToModel(item));
};
