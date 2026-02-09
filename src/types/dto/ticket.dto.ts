export interface TicketDto {
  id?: string | number;
  status?: string;
  eventName?: string;
  eventDate?: string;
  issuedAt?: string;
  seat?: string;
  qrCodeUrl?: string;
}

export interface TicketListResponseDto {
  items?: TicketDto[];
}
