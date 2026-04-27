// 역할: 인증 도메인에서 공유하는 사용자/세션 모델 타입을 정의한다.

export type UserRole = "student" | "admin";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number | null;
}

export interface AuthCredentials {
  studentId: string;
  password: string;
}

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole | "unknown";
  department: string;
  studentId: string;
  college: string;
  naverId?: string;
}

export interface AuthSession {
  tokens: AuthTokens;
  user: AuthUser | null;
}
