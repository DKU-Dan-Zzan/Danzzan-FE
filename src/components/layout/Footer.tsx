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
        <p className="text-[12px] text-[var(--footer-text-secondary)]">
          © {new Date().getFullYear()} DAN-ZZAN. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

export default Footer
