import { useEffect, useState } from "react";
import { Button } from "@/components/common/ui/button";
import { Card } from "@/components/common/ui/card";
import { Input } from "@/components/common/ui/input";
import { Label } from "@/components/common/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/common/ui/table";
import { useBoard } from "@/hooks/useBoard";
import type { LostFoundItem } from "@/types/model/board.model";

export default function LostFoundAdminPage() {
  const { loading, error, listLostItems, createLostItem, updateLostItemClaimed } = useBoard();
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [foundLocation, setFoundLocation] = useState("");
  const [foundDate, setFoundDate] = useState("");
  const [description, setDescription] = useState("");
  const isFormValid = name.trim().length > 0 && foundLocation.trim().length > 0;

  useEffect(() => {
    listLostItems().then(setItems).catch(() => undefined);
  }, [listLostItems]);

  const resetForm = () => {
    setName("");
    setFoundLocation("");
    setFoundDate("");
    setDescription("");
  };

  const handleCreate = async () => {
    try {
      const safeDate = foundDate.trim() || new Date().toISOString().slice(0, 10);
      const created = await createLostItem({
        name,
        foundLocation,
        foundDate: safeDate,
        description,
      });

      const normalized: LostFoundItem = {
        id: created.id || `local-${Date.now()}`,
        name: created.name || name,
        description: created.description || description,
        foundLocation: created.foundLocation || foundLocation,
        foundDate: created.foundDate || safeDate,
        isClaimed: created.isClaimed ?? false,
        imageUrl: created.imageUrl || "",
      };

      setItems((prev) => [normalized, ...prev]);
      resetForm();
      setShowForm(false);
    } catch {
      // Error handled in hook state.
    }
  };

  const handleToggleClaim = async (item: LostFoundItem) => {
    const nextValue = !item.isClaimed;
    setItems((prev) =>
      prev.map((current) =>
        current.id === item.id ? { ...current, isClaimed: nextValue } : current,
      ),
    );

    try {
      await updateLostItemClaimed(item.id, nextValue);
    } catch {
      setItems((prev) =>
        prev.map((current) =>
          current.id === item.id ? { ...current, isClaimed: item.isClaimed } : current,
        ),
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">분실물 관리</h2>
          <p className="text-sm text-gray-500">습득물 등록 및 인수 여부를 관리합니다.</p>
        </div>
        <Button onClick={() => setShowForm((prev) => !prev)}>
          {showForm ? "등록 닫기" : "분실물 등록"}
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
              <Label htmlFor="lost-name">물품명</Label>
              <Input
                id="lost-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="예: 카드지갑"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lost-location">습득 장소</Label>
              <Input
                id="lost-location"
                value={foundLocation}
                onChange={(event) => setFoundLocation(event.target.value)}
                placeholder="예: 중앙 무대 앞"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lost-date">습득 일시</Label>
              <Input
                id="lost-date"
                value={foundDate}
                onChange={(event) => setFoundDate(event.target.value)}
                placeholder="YYYY-MM-DD"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lost-description">특이사항</Label>
              <Input
                id="lost-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="색상, 특징 등"
              />
            </div>
          </div>
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
              <TableHead>물품명</TableHead>
              <TableHead>습득 장소</TableHead>
              <TableHead>습득 일시</TableHead>
              <TableHead>인수 여부</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-gray-500">
                  등록된 분실물이 없습니다.
                </TableCell>
              </TableRow>
            )}
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium text-gray-900">{item.name}</TableCell>
                <TableCell>{item.foundLocation || "-"}</TableCell>
                <TableCell>{item.foundDate || "-"}</TableCell>
                <TableCell>
                  <Button
                    variant={item.isClaimed ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => handleToggleClaim(item)}
                  >
                    {item.isClaimed ? "인수 완료" : "미인수"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
