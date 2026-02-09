import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/common/ui/card";
import { Button } from "@/components/common/ui/button";
import { useWristband } from "@/hooks/useWristband";
import type { WristbandSession } from "@/types/model/wristband.model";

interface WristbandDashboardProps {
  onSelectDate: (date: string) => void;
}

export function WristbandDashboard({ onSelectDate }: WristbandDashboardProps) {
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

  const statusLabel: Record<WristbandSession["status"], string> = {
    open: "운영중",
    closed: "마감",
    unknown: "미정",
  };

  const statusStyle: Record<WristbandSession["status"], string> = {
    open: "bg-green-100 text-green-700",
    closed: "bg-gray-100 text-gray-600",
    unknown: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">운영 날짜 선택</h2>
        <p className="text-sm text-gray-500">배부 운영일을 선택해 상세 화면으로 이동합니다.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          세션 정보를 불러오지 못했습니다. 서버 상태를 확인해주세요.
        </div>
      )}

      {loading && sessions.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-6 text-sm text-gray-500">
          세션 목록을 불러오는 중입니다...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {sortedSessions.map((session) => (
            <Card key={session.id} className="p-8 hover:shadow-lg transition-shadow">
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {formatDate(session.date)} 공연 팔찌 배부
                  </h3>
                  <div className="flex items-center gap-2 text-base text-gray-600">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle[session.status]}`}>
                      {statusLabel[session.status]}
                    </span>
                    <span>운영 일자: {session.date}</span>
                  </div>
                </div>
                <Button
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-base"
                  onClick={() => onSelectDate(session.date)}
                >
                  관리하기
                </Button>
              </div>
            </Card>
          ))}

          {!sortedSessions.length && (
            <Card className="p-8 text-center text-sm text-gray-500">
              등록된 운영 세션이 없습니다.
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
