// 역할: OpenAPI 생성 응답 래퍼 모델 ApiResponseEventStatsResponseDTO 타입을 정의합니다.
/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { ApiError } from './ApiError';
import type { EventStatsResponseDTO } from './EventStatsResponseDTO';
export type ApiResponseEventStatsResponseDTO = {
    success?: boolean;
    data?: EventStatsResponseDTO;
    error?: ApiError;
};

