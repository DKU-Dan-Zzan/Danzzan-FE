/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AdminInfoDTO } from './AdminInfoDTO';
/**
 * 愿由ъ옄 濡쒓렇???묐떟
 */
export type AdminLoginResponseDTO = {
    /**
     * ?꾩떆 access token
     */
    accessToken?: string;
    /**
     * 愿由ъ옄 ?뺣낫
     */
    admin?: AdminInfoDTO;
    /**
     * ?쒖뒪?????     */
    system?: AdminLoginResponseDTO.system;
};
export namespace AdminLoginResponseDTO {
    /**
     * ?쒖뒪?????     */
    export enum system {
        DANSPOT = 'DANSPOT',
    }
}

