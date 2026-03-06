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
