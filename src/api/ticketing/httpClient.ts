// 역할: 티켓팅 API 공통 HTTP 클라이언트(기본 URL, 헤더, 오류 처리)를 구성합니다.
export {
  HttpError,
  createHttpClient,
  type RequestOptions,
  type RequestParams,
} from "@/api/common/httpClient";
