// 역할: OpenAPI 기반 티켓팅 API 코드 생성 산출물로, 스펙 동기화 시 재생성됩니다.
/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { EventSummaryDTO } from './EventSummaryDTO';
/**
 * 팔찌 배부 대상 공연 목록 응답
 */
export type EventListResponseDTO = {
    /**
     * 팔찌 배부 대상 공연 목록
     */
    events?: Array<EventSummaryDTO>;
};

