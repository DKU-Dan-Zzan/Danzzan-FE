// 역할: HTTP 계층에서 공통으로 사용하는 상수와 기본값을 정의한다.

export const JSON_CONTENT_TYPE = "application/json";

export const JSON_HEADERS = Object.freeze({
  "Content-Type": JSON_CONTENT_TYPE,
});
