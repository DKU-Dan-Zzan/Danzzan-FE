import { useNavigate } from "react-router-dom";
import { Button } from "@/ticketing/components/common/ui/button";
import { Card } from "@/ticketing/components/common/ui/card";
import { env } from "@/ticketing/utils/env";

export default function TokenRequired() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-background">
      <Card className="w-full max-w-lg p-8 space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-primary font-semibold">DAN-ZZAN Operations</p>
          <h1 className="text-2xl font-semibold text-foreground">Admin token is required</h1>
          <p className="text-sm text-muted-foreground">
            Current mode is <span className="font-semibold">{env.apiMode.toUpperCase()}</span>.
            In live mode, admin pages require a valid admin token.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-muted/60 p-4 text-sm text-muted-foreground space-y-2">
          <p>If you are in local development, choose one option below.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Set VITE_API_MODE=mock in .env.development</li>
            <li>Set a dev access token and reconnect</li>
          </ul>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button className="flex-1" onClick={() => navigate("/ticket/admin/login")}>Go to admin login</Button>
          <Button variant="outline" className="flex-1" onClick={() => navigate("/ticket/admin")}>Choose system</Button>
        </div>
      </Card>
    </div>
  );
}
