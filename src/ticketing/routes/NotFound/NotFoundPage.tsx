import { useNavigate } from "react-router-dom";
import { Button } from "@/ticketing/components/common/ui/button";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[var(--bg-base)] px-6 text-center">
      <h1 className="text-3xl font-semibold text-[var(--text)]">?섏씠吏瑜?李얠쓣 ???놁뒿?덈떎</h1>
      <p className="text-sm text-[var(--text-muted)]">?붿껌?섏떊 ?섏씠吏媛 議댁옱?섏? ?딄굅???대룞?섏뿀?듬땲??</p>
      <Button onClick={() => navigate("/")}>硫붿씤?쇰줈 ?대룞</Button>
    </div>
  );
}
