/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 관리자 정보
 */
export type AdminInfoDTO = {
    /**
     * 관리자 ID
     */
    id?: number;
    /**
     * 관리자 이름
     */
    name?: string;
    /**
     * 관리자 학번
     */
    studentId?: string;
    /**
     * 권한
     */
    role?: AdminInfoDTO.role;
};
export namespace AdminInfoDTO {
    /**
     * 권한
     */
    export enum role {
        ROLE_USER = 'ROLE_USER',
        ROLE_ADMIN = 'ROLE_ADMIN',
    }
}

