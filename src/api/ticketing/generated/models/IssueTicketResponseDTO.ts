// 역할: OpenAPI 생성 모델 IssueTicketResponseDTO 타입을 정의합니다.
/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 팔찌 지급 처리 응답
 */
export type IssueTicketResponseDTO = {
    /**
     * 티켓 ID
     */
    ticketId?: number;
    /**
     * 변경된 티켓 상태
     */
    status?: IssueTicketResponseDTO.status;
    /**
     * 팔찌 지급 시각 (ISO-8601)
     */
    issuedAt?: string;
    /**
     * 지급 처리 관리자 ID
     */
    issuerAdminId?: number;
    /**
     * 지급 처리 관리자 이름
     */
    issuerAdminName?: string;
};
export namespace IssueTicketResponseDTO {
    /**
     * 변경된 티켓 상태
     */
    export enum status {
        CONFIRMED = 'CONFIRMED',
        ISSUED = 'ISSUED',
    }
}

