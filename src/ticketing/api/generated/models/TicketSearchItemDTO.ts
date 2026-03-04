/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * ?곗폆 寃??寃곌낵 ??ぉ
 */
export type TicketSearchItemDTO = {
    /**
     * ?곗폆 ID (user_tickets.id)
     */
    ticketId?: number;
    /**
     * ?숈깮 ?숇쾲
     */
    studentId?: string;
    /**
     * ?숈깮 ?대쫫
     */
    name?: string;
    /**
     * ?④낵???     */
    college?: string;
    /**
     * ?숆낵
     */
    major?: string;
    /**
     * ?곗폆 ?곹깭 (CONFIRMED / ISSUED)
     */
    status?: TicketSearchItemDTO.status;
    /**
     * ?붿컡 吏湲??쒓컖 (ISO-8601)
     */
    issuedAt?: string;
    /**
     * 吏湲?泥섎━??愿由ъ옄 ?대쫫
     */
    issuerAdminName?: string;
};
export namespace TicketSearchItemDTO {
    /**
     * ?곗폆 ?곹깭 (CONFIRMED / ISSUED)
     */
    export enum status {
        CONFIRMED = 'CONFIRMED',
        ISSUED = 'ISSUED',
    }
}

