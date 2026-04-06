type TicketingAuthHeadingProps = {
  eyebrow?: string;
  title: string;
};

const DEFAULT_EYEBROW = "2026 DANFESTA";

export const TICKETING_AUTH_HEADER_SECTION_CLASS = "pb-2.5 pt-3.5";
export const TICKETING_AUTH_MAIN_CLASS = "mt-2.5";

export function TicketingAuthHeading({
  eyebrow = DEFAULT_EYEBROW,
  title,
}: TicketingAuthHeadingProps) {
  return (
    <>
      <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[var(--text-emphasis-vivid)]">
        {eyebrow}
      </p>
      <h1 className="mt-1 text-[18px] font-extrabold tracking-tight text-[var(--text-body-deep)] sm:text-[19px]">
        {title}
      </h1>
    </>
  );
}
