/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * ?붿컡 吏湲?泥섎━ ?묐떟
 */
export type IssueTicketResponseDTO = {
    /**
     * ?곗폆 ID
     */
    ticketId?: number;
    /**
     * 蹂寃쎈맂 ?곗폆 ?곹깭
     */
    status?: IssueTicketResponseDTO.status;
    /**
     * ?붿컡 吏湲??쒓컖 (ISO-8601)
     */
    issuedAt?: string;
    /**
     * 吏湲?泥섎━ 愿由ъ옄 ID
     */
    issuerAdminId?: number;
    /**
     * 吏湲?泥섎━ 愿由ъ옄 ?대쫫
     */
    issuerAdminName?: string;
};
export namespace IssueTicketResponseDTO {
    /**
     * 蹂寃쎈맂 ?곗폆 ?곹깭
     */
    export enum status {
        CONFIRMED = 'CONFIRMED',
        ISSUED = 'ISSUED',
    }
}

