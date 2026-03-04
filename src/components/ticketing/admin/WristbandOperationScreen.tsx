import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ticketing/common/ui/card";
import { Button } from "@/components/ticketing/common/ui/button";
import { Input } from "@/components/ticketing/common/ui/input";
import { Label } from "@/components/ticketing/common/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ticketing/common/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ticketing/common/ui/table";
import { ArrowLeft, Info } from "lucide-react";
import { useWristband } from "@/hooks/ticketing/useWristband";
import type { WristbandAttendee, WristbandStats } from "@/types/ticketing/model/wristband.model";

interface WristbandOperationScreenProps {
  eventId: string;
  date: string;
  dayLabel?: string;
  onBack: () => void;
}

type ConfirmAction = "issue" | "cancel";

export function WristbandOperationScreen({ eventId, date, dayLabel, onBack }: WristbandOperationScreenProps) {
  const { getStats, findAttendee, issueWristband, cancelWristband, error } = useWristband();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [searchResults, setSearchResults] = useState<WristbandAttendee[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [stats, setStats] = useState<WristbandStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedAttendee, setSelectedAttendee] = useState<WristbandAttendee | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>("issue");

  useEffect(() => {
    let active = true;
    setStatsLoading(true);
    getStats(eventId)
      .then((data) => {
        if (active) {
          setStats(data);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) {
          setStatsLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [eventId, getStats]);

  const resolvedStats = useMemo(() => {
    return (
      stats ?? {
        totalTickets: 0,
        issuedCount: 0,
        pendingCount: 0,
      }
    );
  }, [stats]);

  const normalizedDayLabel = dayLabel?.replace(/\s+/g, "").trim();
  const headerMeta = [date, normalizedDayLabel ? `축제 ${normalizedDayLabel}` : null]
    .filter(Boolean)
    .join(" · ");
  const contentMaxWidthClass = "mx-auto w-full max-w-[1200px]";

  const handleSearch = async () => {
    const keyword = query.trim();
    setHasSearched(true);

    if (!keyword) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const result = await findAttendee(keyword, eventId);
      setSearchResults(result ? [result] : []);
    } finally {
      setSearching(false);
    }
  };

  const handleIssueWristband = (attendee: WristbandAttendee) => {
    setSelectedAttendee(attendee);
    setConfirmAction("issue");
    setConfirmDialogOpen(true);
  };

  const handleCancelWristband = (attendee: WristbandAttendee) => {
    setSelectedAttendee(attendee);
    setConfirmAction("cancel");
    setConfirmDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    const attendee = selectedAttendee;
    if (!attendee) {
      return;
    }

    const isCancelAction = confirmAction === "cancel";

    setIssuing(true);
    try {
      if (isCancelAction) {
        await cancelWristband(eventId, attendee.ticketId);
      } else {
        await issueWristband(eventId, attendee.ticketId);
      }

      setSearchResults((prev) =>
        prev.map((item) =>
          item.ticketId === attendee.ticketId
            ? {
                ...item,
                hasWristband: !isCancelAction,
                issuedAt: isCancelAction ? null : new Date().toISOString(),
                issuerAdminName: isCancelAction ? null : "관리자",
            }
            : item,
        ),
      );
      setStats((prev) => {
        if (!prev) {
          return prev;
        }

        if (isCancelAction) {
          if (!attendee.hasWristband) {
            return prev;
          }
          return {
            ...prev,
            issuedCount: Math.max(prev.issuedCount - 1, 0),
            pendingCount: Math.min(prev.pendingCount + 1, prev.totalTickets),
          };
        }

        if (attendee.hasWristband) {
          return prev;
        }

        return {
          ...prev,
          issuedCount: prev.issuedCount + 1,
          pendingCount: Math.max(prev.pendingCount - 1, 0),
        };
      });
    } catch {
      // error state is handled in the hook
    } finally {
      setIssuing(false);
      setConfirmDialogOpen(false);
      setSelectedAttendee(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="leading-tight text-2xl font-semibold text-foreground">
            {headerMeta || date}
          </h2>
          <p className="text-sm text-muted-foreground">
            팔찌 지급, 취소 관리 시스템
          </p>
        </div>
        <Button variant="outline" onClick={onBack} className="h-10 px-4">
          <ArrowLeft className="size-4 mr-2" />
          날짜 선택으로 돌아가기
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error.message || "요청에 실패했습니다. 서버 상태 또는 토큰 설정을 확인해주세요."}
        </div>
      )}

      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 bg-primary-soft border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-primary font-semibold mb-0.5">전체 티켓</p>
                <p className="text-2xl font-bold text-foreground">
                  {statsLoading ? "-" : resolvedStats.totalTickets}
                </p>
              </div>
              <span className="text-xl">🎫</span>
            </div>
          </Card>

          <Card className="border border-[#f5cfe1] bg-[#fff2f8] p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-0.5 text-xs font-semibold text-[#c84f8c]">지급 완료</p>
                <p className="text-2xl font-bold text-foreground">
                  {statsLoading ? "-" : resolvedStats.issuedCount}
                  {!statsLoading && resolvedStats.totalTickets > 0 && (
                    <span className="ml-1.5 text-sm text-[#c84f8c]">
                      ({((resolvedStats.issuedCount / resolvedStats.totalTickets) * 100).toFixed(1)}%)
                    </span>
                  )}
                </p>
              </div>
              <span className="text-xl">✅</span>
            </div>
          </Card>

          <Card className="p-3 bg-success/10 border border-success/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-success font-semibold mb-0.5">미지급</p>
                <p className="text-2xl font-bold text-foreground">
                  {statsLoading ? "-" : resolvedStats.pendingCount}
                  {!statsLoading && resolvedStats.totalTickets > 0 && (
                    <span className="text-sm text-success ml-1.5">
                      ({((resolvedStats.pendingCount / resolvedStats.totalTickets) * 100).toFixed(1)}%)
                    </span>
                  )}
                </p>
              </div>
              <span className="text-xl">⏳</span>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <div className={`${contentMaxWidthClass} space-y-4`}>
            <Label className="text-base font-medium text-foreground">학번으로 티켓 조회</Label>
            <div className="flex gap-4">
              <Input
                placeholder="학번 입력"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 h-12 text-base"
              />
              <Button
                className="px-12 h-12 text-base"
                onClick={handleSearch}
                disabled={searching}
              >
                {searching ? "조회 중..." : "조회"}
              </Button>
            </div>
          </div>
        </Card>

        {hasSearched && searchResults.length === 0 && (
          <Card className="p-6 text-sm text-muted-foreground">조회 결과가 없습니다.</Card>
        )}

        {searchResults.length > 0 && (
          <Card className="p-4">
            <div className={contentMaxWidthClass}>
              <h3 className="mb-3 text-base font-semibold">조회 결과</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-sm">학번</TableHead>
                    <TableHead className="text-sm">이름</TableHead>
                    <TableHead className="text-sm">단과대학</TableHead>
                    <TableHead className="text-sm">학과</TableHead>
                    <TableHead className="text-sm">팔찌 지급 여부</TableHead>
                    <TableHead className="text-sm">처리 버튼</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchResults.map((student) => (
                    <TableRow key={student.ticketId}>
                      <TableCell className="font-medium text-sm py-2">{student.studentId}</TableCell>
                      <TableCell className="text-base">{student.name}</TableCell>
                      <TableCell className="text-base">{student.college}</TableCell>
                      <TableCell className="text-base">{student.department}</TableCell>
                      <TableCell>
                        {student.hasWristband ? (
                          <span className="inline-flex items-center rounded-full bg-[#ff4fa3]/20 px-3 py-1 text-sm font-medium text-[#e6007a]">
                            지급완료
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-success/15 text-success">
                            미지급
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {student.hasWristband ? (
                          <Button
                            size="default"
                            variant="outline"
                            className="h-10 border-danger/30 px-6 text-danger hover:bg-danger/10"
                            onClick={() => handleCancelWristband(student)}
                            disabled={issuing}
                          >
                            지급 취소
                          </Button>
                        ) : (
                          <Button
                            size="default"
                            className="h-10 px-6"
                            onClick={() => handleIssueWristband(student)}
                            disabled={issuing}
                          >
                            팔찌 주기
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

        <Card className="rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
          <div className="flex gap-2.5">
            <div className="flex-shrink-0">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-200">
                <Info className="size-4 text-slate-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-foreground mb-2.5">
                팔찌 지급 절차 안내
              </h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-slate-700">
                <div className="flex gap-1.5 leading-snug">
                  <span className="flex-shrink-0 font-semibold text-primary">1.</span>
                  <span>웹정보-기본정보 화면에서 얼굴 본인 확인</span>
                </div>
                <div className="flex gap-1.5 leading-snug">
                  <span className="flex-shrink-0 font-semibold text-primary">2.</span>
                  <span>웹정보-기본정보 화면에서 학번 확인</span>
                </div>
                <div className="flex gap-1.5 leading-snug">
                  <span className="flex-shrink-0 font-semibold text-primary">3.</span>
                  <span>
                    학번 조회 후{" "}
                    <span className="rounded bg-success/15 px-1 py-0.5 text-[11px] font-semibold text-success">
                      미지급
                    </span>
                    {" "}여부 확인
                  </span>
                </div>
                <div className="flex gap-1.5 leading-snug">
                  <span className="flex-shrink-0 font-semibold text-primary">4.</span>
                  <span>
                    <span className="rounded bg-primary-soft px-1 py-0.5 text-[11px] font-semibold text-primary">
                      [팔찌 주기]
                    </span>
                    {" "}버튼 클릭
                  </span>
                </div>
                <div className="flex gap-1.5 leading-snug">
                  <span className="flex-shrink-0 font-semibold text-primary">5.</span>
                  <span>
                    확인 팝업에서{" "}
                    <span className="rounded bg-primary-soft px-1 py-0.5 text-[11px] font-semibold text-primary">
                      [지급 확정]
                    </span>
                    {" "}클릭
                  </span>
                </div>
                <div className="flex gap-1.5 leading-snug">
                  <span className="flex-shrink-0 font-semibold text-primary">6.</span>
                  <span>
                    <span className="rounded bg-[#ff4fa3]/20 px-1 py-0.5 text-[11px] font-semibold text-[#e6007a]">
                      지급완료
                    </span>
                    {" "}확인 후 팔찌 전달
                  </span>
                </div>
                <div className="flex gap-1.5 leading-snug">
                  <span className="flex-shrink-0 font-semibold text-primary">7.</span>
                  <span>
                    오처리 시{" "}
                    <span className="rounded bg-danger/10 px-1 py-0.5 text-[11px] font-semibold text-danger">
                      [지급 취소]
                    </span>
                    {" "}버튼 클릭
                  </span>
                </div>
                <div className="flex gap-1.5 leading-snug">
                  <span className="flex-shrink-0 font-semibold text-primary">8.</span>
                  <span>
                    확인 팝업에서{" "}
                    <span className="rounded bg-danger/10 px-1 py-0.5 text-[11px] font-semibold text-danger">
                      [지급 취소 확정]
                    </span>
                    {" "}클릭 후 상태 재확인
                  </span>
                </div>
              </div>
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                <p className="flex items-start gap-1 text-[11px] leading-snug text-red-700">
                  <span className="font-semibold">⚠</span>
                  <span>
                    <span className="font-semibold">중요:</span> 지급/취소 처리 내역은 모두 기록됩니다. 반드시 학생 본인 확인 후 처리하세요.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Dialog
        open={confirmDialogOpen}
        onOpenChange={(open) => {
          setConfirmDialogOpen(open);
          if (!open) {
            setSelectedAttendee(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction === "cancel" ? "팔찌 지급 취소 확인" : "팔찌 지급 확인"}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === "cancel"
                ? "해당 학생의 지급 완료 상태를 취소하시겠습니까? 취소 이력은 로그에 남습니다."
                : "해당 학생에게 팔찌를 지급 처리하시겠습니까?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmDialogOpen(false);
                setSelectedAttendee(null);
              }}
            >
              취소
            </Button>
            <Button
              variant={confirmAction === "cancel" ? "destructive" : "default"}
              onClick={handleConfirmAction}
              disabled={issuing}
            >
              {issuing
                ? confirmAction === "cancel"
                  ? "취소 처리 중..."
                  : "지급 처리 중..."
                : confirmAction === "cancel"
                  ? "지급 취소 확정"
                  : "지급 확정"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
