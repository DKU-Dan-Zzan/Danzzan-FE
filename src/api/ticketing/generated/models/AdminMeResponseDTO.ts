// 역할: OpenAPI 생성 모델 AdminMeResponseDTO 타입을 정의합니다.
/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 현재 로그인한 관리자 정보 응답
 */
export type AdminMeResponseDTO = {
    /**
     * 관리자 ID
     */
    adminId?: number;
    /**
     * 관리자 이름
     */
    adminName?: string;
    /**
     * 관리자 학번
     */
    studentId?: string;
    /**
     * 권한
     */
    role?: AdminMeResponseDTO.role;
};
export namespace AdminMeResponseDTO {
    /**
     * 권한
     */
    export enum role {
        ROLE_USER = 'ROLE_USER',
        ROLE_ADMIN = 'ROLE_ADMIN',
    }
}

