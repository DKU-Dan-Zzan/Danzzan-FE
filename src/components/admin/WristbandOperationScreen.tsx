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
  date: string;
  onBack: () => void;
}

export function WristbandOperationScreen({ date, onBack }: WristbandOperationScreenProps) {
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
    getStats(date)
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
  }, [date, getStats]);

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
      const result = await findAttendee(keyword, date);
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
      const identifier = selectedAttendee.ticketId || selectedAttendee.studentId;
      await issueWristband(identifier, date);
      setSearchResults((prev) =>
        prev.map((item) =>
          item.studentId === selectedAttendee.studentId
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
          <h2 className="text-2xl font-semibold text-gray-900">
            {formatDate(date)} 공연 팔찌 지급 시스템
          </h2>
          <p className="text-sm text-gray-500">운영자: 관리자</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          요청에 실패했습니다. 서버 상태 또는 토큰 설정을 확인해주세요.
        </div>
      )}

      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 bg-blue-50 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-700 font-semibold mb-0.5">전체 티켓</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? "-" : resolvedStats.totalTickets}
                </p>
              </div>
              <span className="text-xl">🎫</span>
            </div>
          </Card>

          <Card className="p-3 bg-green-50 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-700 font-semibold mb-0.5">지급 완료</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? "-" : resolvedStats.issuedCount}
                  {!statsLoading && resolvedStats.totalTickets > 0 && (
                    <span className="text-sm text-green-600 ml-1.5">
                      ({((resolvedStats.issuedCount / resolvedStats.totalTickets) * 100).toFixed(1)}%)
                    </span>
                  )}
                </p>
              </div>
              <span className="text-xl">✅</span>
            </div>
          </Card>

          <Card className="p-3 bg-amber-50 border border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-700 font-semibold mb-0.5">미지급</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? "-" : resolvedStats.pendingCount}
                  {!statsLoading && resolvedStats.totalTickets > 0 && (
                    <span className="text-sm text-amber-600 ml-1.5">
                      ({((resolvedStats.pendingCount / resolvedStats.totalTickets) * 100).toFixed(1)}%)
                    </span>
                  )}
                </p>
              </div>
              <span className="text-xl">⏳</span>
            </div>
          </Card>
        </div>

        <Card className="p-8">
          <div className="space-y-5">
            <Label className="text-lg font-medium">학생 티켓 학번/티켓ID로 조회</Label>
            <div className="flex gap-4">
              <Input
                placeholder="학번 또는 티켓ID 입력"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 h-14 text-lg"
              />
              <Button
                className="bg-blue-600 hover:bg-blue-700 px-12 h-14 text-lg"
                onClick={handleSearch}
                disabled={searching}
              >
                {searching ? "조회 중..." : "조회"}
              </Button>
            </div>
          </div>
        </Card>

        {hasSearched && searchResults.length === 0 && (
          <Card className="p-6 text-sm text-gray-500">조회 결과가 없습니다.</Card>
        )}

        {searchResults.length > 0 && (
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">조회 결과</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-base">학번</TableHead>
                  <TableHead className="text-base">티켓ID / 순번</TableHead>
                  <TableHead className="text-base">이름</TableHead>
                  <TableHead className="text-base">단과대학</TableHead>
                  <TableHead className="text-base">학과</TableHead>
                  <TableHead className="text-base">팔찌 지급 여부 (상태)</TableHead>
                  <TableHead className="text-base">지급 버튼</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {searchResults.map((student) => (
                  <TableRow key={`${student.studentId}-${student.ticketId}`}>
                    <TableCell className="font-medium text-base">{student.studentId}</TableCell>
                    <TableCell className="text-base">
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-gray-900">
                          {student.ticketId || "-"}
                        </div>
                        <div className="text-xs text-gray-500">
                          순번: {student.queueNumber ?? "-"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-base">{student.name}</TableCell>
                    <TableCell className="text-base">{student.college}</TableCell>
                    <TableCell className="text-base">{student.department}</TableCell>
                    <TableCell>
                      {student.hasWristband ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                          수령완료
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          미지급
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {student.hasWristband ? (
                        <span className="text-sm text-gray-400">지급 완료</span>
                      ) : (
                        <Button
                          size="default"
                          className="bg-blue-600 hover:bg-blue-700 h-10 px-6"
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

        <Card className="p-5 bg-amber-50/60 border-2 border-amber-200/80 shadow-sm rounded-xl">
          <div className="flex gap-2.5">
            <div className="flex-shrink-0">
              <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                <Info className="size-4 text-amber-700" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-gray-900 mb-2.5">
                팔찌 지급 절차 안내
              </h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-gray-800 text-xs">
                <div className="flex gap-1.5 leading-snug">
                  <span className="flex-shrink-0 font-semibold text-amber-700">1.</span>
                  <span>웹정보-기본정보 화면에서 얼굴 본인 확인</span>
                </div>
                <div className="flex gap-1.5 leading-snug">
                  <span className="flex-shrink-0 font-semibold text-amber-700">2.</span>
                  <span>웹정보-기본정보 화면에서 학번 확인</span>
                </div>
                <div className="flex gap-1.5 leading-snug">
                  <span className="flex-shrink-0 font-semibold text-amber-700">3.</span>
                  <span>
                    학번 조회 후{" "}
                    <span className="font-semibold text-green-700 bg-green-100 px-1 py-0.5 rounded text-[11px]">
                      미지급
                    </span>
                    {" "}여부 확인
                  </span>
                </div>
                <div className="flex gap-1.5 leading-snug">
                  <span className="flex-shrink-0 font-semibold text-amber-700">4.</span>
                  <span>
                    <span className="font-semibold text-blue-700 bg-blue-100 px-1 py-0.5 rounded text-[11px]">
                      [팔찌 주기]
                    </span>
                    {" "}버튼 클릭
                  </span>
                </div>
                <div className="flex gap-1.5 leading-snug">
                  <span className="flex-shrink-0 font-semibold text-amber-700">5.</span>
                  <span>
                    확인 팝업에서{" "}
                    <span className="font-semibold text-blue-700 bg-blue-100 px-1 py-0.5 rounded text-[11px]">
                      [지급 확정]
                    </span>
                    {" "}클릭
                  </span>
                </div>
                <div className="flex gap-1.5 leading-snug">
                  <span className="flex-shrink-0 font-semibold text-amber-700">6.</span>
                  <span>
                    <span className="font-semibold text-red-700 bg-red-100 px-1 py-0.5 rounded text-[11px]">
                      수령완료
                    </span>
                    {" "}확인 후 팔찌 전달
                  </span>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-amber-200">
                <p className="text-[11px] text-amber-900 flex items-start gap-1 leading-snug">
                  <span className="font-semibold text-red-600">⚠</span>
                  <span>
                    <span className="font-semibold text-red-700">중요:</span> 지급 처리 후 취소 불가능 - 반드시 학생 본인 확인 후 지급
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
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={confirmIssue} disabled={issuing}>
              지급 확정
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
