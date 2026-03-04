/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 공연별 팔찌 지급 통계 응답
 */
export type EventStatsResponseDTO = {
    /**
     * 공연 ID
     */
    eventId?: number;
    /**
     * 공연 제목
     */
    title?: string;
    /**
     * 공연 날짜 (YYYY-MM-DD)
     */
    eventDate?: string;
    /**
     * 정원
     */
    totalCapacity?: number;
    /**
     * 해당 공연에 대해 발급된 티켓 수
     */
    totalTickets?: number;
    /**
     * status=CONFIRMED 티켓 수
     */
    ticketsConfirmed?: number;
    /**
     * status=ISSUED 티켓 수
     */
    ticketsIssued?: number;
    /**
     * 지급 완료 비율(%)
     */
    issueRate?: number;
    /**
     * 남은 수용 가능 인원
     */
    remainingCapacity?: number;
};

