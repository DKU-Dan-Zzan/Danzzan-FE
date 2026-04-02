// 역할: 앱 레이아웃 레이어의 App Header Logo 구성 컴포넌트를 제공합니다.
type AppHeaderLogoProps = {
  className?: string;
};

const BASE_CLASS_NAME =
  "pointer-events-none absolute top-1/2 left-1/2 h-[42.5px] w-[187px] -translate-x-1/2 -translate-y-1/2 object-contain object-center select-none";

export function AppHeaderLogo({ className }: AppHeaderLogoProps) {
  return (
    <img
      src="/DAN-ZZAN.png"
      alt="DAN-ZZAN"
      className={className ? `${BASE_CLASS_NAME} ${className}` : BASE_CLASS_NAME}
      draggable={false}
    />
  );
}
