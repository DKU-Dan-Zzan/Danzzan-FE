import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/common/ui/card";
import { Button } from "@/components/common/ui/button";
import { Input } from "@/components/common/ui/input";
import { Label } from "@/components/common/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/common/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/common/ui/table";
import { ArrowLeft, Info } from "lucide-react";
import { useWristband } from "@/hooks/useWristband";
import type { WristbandAttendee, WristbandStats } from "@/types/model/wristband.model";

interface WristbandOperationScreenProps {
  eventId: string;
  date: string;
  title?: string;
  onBack: () => void;
}

export function WristbandOperationScreen({ eventId, date, title, onBack }: WristbandOperationScreenProps) {
  const { getStats, findAttendee, issueWristband, error } = useWristband();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [searchResults, setSearchResults] = useState<WristbandAttendee[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [stats, setStats] = useState<WristbandStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedAttendee, setSelectedAttendee] = useState<WristbandAttendee | null>(null);

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

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-");
    if (!year || !month || !day) {
      return dateStr;
    }
    return `${month}월 ${day}일`;
  };

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
    setConfirmDialogOpen(true);
  };

  const confirmIssue = async () => {
    if (!selectedAttendee) {
      return;
    }

    setIssuing(true);
    try {
      await issueWristband(eventId, selectedAttendee.ticketId);
      setSearchResults((prev) =>
        prev.map((item) =>
          item.ticketId === selectedAttendee.ticketId
            ? { ...item, hasWristband: true }
            : item,
        ),
      );
      setStats((prev) => {
        if (!prev || selectedAttendee.hasWristband) {
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
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack} className="h-10 px-4">
          <ArrowLeft className="size-4 mr-2" />
          날짜 선택으로 돌아가기
        </Button>
        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            {title || `${formatDate(date)} 공연 팔찌 지급 시스템`}
          </h2>
          <p className="text-sm text-muted-foreground">운영자: 관리자</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          요청에 실패했습니다. 서버 상태 또는 토큰 설정을 확인해주세요.
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

          <Card className="p-3 bg-success/10 border border-success/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-success font-semibold mb-0.5">지급 완료</p>
                <p className="text-2xl font-bold text-foreground">
                  {statsLoading ? "-" : resolvedStats.issuedCount}
                  {!statsLoading && resolvedStats.totalTickets > 0 && (
                    <span className="text-sm text-success ml-1.5">
                      ({((resolvedStats.issuedCount / resolvedStats.totalTickets) * 100).toFixed(1)}%)
                    </span>
                  )}
                </p>
              </div>
              <span className="text-xl">✅</span>
            </div>
          </Card>

          <Card className="p-3 bg-[#fef0f6] border border-[#fcd6e4]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#d46995] font-semibold mb-0.5">미지급</p>
                <p className="text-2xl font-bold text-foreground">
                  {statsLoading ? "-" : resolvedStats.pendingCount}
                  {!statsLoading && resolvedStats.totalTickets > 0 && (
                    <span className="text-sm text-[#d46995] ml-1.5">
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
          <div className="space-y-4">
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
            <h3 className="font-semibold text-base mb-3">조회 결과</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-sm">학번</TableHead>
                  <TableHead className="text-sm">이름</TableHead>
                  <TableHead className="text-sm">단과대학</TableHead>
                  <TableHead className="text-sm">학과</TableHead>
                  <TableHead className="text-sm">팔찌 지급 여부</TableHead>
                  <TableHead className="text-sm">지급 버튼</TableHead>
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
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-danger/15 text-danger">
                          수령완료
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#fef0f6] text-[#d46995]">
                          미지급
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {student.hasWristband ? (
                        <span className="text-sm text-muted-foreground">지급 완료</span>
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
          </Card>
        )}

        <Card className="p-5 bg-[#fef0f6] border-2 border-[#fcd6e4] shadow-sm rounded-xl">
          <div className="flex gap-2.5">
            <div className="flex-shrink-0">
              <div className="w-7 h-7 rounded-lg bg-[#fcd6e4] flex items-center justify-center">
                <Info className="size-4 text-[#d46995]" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-foreground mb-2.5">
                팔찌 지급 절차 안내
              </h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-foreground text-xs">
                <div className="flex gap-1.5 leading-snug">
                  <span className="flex-shrink-0 font-semibold text-[#d46995]">1.</span>
                  <span>웹정보-기본정보 화면에서 얼굴 본인 확인</span>
                </div>
                <div className="flex gap-1.5 leading-snug">
                  <span className="flex-shrink-0 font-semibold text-[#d46995]">2.</span>
                  <span>웹정보-기본정보 화면에서 학번 확인</span>
                </div>
                <div className="flex gap-1.5 leading-snug">
                  <span className="flex-shrink-0 font-semibold text-[#d46995]">3.</span>
                  <span>
                    학번 조회 후{" "}
                    <span className="font-semibold text-[#d46995] bg-[#fcd6e4] px-1 py-0.5 rounded text-[11px]">
                      미지급
                    </span>
                    {" "}여부 확인
                  </span>
                </div>
                <div className="flex gap-1.5 leading-snug">
                  <span className="flex-shrink-0 font-semibold text-[#d46995]">4.</span>
                  <span>
                    <span className="font-semibold text-primary bg-primary-soft px-1 py-0.5 rounded text-[11px]">
                      [팔찌 주기]
                    </span>
                    {" "}버튼 클릭
                  </span>
                </div>
                <div className="flex gap-1.5 leading-snug">
                  <span className="flex-shrink-0 font-semibold text-[#d46995]">5.</span>
                  <span>
                    확인 팝업에서{" "}
                    <span className="font-semibold text-primary bg-primary-soft px-1 py-0.5 rounded text-[11px]">
                      [지급 확정]
                    </span>
                    {" "}클릭
                  </span>
                </div>
                <div className="flex gap-1.5 leading-snug">
                  <span className="flex-shrink-0 font-semibold text-[#d46995]">6.</span>
                  <span>
                    <span className="font-semibold text-danger bg-danger/10 px-1 py-0.5 rounded text-[11px]">
                      수령완료
                    </span>
                    {" "}확인 후 팔찌 전달
                  </span>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-[#fcd6e4]">
                <p className="text-[11px] text-[#d46995] flex items-start gap-1 leading-snug">
                  <span className="font-semibold text-danger">⚠</span>
                  <span>
                    <span className="font-semibold text-danger">중요:</span> 지급 처리 후 취소 불가능 - 반드시 학생 본인 확인 후 지급
                  </span>
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>팔찌 지급 확인</DialogTitle>
            <DialogDescription>
              해당 학생에게 팔찌를 지급 처리하시겠습니까? 지급 후에는 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={confirmIssue} disabled={issuing}>
              지급 확정
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
