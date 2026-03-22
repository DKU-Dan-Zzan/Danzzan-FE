// 역할: OpenAPI 생성 응답 래퍼 모델 ApiResponseAdminMeResponseDTO 타입을 정의합니다.
/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { AdminMeResponseDTO } from './AdminMeResponseDTO';
import type { ApiError } from './ApiError';
export type ApiResponseAdminMeResponseDTO = {
    success?: boolean;
    data?: AdminMeResponseDTO;
    error?: ApiError;
};

