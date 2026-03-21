type AppHeaderLogoProps = {
  className?: string;
};

const BASE_CLASS_NAME =
  "pointer-events-none absolute top-1/2 left-1/2 h-[50px] w-[220px] -translate-x-1/2 -translate-y-1/2 object-contain object-center select-none";

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
