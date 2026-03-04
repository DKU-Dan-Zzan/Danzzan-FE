/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 怨듭뿰 ?붿빟 ?뺣낫
 */
export type EventSummaryDTO = {
    /**
     * 怨듭뿰 ID (festival_events.id)
     */
    eventId?: number;
    /**
     * 怨듭뿰/?댁쁺 ?쒕ぉ (festival_events.title)
     */
    title?: string;
    /**
     * ?붾㈃ ?쒓린??DAY ?쇰꺼
     */
    dayLabel?: string;
    /**
     * 怨듭뿰 ?좎쭨 (YYYY-MM-DD)
     */
    eventDate?: string;
    /**
     * ?곗폆???곹깭
     */
    ticketingStatus?: EventSummaryDTO.ticketingStatus;
    /**
     * ?뺤썝 (festival_events.total_capacity)
     */
    totalCapacity?: number;
};
export namespace EventSummaryDTO {
    /**
     * ?곗폆???곹깭
     */
    export enum ticketingStatus {
        READY = 'READY',
        OPEN = 'OPEN',
        CLOSED = 'CLOSED',
    }
}

