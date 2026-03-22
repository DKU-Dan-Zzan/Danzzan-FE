// 역할: 티켓팅 도메인 타입 계약(DTO/Model)을 정의하는 모듈입니다.
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
}

export interface AuthLoginResponseDto {
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  user?: AuthUserDto;
  tokens?: AuthTokenDto;
}
