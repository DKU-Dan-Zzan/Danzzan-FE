/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * ?꾩옱 濡쒓렇?명븳 愿由ъ옄 ?뺣낫 ?묐떟
 */
export type AdminMeResponseDTO = {
    /**
     * 愿由ъ옄 ID
     */
    adminId?: number;
    /**
     * 愿由ъ옄 ?대쫫
     */
    adminName?: string;
    /**
     * 愿由ъ옄 ?숇쾲
     */
    studentId?: string;
    /**
     * 沅뚰븳
     */
    role?: AdminMeResponseDTO.role;
};
export namespace AdminMeResponseDTO {
    /**
     * 沅뚰븳
     */
    export enum role {
        ROLE_USER = 'ROLE_USER',
        ROLE_ADMIN = 'ROLE_ADMIN',
    }
}

