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

  const isCancelConfirm = confirmAction === "cancel";

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
        <div className="rounded-lg border border-[var(--admin-alert-error-border)] bg-[var(--admin-alert-error-bg)] px-4 py-3 text-sm text-[var(--admin-alert-error-text)]">
          {error.message || "요청에 실패했습니다. 서버 상태 또는 토큰 설정을 확인해주세요."}
        </div>
      )}

      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-3">
          <Card className="border border-[var(--admin-metric-total-border)] bg-[var(--admin-metric-total-bg)] p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-0.5 text-xs font-semibold text-[var(--admin-metric-total-text)]">전체 티켓</p>
                <p className="text-2xl font-bold text-foreground">
                  {statsLoading ? "-" : resolvedStats.totalTickets}
                </p>
              </div>
              <span className="text-xl">🎫</span>
            </div>
          </Card>

          <Card className="border border-[var(--admin-metric-issued-border)] bg-[var(--admin-metric-issued-bg)] p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-0.5 text-xs font-semibold text-[var(--admin-metric-issued-text)]">지급 완료</p>
                <p className="text-2xl font-bold text-foreground">
                  {statsLoading ? "-" : resolvedStats.issuedCount}
                  {!statsLoading && resolvedStats.totalTickets > 0 && (
                    <span className="ml-1.5 text-sm text-[var(--admin-metric-issued-text)]">
                      ({((resolvedStats.issuedCount / resolvedStats.totalTickets) * 100).toFixed(1)}%)
                    </span>
                  )}
                </p>
              </div>
              <span className="text-xl">✅</span>
            </div>
          </Card>

          <Card className="border border-[var(--admin-metric-pending-border)] bg-[var(--admin-metric-pending-bg)] p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-0.5 text-xs font-semibold text-[var(--admin-metric-pending-text)]">미지급</p>
                <p className="text-2xl font-bold text-foreground">
                  {statsLoading ? "-" : resolvedStats.pendingCount}
                  {!statsLoading && resolvedStats.totalTickets > 0 && (
                    <span className="ml-1.5 text-sm text-[var(--admin-metric-pending-text)]">
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
            <Label className="text-base font-bold text-foreground">학번으로 티켓 조회</Label>
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
              <div className="overflow-hidden rounded-xl border border-[var(--admin-table-header-border)] bg-[var(--admin-table-bg)]">
                <Table className="border-separate border-spacing-0">
                  <TableHeader className="bg-transparent">
                    <TableRow className="border-b-2 border-[var(--admin-table-header-border)] hover:bg-transparent">
                      <TableHead className="h-12 border-r border-[var(--admin-table-header-border)] bg-[var(--admin-table-header-bg)] px-5 text-sm font-semibold last:border-r-0">
                        학번
                      </TableHead>
                      <TableHead className="h-12 border-r border-[var(--admin-table-header-border)] bg-[var(--admin-table-header-bg)] px-5 text-sm font-semibold last:border-r-0">
                        이름
                      </TableHead>
                      <TableHead className="h-12 border-r border-[var(--admin-table-header-border)] bg-[var(--admin-table-header-bg)] px-5 text-sm font-semibold last:border-r-0">
                        단과대학
                      </TableHead>
                      <TableHead className="h-12 border-r border-[var(--admin-table-header-border)] bg-[var(--admin-table-header-bg)] px-5 text-sm font-semibold last:border-r-0">
                        학과
                      </TableHead>
                      <TableHead className="h-12 border-r border-[var(--admin-table-header-border)] bg-[var(--admin-table-header-bg)] px-5 text-sm font-semibold last:border-r-0">
                        팔찌 지급 여부
                      </TableHead>
                      <TableHead className="h-12 border-r border-[var(--admin-table-header-border)] bg-[var(--admin-table-header-bg)] px-5 text-sm font-semibold last:border-r-0">
                        처리 버튼
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResults.map((student) => (
                      <TableRow
                        key={student.ticketId}
                        className="bg-[var(--admin-table-row-bg)] hover:!bg-[var(--admin-table-row-alt-bg)] even:bg-[var(--admin-table-row-alt-bg)] [&>td]:border-r [&>td]:border-[var(--admin-table-cell-border)] [&>td:last-child]:border-r-0"
                      >
                        <TableCell className="px-5 py-4 text-sm font-semibold">{student.studentId}</TableCell>
                        <TableCell className="px-5 py-4 text-base">{student.name}</TableCell>
                        <TableCell className="px-5 py-4 text-base">{student.college}</TableCell>
                        <TableCell className="px-5 py-4 text-base">{student.department}</TableCell>
                        <TableCell className="px-5 py-4">
                          {student.hasWristband ? (
                            <span className="inline-flex items-center rounded-full border border-[var(--admin-badge-issued-border)] bg-[var(--admin-badge-issued-bg)] px-3 py-1 text-sm font-semibold text-[var(--admin-badge-issued-text)]">
                              지급완료
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full border border-[var(--admin-badge-pending-border)] bg-[var(--admin-badge-pending-bg)] px-3 py-1 text-sm font-semibold text-[var(--admin-badge-pending-text)]">
                              미지급
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          {student.hasWristband ? (
                            <Button
                              size="default"
                              variant="outline"
                              className="h-10 border-[var(--admin-danger-outline-border)] px-6 text-[var(--admin-danger-outline-text)] hover:bg-[var(--admin-danger-outline-hover-bg)]"
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
            </div>
          </Card>
        )}

        <Card className="rounded-xl border border-[var(--admin-guide-border)] bg-[var(--admin-guide-bg)] p-5 shadow-sm">
          <div className="flex gap-2.5">
            <div className="flex-shrink-0">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--admin-guide-icon-bg)]">
                <Info className="size-4 text-[var(--admin-guide-icon-text)]" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-foreground mb-2.5">
                팔찌 지급 절차 안내
              </h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-[var(--admin-guide-text)]">
                <div className="flex gap-1.5 leading-snug">
                  <span className="flex-shrink-0 font-semibold text-[var(--admin-guide-step-text)]">1.</span>
                  <span>웹정보 및 티켓 예매 내역 확인</span>
                </div>
                <div className="flex gap-1.5 leading-snug">
                  <span className="flex-shrink-0 font-semibold text-[var(--admin-guide-step-text)]">2.</span>
                  <span>웹정보 화면에서 학번 확인</span>
                </div>
                <div className="flex gap-1.5 leading-snug">
                  <span className="flex-shrink-0 font-semibold text-[var(--admin-guide-step-text)]">3.</span>
                  <span>
                    학번 조회 후{" "}
                    <span className="inline-flex items-center rounded-full border border-[var(--admin-badge-pending-border)] bg-[var(--admin-badge-pending-bg)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--admin-badge-pending-text)]">
                      미지급
                    </span>
                    {" "}여부 확인
                  </span>
                </div>
                <div className="flex gap-1.5 leading-snug">
                  <span className="flex-shrink-0 font-semibold text-[var(--admin-guide-step-text)]">4.</span>
                  <span>
                    <span className="rounded bg-[var(--admin-guide-chip-bg)] px-1 py-0.5 text-[11px] font-semibold text-[var(--admin-guide-chip-text)]">
                      [팔찌 주기]
                    </span>
                    {" "}버튼 클릭
                  </span>
                </div>
                <div className="flex gap-1.5 leading-snug">
                  <span className="flex-shrink-0 font-semibold text-[var(--admin-guide-step-text)]">5.</span>
                  <span>
                    확인 팝업에서{" "}
                    <span className="rounded bg-[var(--admin-guide-chip-bg)] px-1 py-0.5 text-[11px] font-semibold text-[var(--admin-guide-chip-text)]">
                      [지급 확정]
                    </span>
                    {" "}클릭
                  </span>
                </div>
                <div className="flex gap-1.5 leading-snug">
                  <span className="flex-shrink-0 font-semibold text-[var(--admin-guide-step-text)]">6.</span>
                  <span>
                    <span className="inline-flex items-center rounded-full border border-[var(--admin-badge-issued-border)] bg-[var(--admin-badge-issued-bg)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--admin-badge-issued-text)]">
                      지급완료
                    </span>
                    {" "}확인 후 팔찌 배부
                  </span>
                </div>
              </div>
              <div className="mt-3 rounded-xl border border-[var(--admin-danger-note-border)] bg-[var(--admin-danger-note-bg)] px-3.5 py-3">
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[var(--admin-danger-note-icon-bg)] text-[11px] font-bold text-[var(--admin-danger-note-icon-text)]">
                    !
                  </span>
                  <div className="space-y-1">
                    <p className="text-[11px] leading-relaxed text-[var(--admin-danger-note-text)]">
                      오지급 시{" "}
                      <span className="rounded bg-[var(--admin-danger-chip-bg)] px-1 py-0.5 font-semibold text-[var(--admin-danger-chip-text)]">[지급 취소]</span>
                      {" "}버튼 클릭 후, 확인 팝업에서{" "}
                      <span className="rounded bg-[var(--admin-danger-chip-bg)] px-1 py-0.5 font-semibold text-[var(--admin-danger-chip-text)]">[지급 취소 확정]</span>
                      {" "}클릭
                    </p>
                    <p className="text-[11px] font-semibold leading-relaxed text-[var(--admin-danger-note-text)]">팔찌 배부 상태 재확인 필수!</p>
                  </div>
                </div>
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
        <DialogContent
          className={`admin-confirm-dialog ${isCancelConfirm ? "admin-confirm-dialog--cancel" : "admin-confirm-dialog--issue"}`}
        >
          <DialogHeader>
            <DialogTitle
              className={isCancelConfirm ? "admin-confirm-dialog__title--cancel" : "admin-confirm-dialog__title--issue"}
            >
              {isCancelConfirm ? "팔찌 지급 취소 확인" : "팔찌 지급 확인"}
            </DialogTitle>
            <DialogDescription className="admin-confirm-dialog__description">
              {isCancelConfirm
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
              variant={isCancelConfirm ? "destructive" : "default"}
              className={
                isCancelConfirm
                  ? "admin-confirm-dialog__confirm--cancel !border-[var(--admin-danger-action-border)] !bg-[var(--admin-danger-action-bg)] !text-[var(--admin-danger-action-text)] hover:!bg-[var(--admin-danger-action-hover-bg)]"
                  : "admin-confirm-dialog__confirm--issue"
              }
              onClick={handleConfirmAction}
              disabled={issuing}
            >
              {issuing
                ? isCancelConfirm
                  ? "취소 처리 중..."
                  : "지급 처리 중..."
                : isCancelConfirm
                  ? "지급 취소 확정"
                  : "지급 확정"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
