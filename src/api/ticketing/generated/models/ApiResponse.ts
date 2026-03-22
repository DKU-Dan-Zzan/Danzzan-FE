// 역할: OpenAPI 생성 응답 래퍼 모델 ApiResponse 타입을 정의합니다.
/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiError } from './ApiError';
export type ApiResponse = {
    success?: boolean;
    data?: Record<string, any>;
    error?: ApiError;
};

