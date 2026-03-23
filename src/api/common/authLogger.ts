// 역할: 인증 요청/재시도 과정을 추적하기 위한 로깅 유틸을 제공한다.

type AuthLogValue = string | number | boolean | null | undefined;

type AuthLogContext = Record<string, AuthLogValue>;

const AUTH_LOG_PREFIX = "[auth]";

export const maskToken = (token?: string | null): string | null => {
  if (!token) {
    return null;
  }

  if (token.length <= 12) {
    return `${token.slice(0, 3)}***${token.slice(-2)}`;
  }

  return `${token.slice(0, 6)}...${token.slice(-4)}`;
};

const sanitizeContext = (context?: AuthLogContext): AuthLogContext | undefined => {
  if (!context) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => {
      if (!key.toLowerCase().includes("token")) {
        return [key, value];
      }

      return [key, typeof value === "string" ? maskToken(value) : value];
    }),
  );
};

export const logAuthWarn = (event: string, context?: AuthLogContext): void => {
  const payload = sanitizeContext(context);
  if (payload) {
    console.warn(`${AUTH_LOG_PREFIX} ${event}`, payload);
    return;
  }
  console.warn(`${AUTH_LOG_PREFIX} ${event}`);
};
