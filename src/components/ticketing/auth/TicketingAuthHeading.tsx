type TicketingAuthHeadingProps = {
  title: string;
  subtitle?: string;
};

const DEFAULT_SUBTITLE = "대학생 전용 축제 서비스";

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
