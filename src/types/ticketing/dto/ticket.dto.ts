// 역할: 티켓팅 도메인 타입 계약(DTO/Model)을 정의하는 모듈입니다.
export interface TicketDto {
  id?: string | number;
  status?: string;
  eventName?: string;
  eventDate?: string;
  issuedAt?: string;
  seat?: string;
  qrCodeUrl?: string;
  queueNumber?: string | number;
  wristbandIssued?: boolean;
  contact?: string;
  venue?: string;
  eventDescription?: string;
}

export interface TicketListResponseDto {
  items?: TicketDto[];
}

export interface TicketEventDto {
  id?: string | number;
  title?: string;
  eventName?: string;
  eventDate?: string;
  eventTime?: string;
  ticketOpenAt?: string;
  openAt?: string;
  status?: string;
  remainingCount?: string | number;
  totalCount?: string | number;
}

export interface TicketEventListResponseDto {
  items?: TicketEventDto[];
}

export interface TicketQueueEnterResponseDto {
  status?: string;
  remaining?: string | number | null;
  queuePosition?: number | null;
  mySequence?: string | number | null;
  aheadCount?: string | number | null;
  estimatedWaitSeconds?: string | number | null;
  readyUntil?: string | number | null;
  admissionState?: string | null;
}

export interface TicketQueueStatusResponseDto {
  status?: string;
  queuePosition?: number | null;
  mySequence?: string | number | null;
  aheadCount?: string | number | null;
  estimatedWaitSeconds?: string | number | null;
  readyUntil?: string | number | null;
  admissionState?: string | null;
}

export type TicketReservationResponseDto = TicketDto & {
  ticket?: TicketDto;
  queueNumber?: string | number;
};
