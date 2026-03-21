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
}

export interface AuthSession {
  tokens: AuthTokens;
  user: AuthUser | null;
}
