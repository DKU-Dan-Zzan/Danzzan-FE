import { Instagram } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { Link } from "react-router-dom";

type SocialIconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const FilledYouTubeIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <rect x="1.75" y="5" width="20.5" height="14" rx="4.8" fill="currentColor" />
    <path d="M10.15 9.35V14.65L15.1 12L10.15 9.35Z" fill="var(--footer-bg)" />
  </svg>
);

type SocialLink = {
  label: string;
  href: string;
  Icon: SocialIconComponent;
  iconClassName: string;
  iconStrokeWidth?: number;
};

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
    iconStrokeWidth: undefined,
  },
] as const satisfies ReadonlyArray<SocialLink>;

type PolicyLink = {
  label: string;
  to: string;
};

const POLICY_LINKS = [
  {
    label: "개인정보처리방침",
    to: "/legal/privacy",
  },
  {
    label: "이용약관",
    to: "/legal/terms",
  },
] as const satisfies ReadonlyArray<PolicyLink>;

// 역할: 앱 레이아웃 레이어의 Footer 구성 컴포넌트를 제공합니다.
const Footer = () => {
  return (
    <footer className="relative w-full bg-[var(--footer-bg)] [background-image:var(--footer-bg-gradient)] bg-no-repeat bg-[length:100%_100%]">
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
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--footer-icon-bg)] text-[var(--footer-icon-fg)] shadow-[var(--footer-icon-shadow)] transition-colors duration-150 hover:bg-[var(--footer-icon-bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--footer-bg)]"
            >
              <Icon className={iconClassName} strokeWidth={iconStrokeWidth} aria-hidden />
            </a>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-center text-[13px] text-[var(--footer-text-secondary)]">
          {POLICY_LINKS.map(({ label, to }, index) => (
            <div key={to} className="flex items-center">
              {index > 0 && <span className="mx-2 text-[var(--footer-text-secondary)]">|</span>}
              <Link
                to={to}
                state={{ returnTo: "/mypage" }}
                className="underline-offset-2 transition-colors duration-150 hover:text-[var(--footer-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--footer-bg)]"
              >
                {label}
              </Link>
            </div>
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
