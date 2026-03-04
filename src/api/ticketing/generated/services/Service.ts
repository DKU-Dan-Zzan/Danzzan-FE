/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AdminLoginRequestDTO } from '../models/AdminLoginRequestDTO';
import type { ApiResponse } from '../models/ApiResponse';
import type { IssueTicketRequestDTO } from '../models/IssueTicketRequestDTO';
import type { RequestDkuStudentDto } from '../models/RequestDkuStudentDto';
import type { RequestLoginDto } from '../models/RequestLoginDto';
import type { RequestRefreshTokenDto } from '../models/RequestRefreshTokenDto';
import type { RequestSignupDto } from '../models/RequestSignupDto';
import type { ResponseLoginDto } from '../models/ResponseLoginDto';
import type { ResponseRefreshTokenDto } from '../models/ResponseRefreshTokenDto';
import type { ResponseScrappedStudentInfoDto } from '../models/ResponseScrappedStudentInfoDto';
import type { ResponseVerifyStudentDto } from '../models/ResponseVerifyStudentDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class Service {
    /**
     * 회원가입 완료
     * 1단계에서 받은 토큰으로 비밀번호를 설정하여 회원가입 완료
     * @returns any OK
     * @throws ApiError
     */
    public static signup({
        signupToken,
        requestBody,
    }: {
        signupToken: string,
        requestBody: RequestSignupDto,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/user/{signup-token}',
            path: {
                'signup-token': signupToken,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * 토큰 재발급
     * Access Token 만료 시 Refresh Token으로 새 토큰 발급
     * @returns ResponseRefreshTokenDto OK
     * @throws ApiError
     */
    public static refreshToken({
        requestBody,
    }: {
        requestBody: RequestRefreshTokenDto,
    }): CancelablePromise<ResponseRefreshTokenDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/user/reissue',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * 로그인
     * 학번과 비밀번호로 로그인
     * @returns ResponseLoginDto OK
     * @throws ApiError
     */
    public static login({
        requestBody,
    }: {
        requestBody: RequestLoginDto,
    }): CancelablePromise<ResponseLoginDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/user/login',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * 학생 인증
     * 단국대 포털 ID/PW로 학생 인증 후 회원가입 토큰 발급
     * @returns ResponseVerifyStudentDto OK
     * @throws ApiError
     */
    public static verifyStudent({
        requestBody,
    }: {
        requestBody: RequestDkuStudentDto,
    }): CancelablePromise<ResponseVerifyStudentDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/user/dku/verify',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * 관리자 로그아웃
     * 임시 토큰을 무효화하여 로그아웃 처리
     * @returns ApiResponse 로그아웃 성공
     * @throws ApiError
     */
    public static logout(): CancelablePromise<ApiResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/admin/auth/logout',
            errors: {
                401: `인증 실패`,
            },
        });
    }
    /**
     * 관리자 로그인
     * 관리자 학번과 비밀번호로 로그인 후 임시 토큰 발급
     * @returns ApiResponse 로그인 성공
     * @throws ApiError
     */
    public static login1({
        requestBody,
    }: {
        requestBody: AdminLoginRequestDTO,
    }): CancelablePromise<ApiResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/admin/auth/login',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `인증 실패(비밀번호 오류)`,
                403: `관리자 권한 없음`,
                404: `관리자 계정 없음`,
            },
        });
    }
    /**
     * 팔찌 지급 처리
     * 티켓 상태를 ISSUED로 변경하고 지급 시각 및 지급 관리자 기록
     * @returns ApiResponse 팔찌 지급 처리 성공
     * @throws ApiError
     */
    public static issueTicket({
        eventId,
        ticketId,
        requestBody,
    }: {
        eventId: number,
        ticketId: number,
        requestBody?: IssueTicketRequestDTO,
    }): CancelablePromise<ApiResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/admin/events/{eventId}/tickets/{ticketId}/issue',
            path: {
                'eventId': eventId,
                'ticketId': ticketId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `요청 형식 오류`,
                401: `인증 실패`,
                403: `권한 없음`,
                404: `티켓 또는 공연이 존재하지 않음`,
                409: `이미 지급 완료된 티켓`,
                500: `서버 오류`,
            },
        });
    }
    /**
     * 학생 정보 조회
     * 회원가입 토큰으로 인증된 학생 정보 조회
     * @returns ResponseScrappedStudentInfoDto OK
     * @throws ApiError
     */
    public static getStudentInfo({
        signupToken,
    }: {
        signupToken: string,
    }): CancelablePromise<ResponseScrappedStudentInfoDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/user/dku/{signup-token}',
            path: {
                'signup-token': signupToken,
            },
        });
    }
    /**
     * 팔찌배부대상 공연일 기준으로 목록 조회
     * JWT 인증이 필요한 관리자 전용 목록 조회 API
     * @returns ApiResponse 목록 조회 성공
     * @throws ApiError
     */
    public static listEvents(): CancelablePromise<ApiResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/events',
            errors: {
                401: `인증 필요`,
                403: `권한 없음`,
            },
        });
    }
    /**
     * 학생 학번 기준 티켓 조회
     * 특정 공연에서 학생 학번으로 티켓 정보를 조회
     * @returns ApiResponse 티켓 조회 성공
     * @throws ApiError
     */
    public static searchTickets({
        eventId,
        studentId,
    }: {
        eventId: number,
        studentId: string,
    }): CancelablePromise<ApiResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/events/{eventId}/tickets/search',
            path: {
                'eventId': eventId,
            },
            query: {
                'studentId': studentId,
            },
            errors: {
                400: `studentId 누락 또는 형식 오류`,
                401: `인증 실패`,
                403: `권한 없음`,
                404: `해당 공연에서 해당 학번의 티켓이 존재하지 않음`,
                500: `서버 오류`,
            },
        });
    }
    /**
     * 팔찌 지급 통계 조회
     * 공연별 전체 티켓 수 및 팔찌 지급 완료 수 통계 조회
     * @returns ApiResponse 통계 조회 성공
     * @throws ApiError
     */
    public static getEventStats({
        eventId,
    }: {
        eventId: number,
    }): CancelablePromise<ApiResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/events/{eventId}/stats',
            path: {
                'eventId': eventId,
            },
            errors: {
                401: `인증 실패`,
                403: `권한 없음`,
                404: `해당 공연(eventId)이 존재하지 않음`,
                500: `서버 오류`,
            },
        });
    }
    /**
     * 현재 로그인한 관리자 정보 조회
     * Authorization 헤더의 임시 토큰으로 관리자 계정 정보 반환
     * @returns ApiResponse 조회 성공
     * @throws ApiError
     */
    public static me(): CancelablePromise<ApiResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/auth/me',
            errors: {
                401: `인증 실패`,
                403: `권한 없음`,
            },
        });
    }
}
