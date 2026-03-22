// 역할: OpenAPI 기반 티켓팅 API 코드 생성 산출물로, 스펙 동기화 시 재생성됩니다.
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

