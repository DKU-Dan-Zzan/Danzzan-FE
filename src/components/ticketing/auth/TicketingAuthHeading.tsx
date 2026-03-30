// 역할: 티켓팅 인증 화면(로그인/회원가입/비밀번호 재설정) 공통 헤더 타이포그래피를 제공합니다.
type TicketingAuthHeadingProps = {
  title: string;
  subtitle?: string;
};

const DEFAULT_SUBTITLE = "재학생 전용 축제 포털 서비스";
export const TICKETING_AUTH_HEADER_SECTION_CLASS = "pb-3 pt-4";
export const TICKETING_AUTH_MAIN_CLASS = "mt-3";

export function TicketingAuthHeading({
  title,
  subtitle = DEFAULT_SUBTITLE,
}: TicketingAuthHeadingProps) {
  return (
    <>
      <p className="text-[11px] font-semibold text-[var(--text-emphasis-vivid)]">
        {subtitle}
      </p>
      <h1 className="mt-1 text-[20px] font-extrabold tracking-tight text-[var(--text-body-deep)]">
        {title}
      </h1>
    </>
  );
}
