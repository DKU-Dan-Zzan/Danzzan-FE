// 역할: 티켓팅 인증 API 송수신 DTO 타입을 정의합니다.
export interface AuthLoginRequestDto {
  studentId?: string;
  password?: string;
}

export interface AuthTokenDto {
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface AuthUserDto {
  id?: string;
  name?: string;
  role?: string;
  department?: string;
  studentId?: string;
  college?: string;
  naverId?: string;
}

export interface AuthLoginResponseDto {
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  user?: AuthUserDto;
  tokens?: AuthTokenDto;
}
