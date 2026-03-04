import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Ticket } from "lucide-react";
import { Button } from "@/ticketing/components/common/ui/button";
import { Card } from "@/ticketing/components/common/ui/card";
import { Input } from "@/ticketing/components/common/ui/input";
import { Label } from "@/ticketing/components/common/ui/label";
import { useAuth } from "@/ticketing/hooks/useAuth";

export default function AdminLogin() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const redirect = searchParams.get("redirect");
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login({ studentId, password }, "admin");
      if (redirect && redirect.startsWith("/ticket/admin")) {
        navigate(redirect);
        return;
      }
      navigate("/ticket/admin/wristband");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to login.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto flex w-full max-w-[1080px] flex-col items-center">
        <div className="space-y-2 text-center">
          <p className="text-3xl font-bold tracking-tight text-foreground">DAN-ZZAN</p>
          <p className="text-sm text-muted-foreground">Wristband Operations Admin System</p>
        </div>

        <Card className="mt-8 w-full max-w-[620px] border-border shadow-sm">
          <div className="w-full p-8">
            <div className="space-y-2">
              <p className="inline-flex w-fit items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                <Ticket className="h-3.5 w-3.5" />
                Wristband Operations
              </p>
              <h1 className="text-xl font-semibold text-foreground">Admin Login</h1>
              <p className="text-sm text-muted-foreground">
                Sign in with an admin account to manage on-site operations.
              </p>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="studentId">Admin ID</Label>
                <Input
                  id="studentId"
                  value={studentId}
                  onChange={(event) => setStudentId(event.target.value)}
                  placeholder="Enter your admin ID"
                  className="bg-card"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Admin Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="bg-card"
                  required
                />
              </div>

              {error && <p className="text-sm text-danger">{error}</p>}

              <Button
                type="submit"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? "Signing in..." : "Sign in to admin"}
              </Button>
            </form>
          </div>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          This page is only for authorized operations staff.
        </p>
      </div>
    </div>
  );
}
