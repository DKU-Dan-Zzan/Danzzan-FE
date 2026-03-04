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
     * ?뚯썝媛???꾨즺
     * 1?④퀎?먯꽌 諛쏆? ?좏겙?쇰줈 鍮꾨?踰덊샇瑜??ㅼ젙?섏뿬 ?뚯썝媛???꾨즺
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
     * ?좏겙 ?щ컻湲?     * Access Token 留뚮즺 ??Refresh Token?쇰줈 ???좏겙 諛쒓툒
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
     * 濡쒓렇??     * ?숇쾲怨?鍮꾨?踰덊샇濡?濡쒓렇??     * @returns ResponseLoginDto OK
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
     * ?숈깮 ?몄쬆
     * ?④뎅? ?ы꽭 ID/PW濡??숈깮 ?몄쬆 ???뚯썝媛???좏겙 諛쒓툒
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
     * 愿由ъ옄 濡쒓렇?꾩썐
     * ?꾩떆 ?좏겙??臾댄슚?뷀븯??濡쒓렇?꾩썐 泥섎━
     * @returns ApiResponse 濡쒓렇?꾩썐 ?깃났
     * @throws ApiError
     */
    public static logout(): CancelablePromise<ApiResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/admin/auth/logout',
            errors: {
                401: `?몄쬆 ?ㅽ뙣`,
            },
        });
    }
    /**
     * 愿由ъ옄 濡쒓렇??     * 愿由ъ옄 ?숇쾲怨?鍮꾨?踰덊샇濡?濡쒓렇?????꾩떆 ?좏겙 諛쒓툒
     * @returns ApiResponse 濡쒓렇???깃났
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
                401: `?몄쬆 ?ㅽ뙣(鍮꾨?踰덊샇 ?ㅻ쪟)`,
                403: `愿由ъ옄 沅뚰븳 ?놁쓬`,
                404: `愿由ъ옄 怨꾩젙 ?놁쓬`,
            },
        });
    }
    /**
     * ?붿컡 吏湲?泥섎━
     * ?곗폆 ?곹깭瑜?ISSUED濡?蹂寃쏀븯怨?吏湲??쒓컖 諛?吏湲?愿由ъ옄 湲곕줉
     * @returns ApiResponse ?붿컡 吏湲?泥섎━ ?깃났
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
                400: `?붿껌 ?뺤떇 ?ㅻ쪟`,
                401: `?몄쬆 ?ㅽ뙣`,
                403: `沅뚰븳 ?놁쓬`,
                404: `?곗폆 ?먮뒗 怨듭뿰??議댁옱?섏? ?딆쓬`,
                409: `?대? 吏湲??꾨즺???곗폆`,
                500: `?쒕쾭 ?ㅻ쪟`,
            },
        });
    }
    /**
     * ?숈깮 ?뺣낫 議고쉶
     * ?뚯썝媛???좏겙?쇰줈 ?몄쬆???숈깮 ?뺣낫 議고쉶
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
     * ?붿컡諛곕????怨듭뿰??湲곗??쇰줈 紐⑸줉 議고쉶
     * JWT ?몄쬆???꾩슂??愿由ъ옄 ?꾩슜 紐⑸줉 議고쉶 API
     * @returns ApiResponse 紐⑸줉 議고쉶 ?깃났
     * @throws ApiError
     */
    public static listEvents(): CancelablePromise<ApiResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/events',
            errors: {
                401: `?몄쬆 ?꾩슂`,
                403: `沅뚰븳 ?놁쓬`,
            },
        });
    }
    /**
     * ?숈깮 ?숇쾲 湲곗? ?곗폆 議고쉶
     * ?뱀젙 怨듭뿰?먯꽌 ?숈깮 ?숇쾲?쇰줈 ?곗폆 ?뺣낫瑜?議고쉶
     * @returns ApiResponse ?곗폆 議고쉶 ?깃났
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
                400: `studentId ?꾨씫 ?먮뒗 ?뺤떇 ?ㅻ쪟`,
                401: `?몄쬆 ?ㅽ뙣`,
                403: `沅뚰븳 ?놁쓬`,
                404: `?대떦 怨듭뿰?먯꽌 ?대떦 ?숇쾲???곗폆??議댁옱?섏? ?딆쓬`,
                500: `?쒕쾭 ?ㅻ쪟`,
            },
        });
    }
    /**
     * ?붿컡 吏湲??듦퀎 議고쉶
     * 怨듭뿰蹂??꾩껜 ?곗폆 ??諛??붿컡 吏湲??꾨즺 ???듦퀎 議고쉶
     * @returns ApiResponse ?듦퀎 議고쉶 ?깃났
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
                401: `?몄쬆 ?ㅽ뙣`,
                403: `沅뚰븳 ?놁쓬`,
                404: `?대떦 怨듭뿰(eventId)??議댁옱?섏? ?딆쓬`,
                500: `?쒕쾭 ?ㅻ쪟`,
            },
        });
    }
    /**
     * ?꾩옱 濡쒓렇?명븳 愿由ъ옄 ?뺣낫 議고쉶
     * Authorization ?ㅻ뜑???꾩떆 ?좏겙?쇰줈 愿由ъ옄 怨꾩젙 ?뺣낫 諛섑솚
     * @returns ApiResponse 議고쉶 ?깃났
     * @throws ApiError
     */
    public static me(): CancelablePromise<ApiResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/auth/me',
            errors: {
                401: `?몄쬆 ?ㅽ뙣`,
                403: `沅뚰븳 ?놁쓬`,
            },
        });
    }
}
