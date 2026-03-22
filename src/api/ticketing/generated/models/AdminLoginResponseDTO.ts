// 역할: OpenAPI 기반 티켓팅 API 코드 생성 산출물로, 스펙 동기화 시 재생성됩니다.
/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AdminInfoDTO } from './AdminInfoDTO';
/**
 * 관리자 로그인 응답
 */
export type AdminLoginResponseDTO = {
    /**
     * 임시 access token
     */
    accessToken?: string;
    /**
     * 관리자 정보
     */
    admin?: AdminInfoDTO;
    /**
     * 시스템 타입
     */
    system?: AdminLoginResponseDTO.system;
};
export namespace AdminLoginResponseDTO {
    /**
     * 시스템 타입
     */
    export enum system {
        DANSPOT = 'DANSPOT',
    }
}

