// 역할: 앱 레이아웃 레이어의 Footer 구성 컴포넌트를 제공합니다.
const Footer = () => {
  return (
    <footer className="relative w-full bg-[var(--footer-bg)]">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[var(--footer-divider)]" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-px h-1.5 bg-[linear-gradient(to_bottom,var(--footer-divider-glow)_0%,var(--footer-divider-transparent)_100%)]"
      />

      <div className="mx-auto max-w-[430px] space-y-2 px-4 py-6 text-center">
        <p className="text-[13px] text-[var(--footer-text-primary)]">
          단국대학교 총학생회 LOU:D X DAN-ZZAN
        </p>
        <div className="flex items-center justify-center gap-1">
          <span className="text-[12px] text-[var(--footer-text-secondary)]">총학생회 공식 SNS :</span>
          <a
            href="https://www.instagram.com/dku_loud/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] text-[var(--footer-text-secondary)] underline underline-offset-2"
          >
            Instagram
          </a>
          <span className="text-[12px] text-[var(--footer-text-secondary)]">,</span>
          <a
            href="https://www.youtube.com/@2026%EB%9D%BC%EC%9A%B0%EB%93%9C%EC%B4%9D%ED%95%99%EC%83%9D%ED%9A%8C"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] text-[var(--footer-text-secondary)] underline underline-offset-2"
          >
            YouTube
          </a>
        </div>
      </div>
    </footer>
  )
}

export default Footer
