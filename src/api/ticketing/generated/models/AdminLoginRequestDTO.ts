// 역할: OpenAPI 기반 티켓팅 API 코드 생성 산출물로, 스펙 동기화 시 재생성됩니다.
/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 관리자 로그인 요청
 */
export type AdminLoginRequestDTO = {
    /**
     * 시스템 타입
     */
    system: AdminLoginRequestDTO.system;
    /**
     * 관리자 학번
     */
    studentId?: string;
    /**
     * 비밀번호
     */
    password?: string;
};
export namespace AdminLoginRequestDTO {
    /**
     * 시스템 타입
     */
    export enum system {
        DANSPOT = 'DANSPOT',
    }
}

