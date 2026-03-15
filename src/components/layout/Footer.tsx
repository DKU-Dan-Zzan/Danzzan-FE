const Footer = () => {
  return (
    <footer className="app-footer w-full">
      <div className="max-w-[430px] mx-auto px-4 py-6 text-center space-y-2">
        <p className="app-footer-primary text-[13px]">
          단국대학교 총학생회 LOU:D X DAN-ZZAN
        </p>
        <p className="app-footer-secondary text-[12px]">
          © {new Date().getFullYear()} DAN-ZZAN. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

export default Footer
