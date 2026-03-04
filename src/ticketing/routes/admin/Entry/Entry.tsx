import { useNavigate } from "react-router-dom";
import { Card } from "@/ticketing/components/common/ui/card";
import { Button } from "@/ticketing/components/common/ui/button";

const systems = [
  {
    id: "wristband",
    title: "?붿컡 諛곕? ?댁쁺",
    description: "?곗폆 ?뺤씤 諛??붿컡 吏湲??꾪솴??愿由ы빀?덈떎.",
  },
];

export default function AdminEntry() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <Card className="w-full max-w-3xl p-10">
        <div className="space-y-2">
          <p className="text-sm text-primary font-semibold">DAN-ZZAN Operations</p>
          <h1 className="text-2xl font-semibold text-foreground">愿由??쒖뒪???좏깮</h1>
          <p className="text-sm text-muted-foreground">?묒냽???댁쁺 ?쒖뒪?쒖쓣 ?좏깮?섏꽭??</p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {systems.map((system) => (
            <Card key={system.id} className="p-6 border-border shadow-sm">
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground">{system.title}</h2>
                <p className="text-sm text-muted-foreground">{system.description}</p>
                <Button
                  className="w-full"
                  onClick={() => navigate("/ticket/admin/login")}
                >
                  濡쒓렇?몄쑝濡??대룞
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
