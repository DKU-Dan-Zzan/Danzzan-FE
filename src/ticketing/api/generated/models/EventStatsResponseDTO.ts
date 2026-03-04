/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 怨듭뿰蹂??붿컡 吏湲??듦퀎 ?묐떟
 */
export type EventStatsResponseDTO = {
    /**
     * 怨듭뿰 ID
     */
    eventId?: number;
    /**
     * 怨듭뿰 ?쒕ぉ
     */
    title?: string;
    /**
     * 怨듭뿰 ?좎쭨 (YYYY-MM-DD)
     */
    eventDate?: string;
    /**
     * ?뺤썝
     */
    totalCapacity?: number;
    /**
     * ?대떦 怨듭뿰?????諛쒓툒???곗폆 ??     */
    totalTickets?: number;
    /**
     * status=CONFIRMED ?곗폆 ??     */
    ticketsConfirmed?: number;
    /**
     * status=ISSUED ?곗폆 ??     */
    ticketsIssued?: number;
    /**
     * 吏湲??꾨즺 鍮꾩쑉(%)
     */
    issueRate?: number;
    /**
     * ?⑥? ?섏슜 媛???몄썝
     */
    remainingCapacity?: number;
};

