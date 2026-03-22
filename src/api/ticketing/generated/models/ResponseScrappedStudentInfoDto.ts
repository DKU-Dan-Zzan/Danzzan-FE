// 역할: OpenAPI 생성 응답 DTO ResponseScrappedStudentInfoDto 타입을 정의합니다.
/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
/**
 * 단국대 학생 인증 결과 - 학생 정보
 */
export type ResponseScrappedStudentInfoDto = {
    /**
     * 학생 이름
     */
    studentName?: string;
    /**
     * 학번
     */
    studentId?: string;
    /**
     * 단과대학
     */
    college?: string;
    /**
     * 학과
     */
    major?: string;
};

