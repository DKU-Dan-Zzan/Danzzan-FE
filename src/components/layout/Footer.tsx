const Footer = () => {
  return (
    <footer className="w-full bg-slate-100 border-t border-slate-200">
      <div className="max-w-[430px] mx-auto px-4 py-6 text-center space-y-2">
        <p className="text-[13px] text-slate-700">
          단국대학교 총학생회 LOU:D X DAN-ZZAN
        </p>
        <p className="text-[12px] text-slate-500">
          © {new Date().getFullYear()} DAN-ZZAN. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

export default Footer
