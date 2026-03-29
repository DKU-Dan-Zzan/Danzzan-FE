import { Instagram } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

type SocialIconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const FilledYouTubeIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <rect x="1.75" y="5" width="20.5" height="14" rx="4.8" fill="currentColor" />
    <path d="M10.15 9.35V14.65L15.1 12L10.15 9.35Z" fill="var(--footer-bg)" />
  </svg>
);

const SOCIAL_LINKS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/dku_loud/",
    Icon: Instagram,
    iconClassName: "h-5 w-5",
    iconStrokeWidth: 2.1,
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@2026%EB%9D%BC%EC%9A%B0%EB%93%9C%EC%B4%9D%ED%95%99%EC%83%9D%ED%9A%8C",
    Icon: FilledYouTubeIcon as SocialIconComponent,
    iconClassName: "h-[22px] w-[22px]",
  },
] as const;

// 역할: 앱 레이아웃 레이어의 Footer 구성 컴포넌트를 제공합니다.
const Footer = () => {
  return (
    <footer className="relative w-full bg-[var(--footer-bg)]">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[var(--footer-divider)]" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-px h-1.5 bg-[linear-gradient(to_bottom,var(--footer-divider-glow)_0%,var(--footer-divider-transparent)_100%)]"
      />

      <div className="mx-auto max-w-[430px] px-5 pb-7 pt-6">
        <p className="text-center text-[13px] leading-5 text-[var(--footer-text-primary)]">
          주최 단국대학교 죽전캠퍼스 제58대 LOU:D 총학생회
        </p>

        <p className="mt-4 text-center text-[12px] text-[var(--footer-text-secondary)]">
          LOU:D 총학생회 Instagram · YouTube
        </p>

        <div className="mt-2 flex items-center justify-center gap-3">
          {SOCIAL_LINKS.map(({ label, href, Icon, iconClassName, iconStrokeWidth }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--footer-icon-border)] bg-[var(--footer-icon-bg)] text-[var(--footer-icon-fg)] shadow-[var(--footer-icon-shadow)] transition-colors duration-150 hover:bg-[var(--footer-icon-bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--footer-bg)]"
            >
              <Icon className={iconClassName} strokeWidth={iconStrokeWidth} aria-hidden />
            </a>
          ))}
        </div>

        <p className="mt-7 text-center text-[11px] tracking-[0.01em] text-[var(--footer-text-secondary)]">
          Developed by DAN-ZZAN | © 2026 All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
