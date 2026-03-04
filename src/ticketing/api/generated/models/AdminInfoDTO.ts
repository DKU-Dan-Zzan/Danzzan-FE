/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 愿由ъ옄 ?뺣낫
 */
export type AdminInfoDTO = {
    /**
     * 愿由ъ옄 ID
     */
    id?: number;
    /**
     * 愿由ъ옄 ?대쫫
     */
    name?: string;
    /**
     * 愿由ъ옄 ?숇쾲
     */
    studentId?: string;
    /**
     * 沅뚰븳
     */
    role?: AdminInfoDTO.role;
};
export namespace AdminInfoDTO {
    /**
     * 沅뚰븳
     */
    export enum role {
        ROLE_USER = 'ROLE_USER',
        ROLE_ADMIN = 'ROLE_ADMIN',
    }
}

