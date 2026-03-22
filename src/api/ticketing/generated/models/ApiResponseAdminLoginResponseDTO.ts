// 역할: OpenAPI 생성 응답 래퍼 모델 ApiResponseAdminLoginResponseDTO 타입을 정의합니다.
/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { AdminLoginResponseDTO } from './AdminLoginResponseDTO';
import type { ApiError } from './ApiError';
export type ApiResponseAdminLoginResponseDTO = {
    success?: boolean;
    data?: AdminLoginResponseDTO;
    error?: ApiError;
};

