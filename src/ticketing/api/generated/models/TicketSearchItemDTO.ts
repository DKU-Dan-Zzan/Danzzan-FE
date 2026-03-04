/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 티켓 검색 결과 항목
 */
export type TicketSearchItemDTO = {
    /**
     * 티켓 ID (user_tickets.id)
     */
    ticketId?: number;
    /**
     * 학생 학번
     */
    studentId?: string;
    /**
     * 학생 이름
     */
    name?: string;
    /**
     * 단과대학
     */
    college?: string;
    /**
     * 학과
     */
    major?: string;
    /**
     * 티켓 상태 (CONFIRMED / ISSUED)
     */
    status?: TicketSearchItemDTO.status;
    /**
     * 팔찌 지급 시각 (ISO-8601)
     */
    issuedAt?: string;
    /**
     * 지급 처리한 관리자 이름
     */
    issuerAdminName?: string;
};
export namespace TicketSearchItemDTO {
    /**
     * 티켓 상태 (CONFIRMED / ISSUED)
     */
    export enum status {
        CONFIRMED = 'CONFIRMED',
        ISSUED = 'ISSUED',
    }
}

