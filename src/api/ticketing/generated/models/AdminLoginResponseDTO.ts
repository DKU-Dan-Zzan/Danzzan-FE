// 역할: OpenAPI 생성 모델 AdminLoginResponseDTO 타입을 정의합니다.
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

