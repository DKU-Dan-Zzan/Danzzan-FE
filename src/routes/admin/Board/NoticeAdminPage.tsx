import { useEffect, useState } from "react";
import { Button } from "@/components/common/ui/button";
import { Card } from "@/components/common/ui/card";
import { Input } from "@/components/common/ui/input";
import { Label } from "@/components/common/ui/label";
import { Textarea } from "@/components/common/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/common/ui/table";
import { useBoard } from "@/hooks/useBoard";
import type { Notice } from "@/types/model/board.model";

export default function NoticeAdminPage() {
  const { loading, error, listNotices, createNotice } = useBoard();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const isFormValid = title.trim().length > 0 && content.trim().length > 0;

  useEffect(() => {
    listNotices().then(setNotices).catch(() => undefined);
  }, [listNotices]);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setAuthor("");
    setIsUrgent(false);
  };

  const handleCreate = async () => {
    try {
      const safeAuthor = author.trim() || "운영팀";
      const created = await createNotice({
        title,
        content,
        author: safeAuthor,
        isUrgent,
      });

      const normalized: Notice = {
        id: created.id || `local-${Date.now()}`,
        title: created.title || title,
        content: created.content || content,
        author: created.author || safeAuthor,
        createdAt: created.createdAt || new Date().toISOString(),
        isUrgent: created.isUrgent ?? isUrgent,
        imageUrl: created.imageUrl || "",
      };

      setNotices((prev) => [normalized, ...prev]);
      resetForm();
      setShowForm(false);
    } catch {
      // Error handled in hook state.
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">공지사항 관리</h2>
          <p className="text-sm text-gray-500">학생 앱에 노출되는 공지를 등록합니다.</p>
        </div>
        <Button onClick={() => setShowForm((prev) => !prev)}>
          {showForm ? "작성 닫기" : "새 공지 작성"}
        </Button>
      </div>

      {error && (
        <Card className="p-4 border border-red-200 bg-red-50 text-sm text-red-700">
          {error.message}
        </Card>
      )}

      {showForm && (
        <Card className="p-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="notice-title">제목</Label>
              <Input
                id="notice-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="공지 제목을 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notice-author">작성자</Label>
              <Input
                id="notice-author"
                value={author}
                onChange={(event) => setAuthor(event.target.value)}
                placeholder="작성 주체"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notice-content">내용</Label>
            <Textarea
              id="notice-content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="공지 내용을 입력하세요"
              className="min-h-[140px]"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={isUrgent}
              onChange={(event) => setIsUrgent(event.target.checked)}
            />
            긴급 공지로 등록
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={resetForm}>
              초기화
            </Button>
            <Button onClick={handleCreate} disabled={loading || !isFormValid}>
              등록
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>제목</TableHead>
              <TableHead>작성자</TableHead>
              <TableHead>작성일</TableHead>
              <TableHead>긴급</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notices.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-gray-500">
                  등록된 공지가 없습니다.
                </TableCell>
              </TableRow>
            )}
            {notices.map((notice) => (
              <TableRow key={notice.id}>
                <TableCell className="font-medium text-gray-900">{notice.title}</TableCell>
                <TableCell>{notice.author || "-"}</TableCell>
                <TableCell>{notice.createdAt ? new Date(notice.createdAt).toLocaleString() : "-"}</TableCell>
                <TableCell>{notice.isUrgent ? "긴급" : "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
