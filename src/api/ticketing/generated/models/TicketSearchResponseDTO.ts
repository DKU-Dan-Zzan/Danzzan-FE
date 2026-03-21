/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { TicketSearchItemDTO } from './TicketSearchItemDTO';
/**
 * 학생 학번 기준 티켓 조회 응답
 */
export type TicketSearchResponseDTO = {
    /**
     * 조회 대상 공연 ID
     */
    eventId?: number;
    /**
     * 조회한 학생 학번
     */
    studentId?: string;
    /**
     * 티켓 검색 결과 목록
     */
    results?: Array<TicketSearchItemDTO>;
};

