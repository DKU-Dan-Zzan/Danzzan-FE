// 역할: OpenAPI 생성 응답 DTO ResponseVerifyStudentDto 타입을 정의합니다.
/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
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

