// 역할: OpenAPI 생성 응답 래퍼 모델 ApiResponseAdminLogoutResponseDTO 타입을 정의합니다.
/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { AdminLogoutResponseDTO } from './AdminLogoutResponseDTO';
import type { ApiError } from './ApiError';
export type ApiResponseAdminLogoutResponseDTO = {
    success?: boolean;
    data?: AdminLogoutResponseDTO;
    error?: ApiError;
};

