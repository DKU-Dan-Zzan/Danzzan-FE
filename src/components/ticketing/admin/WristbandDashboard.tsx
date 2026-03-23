// 역할: 팔찌 운영 대시보드의 날짜별 세션 카드와 상태 요약 UI를 렌더링합니다.
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/common/ui/card";
import { Button } from "@/components/common/ui/button";
import { useWristband } from "@/hooks/ticketing/useWristband";
import type { WristbandSession } from "@/types/ticketing/model/wristband.model";

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
    return `${month}월 ${day}일`;
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">배부 날짜 선택</h2>
        <p className="text-sm text-muted-foreground">배부 날짜를 선택하여 상세 페이지로 이동합니다.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-[var(--admin-alert-error-border)] bg-[var(--admin-alert-error-bg)] px-4 py-3 text-sm text-[var(--admin-alert-error-text)]">
          세션 정보를 불러오지 못했습니다. 서버 상태를 확인해주세요.
        </div>
      )}

      {loading && sessions.length === 0 ? (
        <div className="rounded-lg border border-[var(--admin-panel-border)] bg-[var(--admin-panel-bg)] px-4 py-6 text-sm text-muted-foreground">
          세션 목록을 불러오는 중입니다...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {sortedSessions.map((session) => (
            <Card key={session.id} className="p-8 hover:shadow-md transition-shadow">
              <div className="space-y-6">
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-semibold text-[var(--admin-accent-text)]">{session.dayLabel}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">
                    {session.title || `${formatDate(session.date)} 공연 팔찌 배부`}
                  </h3>
                  <p className="text-base text-muted-foreground">
                    운영 일자: {session.date}
                  </p>
                </div>
                <Button
                  className="w-full h-12 text-base"
                  onClick={() => onSelectSession(session)}
                >
                  관리하기
                </Button>
              </div>
            </Card>
          ))}

          {!sortedSessions.length && (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              등록된 운영 세션이 없습니다.
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
