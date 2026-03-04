import { useEffect, useMemo, useState } from "react";
import { Card } from "@/ticketing/components/common/ui/card";
import { Button } from "@/ticketing/components/common/ui/button";
import { useWristband } from "@/ticketing/hooks/useWristband";
import type { WristbandSession } from "@/ticketing/types/model/wristband.model";

interface WristbandDashboardProps {
  onSelectSession: (session: WristbandSession) => void;
}

export function WristbandDashboard({ onSelectSession }: WristbandDashboardProps) {
  const { listSessions, loading, error } = useWristband();
  const [sessions, setSessions] = useState<WristbandSession[]>([]);

  useEffect(() => {
    let active = true;
    listSessions()
      .then((items) => {
        if (active) {
          setSessions(items);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [listSessions]);

  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => a.date.localeCompare(b.date)),
    [sessions],
  );

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-");
    if (!year || !month || !day) {
      return dateStr;
    }
    return `${month}??${day}??;`
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">?댁쁺 ?좎쭨 ?좏깮</h2>
        <p className="text-sm text-muted-foreground">諛곕? ?댁쁺?쇱쓣 ?좏깮???곸꽭 ?붾㈃?쇰줈 ?대룞?⑸땲??</p>
      </div>

      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          ?몄뀡 ?뺣낫瑜?遺덈윭?ㅼ? 紐삵뻽?듬땲?? ?쒕쾭 ?곹깭瑜??뺤씤?댁＜?몄슂.
        </div>
      )}

      {loading && sessions.length === 0 ? (
        <div className="rounded-lg border border-border bg-card px-4 py-6 text-sm text-muted-foreground">
          ?몄뀡 紐⑸줉??遺덈윭?ㅻ뒗 以묒엯?덈떎...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {sortedSessions.map((session) => (
            <Card key={session.id} className="p-8 hover:shadow-md transition-shadow">
                <div className="space-y-6">
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-semibold text-primary">{session.dayLabel}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">
                    {session.title || `${formatDate(session.date)} 怨듭뿰 ?붿컡 諛곕?`}
                  </h3>
                  <p className="text-base text-muted-foreground">
                    ?댁쁺 ?쇱옄: {session.date}
                  </p>
                </div>
                <Button
                  className="w-full h-12 text-base"
                  onClick={() => onSelectSession(session)}
                >
                  愿由ы븯湲?                </Button>
              </div>
            </Card>
          ))}

          {!sortedSessions.length && (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              ?깅줉???댁쁺 ?몄뀡???놁뒿?덈떎.
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
