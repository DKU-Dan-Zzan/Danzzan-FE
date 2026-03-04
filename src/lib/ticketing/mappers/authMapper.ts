import type { AuthLoginResponseDto } from "@/types/ticketing/dto/auth.dto";
import type { AuthSession, AuthTokens, AuthUser } from "@/types/ticketing/model/auth.model";

const mapUserRole = (role?: string): AuthUser["role"] => {
  if (role === "student" || role === "admin") {
    return role;
  }
  return "unknown";
};

const mapAuthUser = (dto?: AuthLoginResponseDto["user"]): AuthUser | null => {
  if (!dto) {
    return null;
  }

  return {
    id: dto.id ?? "",
    name: dto.name ?? "",
    role: mapUserRole(dto.role),
    department: dto.department ?? "",
    studentId: dto.studentId ?? "",
  };
};

const mapAuthTokens = (dto: AuthLoginResponseDto): AuthTokens => {
  return {
    accessToken: dto.tokens?.accessToken ?? dto.accessToken ?? "",
    refreshToken: dto.tokens?.refreshToken ?? dto.refreshToken ?? "",
    expiresIn: dto.tokens?.expiresIn ?? dto.expiresIn ?? null,
  };
};

export const mapAuthLoginResponse = (dto: AuthLoginResponseDto): AuthSession => {
  return {
    tokens: mapAuthTokens(dto),
    user: mapAuthUser(dto.user),
  };
};
