type AppHeaderLogoProps = {
  className?: string;
};

const BASE_CLASS_NAME =
  "pointer-events-none absolute top-[75%] left-1/2 h-[61px] w-[270px] -translate-x-1/2 -translate-y-1/2 object-cover object-[50%_58%] select-none";

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
