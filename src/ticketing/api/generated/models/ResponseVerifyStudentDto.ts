/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ResponseScrappedStudentInfoDto } from './ResponseScrappedStudentInfoDto';
/**
 * 단국대 학생 인증 응답
 */
export type ResponseVerifyStudentDto = {
    /**
     * 회원가입용 토큰
     */
    signupToken?: string;
    /**
     * 학생 정보
     */
    student?: ResponseScrappedStudentInfoDto;
};

