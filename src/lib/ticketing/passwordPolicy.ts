export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_SPECIAL_CHAR_REGEX = /[\W_]/;
export const PASSWORD_POLICY_ERROR_MESSAGE =
  "비밀번호는 8자 이상이며 특수문자를 1자 이상 포함해야 합니다.";
export const PASSWORD_CONFIRM_MISMATCH_ERROR_MESSAGE = "비밀번호 확인이 일치하지 않습니다.";

export type PasswordPolicyState = {
  hasMinLength: boolean;
  hasSpecialChar: boolean;
  isConfirmMatched: boolean;
  isValid: boolean;
};

export const hasPasswordSpecialChar = (password: string) => PASSWORD_SPECIAL_CHAR_REGEX.test(password);

export const getPasswordPolicyState = (
  password: string,
  confirmPassword: string,
): PasswordPolicyState => {
  const hasMinLength = password.length >= PASSWORD_MIN_LENGTH;
  const hasSpecialChar = hasPasswordSpecialChar(password);
  const isConfirmMatched = confirmPassword.length > 0 && password === confirmPassword;

  return {
    hasMinLength,
    hasSpecialChar,
    isConfirmMatched,
    isValid: hasMinLength && hasSpecialChar && isConfirmMatched,
  };
};
