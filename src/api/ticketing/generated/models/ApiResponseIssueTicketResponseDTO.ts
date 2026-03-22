// 역할: OpenAPI 기반 티켓팅 API 코드 생성 산출물로, 스펙 동기화 시 재생성됩니다.
/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { ApiError } from './ApiError';
import type { IssueTicketResponseDTO } from './IssueTicketResponseDTO';
export type ApiResponseIssueTicketResponseDTO = {
    success?: boolean;
    data?: IssueTicketResponseDTO;
    error?: ApiError;
};

