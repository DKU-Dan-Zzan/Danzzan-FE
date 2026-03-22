// 역할: OpenAPI 기반 티켓팅 API 코드 생성 산출물로, 스펙 동기화 시 재생성됩니다.
/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 공연 요약 정보
 */
export type EventSummaryDTO = {
    /**
     * 공연 ID (festival_events.id)
     */
    eventId?: number;
    /**
     * 공연/운영 제목 (festival_events.title)
     */
    title?: string;
    /**
     * 화면 표기용 DAY 라벨
     */
    dayLabel?: string;
    /**
     * 공연 날짜 (YYYY-MM-DD)
     */
    eventDate?: string;
    /**
     * 티켓팅 상태
     */
    ticketingStatus?: EventSummaryDTO.ticketingStatus;
    /**
     * 정원 (festival_events.total_capacity)
     */
    totalCapacity?: number;
};
export namespace EventSummaryDTO {
    /**
     * 티켓팅 상태
     */
    export enum ticketingStatus {
        READY = 'READY',
        OPEN = 'OPEN',
        CLOSED = 'CLOSED',
    }
}

