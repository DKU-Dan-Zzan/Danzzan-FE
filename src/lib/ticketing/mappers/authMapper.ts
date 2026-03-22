// 역할: 인증 API 응답을 세션 도메인 모델로 매핑합니다.
import type { AuthLoginResponseDto } from "@/types/ticketing/dto/auth.dto";
import type { AuthSession, AuthTokens, AuthUser } from "@/types/ticketing/model/auth.model";

const mapUserRole = (role?: string): AuthUser["role"] => {
  if (role === "student" || role === "admin") {
    return role;
  }
  return "unknown";
};

export const mapAuthUserDto = (dto?: AuthLoginResponseDto["user"]): AuthUser | null => {
  if (!dto) {
    return null;
  }

  return {
    id: dto.id ?? "",
    name: dto.name ?? "",
    role: mapUserRole(dto.role),
    department: dto.department ?? "",
    studentId: dto.studentId ?? "",
    college: dto.college ?? "",
  };
};

const mapAuthTokens = (dto: AuthLoginResponseDto): AuthTokens => {
  return {
    accessToken: dto.tokens?.accessToken ?? dto.accessToken ?? "",
    refreshToken: dto.tokens?.refreshToken ?? dto.refreshToken ?? "",
    expiresIn: dto.tokens?.expiresIn ?? dto.expiresIn ?? null,
  };
};

type ApiEnvelope<T> = {
  data?: T | null;
} & Record<string, unknown>;

const unwrapAuthLoginDto = (
  dto: AuthLoginResponseDto | ApiEnvelope<AuthLoginResponseDto>,
): AuthLoginResponseDto => {
  if (!dto || typeof dto !== "object") {
    return {};
  }

  const data = (dto as ApiEnvelope<AuthLoginResponseDto>).data;
  if (data && typeof data === "object") {
    return data;
  }

  return dto as AuthLoginResponseDto;
};

export const mapAuthLoginResponse = (
  dto: AuthLoginResponseDto | ApiEnvelope<AuthLoginResponseDto>,
): AuthSession => {
  const normalized = unwrapAuthLoginDto(dto);
  return {
    tokens: mapAuthTokens(normalized),
    user: mapAuthUserDto(normalized.user),
  };
};
