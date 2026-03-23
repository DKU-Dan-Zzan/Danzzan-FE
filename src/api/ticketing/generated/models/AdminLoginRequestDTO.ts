// 역할: OpenAPI 생성 모델 AdminLoginRequestDTO 타입을 정의합니다.
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

