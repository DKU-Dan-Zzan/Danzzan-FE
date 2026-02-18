const Header = () => {
  return (
    <header
      className="
        sticky top-0 z-50
        bg-white/85 backdrop-blur-xl
        border-b border-slate-200/70
      "
    >
      <div className="max-w-[430px] mx-auto h-14 flex items-center justify-center px-4">
        <img
          src="/DAN-ZZAN.png"
          alt="DAN-ZZAN"
          className="h-7 object-contain select-none"
          draggable={false}
        />
      </div>
    </header>
  )
}
export default Header