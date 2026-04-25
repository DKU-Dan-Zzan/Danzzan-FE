// 역할: 관리자 지도 편집 화면에서 부스/단과대 좌표 조회와 저장 상호작용을 관리합니다.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  RefreshCcw,
  Save,
} from "lucide-react";
import {
  clearBoothLocation,
  getAdminMap,
  type AdminMapBooth,
  type AdminMapCollege,
  updateComingSoonOverlayEnabled,
  updateBoothLocation,
  updateCollegeLocation,
} from "@/api/app/admin/adminMapApi";
import useKakaoMapLoader from "@/hooks/app/boothmap/useKakaoMapLoader";
import { AdminMapSidebar } from "@/routes/admin/components/AdminMapSidebar";
import { AdminShell } from "@/components/layout/AdminShell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/common/ui/alert-dialog";
import {
  createAnchorDotContent,
  createLabelContent,
  createMarkerImage,
} from "@/routes/admin/adminMapMarkerUtils";
import type { EditorMode, SelectedItem } from "@/routes/admin/adminMapTypes";
import type {
  KakaoCustomOverlay,
  KakaoGlobal,
  KakaoMap,
  KakaoMarker,
  KakaoMouseEvent,
} from "@/types/app/boothmap/kakao-map";

declare global {
  interface Window {
    kakao: KakaoGlobal;
  }
}

export default function AdminMap() {
  const navigate = useNavigate();
  const { isLoaded: isKakaoLoaded } = useKakaoMapLoader();

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const mapClickHandlerRef = useRef<((mouseEvent: KakaoMouseEvent) => void) | null>(
    null,
  );
  const markerRefs = useRef<
    Array<{
      marker: KakaoMarker;
      overlay: KakaoCustomOverlay | null;
      dotOverlay: KakaoCustomOverlay;
    }>
  >([]);

  const [editorMode, setEditorMode] = useState<EditorMode>("idle");
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);

  const [colleges, setColleges] = useState<AdminMapCollege[]>([]);
  const [booths, setBooths] = useState<AdminMapBooth[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [comingSoonOverlaySaving, setComingSoonOverlaySaving] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [pendingClearBooth, setPendingClearBooth] = useState<{ id: number; name: string } | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>(
    "보기 모드입니다. 부스 편집 또는 단과대 편집 모드를 선택해 주세요."
  );

  const FESTIVAL_DATES = ["2026-05-12", "2026-05-13", "2026-05-14"];
  const [selectedDate, setSelectedDate] = useState<string>("2026-05-12");
  const [comingSoonOverlayEnabled, setComingSoonOverlayEnabled] = useState(false);

  const placedBooths = useMemo(
    () => booths.filter((booth) => booth.placed && booth.locationX != null && booth.locationY != null),
    [booths],
  );

  const unplacedBooths = useMemo(
    () => booths.filter((booth) => !booth.placed || booth.locationX == null || booth.locationY == null),
    [booths],
  );

  const selectedBooth =
    selectedItem?.kind === "booth"
      ? booths.find((booth) => booth.id === selectedItem.id) ?? null
      : null;

  const selectedCollege =
    selectedItem?.kind === "college"
      ? colleges.find((college) => college.id === selectedItem.id) ?? null
      : null;

  const loadMapData = useCallback(async (date?: string) => {
    try {
      setGlobalError(null);
      setLoading(true);

      const data = await getAdminMap(date);
      setColleges(data.colleges ?? []);
      setBooths(data.booths ?? []);
      setComingSoonOverlayEnabled(Boolean(data.comingSoonOverlayEnabled));
    } catch (error) {
      setGlobalError(
        error instanceof Error
          ? error.message
          : "지도 편집 데이터를 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMapData(selectedDate);
  }, [loadMapData, selectedDate]);

  const updateBoothState = useCallback((boothId: number, locationX: number | null, locationY: number | null) => {
    setBooths((prev) =>
      prev.map((booth) =>
        booth.id === boothId
          ? {
              ...booth,
              locationX,
              locationY,
              placed: locationX != null && locationY != null,
            }
          : booth,
      ),
    );
  }, []);

  const updateCollegeState = useCallback((collegeId: number, locationX: number, locationY: number) => {
    setColleges((prev) =>
      prev.map((college) =>
        college.id === collegeId
          ? {
              ...college,
              locationX,
              locationY,
            }
          : college,
      ),
    );
  }, []);

  const saveSelectedLocation = useCallback(
    async (lat: number, lng: number) => {
      if (!selectedItem) {
        setStatusMessage("왼쪽 목록에서 단과대 또는 부스를 먼저 선택해 주세요.");
        return;
      }

      if (selectedItem.kind === "booth" && editorMode !== "booth") {
        setStatusMessage("부스 편집 모드에서만 부스 위치를 변경할 수 있습니다.");
        return;
      }

      if (selectedItem.kind === "college" && editorMode !== "college") {
        setStatusMessage("단과대 편집 모드에서만 단과대 위치를 변경할 수 있습니다.");
        return;
      }

      try {
        setGlobalError(null);
        setSaving(true);

        if (selectedItem.kind === "booth") {
          await updateBoothLocation(selectedItem.id, lng, lat);
          updateBoothState(selectedItem.id, lng, lat);
          setStatusMessage("부스 위치를 저장했습니다.");
        } else {
          await updateCollegeLocation(selectedItem.id, lng, lat);
          updateCollegeState(selectedItem.id, lng, lat);
          setStatusMessage("단과대 위치를 저장했습니다.");
        }
      } catch (error) {
        setGlobalError(
          error instanceof Error ? error.message : "좌표를 저장하지 못했습니다.",
        );
      } finally {
        setSaving(false);
      }
    },
    [selectedItem, editorMode, updateBoothState, updateCollegeState],
  );

  useEffect(() => {
    if (loading) return;
    if (!isKakaoLoaded) return;
    if (!mapContainerRef.current) return;
    if (!window.kakao || !window.kakao.maps) return;
    if (mapRef.current) return;

    const kakao = window.kakao;
    const center = new kakao.maps.LatLng(37.3215, 127.1260);

    const map = new kakao.maps.Map(mapContainerRef.current, {
      center,
      level: 3,
    });

    mapRef.current = map;
  }, [loading, isKakaoLoaded]);

  useEffect(() => {
    if (!isKakaoLoaded) return;
    if (!mapRef.current || !window.kakao?.maps) return;

    const kakao = window.kakao;
    const map = mapRef.current;

    if (mapClickHandlerRef.current) {
      kakao.maps.event.removeListener(map, "click", mapClickHandlerRef.current);
    }

    const handleMapClick = (mouseEvent: KakaoMouseEvent) => {
      const latlng = mouseEvent.latLng;
      const lat = latlng.getLat();
      const lng = latlng.getLng();

      void saveSelectedLocation(lat, lng);
    };

    mapClickHandlerRef.current = handleMapClick;
    kakao.maps.event.addListener(map, "click", handleMapClick);

    return () => {
      if (mapClickHandlerRef.current) {
        kakao.maps.event.removeListener(map, "click", mapClickHandlerRef.current);
      }
    };
  }, [isKakaoLoaded, saveSelectedLocation]);

  useEffect(() => {
    if (!isKakaoLoaded) return;
    if (!mapRef.current || !window.kakao?.maps) return;

    const kakao = window.kakao;
    const map = mapRef.current;

    markerRefs.current.forEach(({ marker, overlay, dotOverlay }) => {
      marker?.setMap(null);
      overlay?.setMap(null);
      dotOverlay?.setMap(null);
    });
    markerRefs.current = [];

    const bounds = new kakao.maps.LatLngBounds();
    let hasPosition = false;

    colleges.forEach((college) => {
      if (college.locationX == null || college.locationY == null) return;

      const position = new kakao.maps.LatLng(college.locationY, college.locationX);
      const isSelected =
        selectedItem?.kind === "college" && selectedItem.id === college.id;
      const isEditable = editorMode === "college";
      const isDimmed = editorMode === "booth";

      const marker = new kakao.maps.Marker({
        map,
        position,
        draggable: isEditable,
        title: college.name,
        image: createMarkerImage(kakao, {
          kind: "college",
          selected: isSelected,
        }),
      });

      if (typeof marker.setZIndex === "function") {
        marker.setZIndex(isSelected ? 20 : 5);
      }
      if (typeof marker.setOpacity === "function") {
        marker.setOpacity(isDimmed ? 0.55 : 1);
      }

      const shouldShowCollegeLabel = editorMode === "college";

      const overlay = shouldShowCollegeLabel
        ? new kakao.maps.CustomOverlay({
            map,
            position,
            xAnchor: 0.5,
            yAnchor: 1,
            zIndex: isSelected ? 21 : 6,
            content: createLabelContent({
              kind: "college",
              name: college.name,
              selected: isSelected,
              dimmed: false,
            }),
          })
        : null;

      const dotOverlay = new kakao.maps.CustomOverlay({
        map,
        position,
        xAnchor: 0.5,
        yAnchor: 0.5,
        zIndex: isSelected ? 30 : 8,
        content: createAnchorDotContent(isSelected, "college"),
      });

      kakao.maps.event.addListener(marker, "click", () => {
        if (editorMode !== "college") {
          setStatusMessage("단과대 편집 모드에서만 단과대를 선택하고 이동할 수 있습니다.");
          return;
        }

        setSelectedItem({ kind: "college", id: college.id });
        setStatusMessage(`선택됨: ${college.name}`);
      });

      kakao.maps.event.addListener(marker, "dragend", () => {
        if (editorMode !== "college") return;

        const newPosition = marker.getPosition();
        const lat = newPosition.getLat();
        const lng = newPosition.getLng();

        setSelectedItem({ kind: "college", id: college.id });

        void (async () => {
          try {
            setSaving(true);
            setGlobalError(null);
            await updateCollegeLocation(college.id, lng, lat);
            updateCollegeState(college.id, lng, lat);
            setStatusMessage(`단과대 위치를 저장했습니다: ${college.name}`);
          } catch (error) {
            setGlobalError(
              error instanceof Error ? error.message : "단과대 위치 저장에 실패했습니다.",
            );
          } finally {
            setSaving(false);
          }
        })();
      });

      markerRefs.current.push({ marker, overlay, dotOverlay });
      bounds.extend(position);
      hasPosition = true;
    });

    placedBooths.forEach((booth) => {
      const position = new kakao.maps.LatLng(booth.locationY!, booth.locationX!);
      const isSelected =
        selectedItem?.kind === "booth" && selectedItem.id === booth.id;
      const isEditable = editorMode === "booth";
      const isDimmed = editorMode === "college";

      const marker = new kakao.maps.Marker({
        map,
        position,
        draggable: isEditable,
        title: booth.name,
        image: createMarkerImage(kakao, {
          kind: "booth",
          boothType: booth.type,
          selected: isSelected,
        }),
      });

      if (typeof marker.setZIndex === "function") {
        marker.setZIndex(isSelected ? 20 : 5);
      }
      if (typeof marker.setOpacity === "function") {
        marker.setOpacity(isDimmed ? 0.55 : 1);
      }

      const shouldShowBoothLabel = editorMode === "booth";

      const overlay = shouldShowBoothLabel
        ? new kakao.maps.CustomOverlay({
            map,
            position,
            xAnchor: 0.5,
            yAnchor: 1,
            zIndex: isSelected ? 21 : 6,
            content: createLabelContent({
              kind: "booth",
              name: booth.name,
              selected: isSelected,
              dimmed: false,
            }),
          })
        : null;

      const dotOverlay = new kakao.maps.CustomOverlay({
        map,
        position,
        xAnchor: 0.5,
        yAnchor: 0.5,
        zIndex: isSelected ? 30 : 8,
        content: createAnchorDotContent(isSelected, "college"),
      });

      kakao.maps.event.addListener(marker, "click", () => {
        if (editorMode !== "booth") {
          setStatusMessage("부스 편집 모드에서만 부스를 선택하고 이동할 수 있습니다.");
          return;
        }

        setSelectedItem({ kind: "booth", id: booth.id });
        setStatusMessage(`선택됨: ${booth.name}`);
      });

      kakao.maps.event.addListener(marker, "dragend", () => {
        if (editorMode !== "booth") return;

        const newPosition = marker.getPosition();
        const lat = newPosition.getLat();
        const lng = newPosition.getLng();

        setSelectedItem({ kind: "booth", id: booth.id });

        void (async () => {
          try {
            setSaving(true);
            setGlobalError(null);
            await updateBoothLocation(booth.id, lng, lat);
            updateBoothState(booth.id, lng, lat);
            setStatusMessage(`부스 위치를 저장했습니다: ${booth.name}`);
          } catch (error) {
            setGlobalError(
              error instanceof Error ? error.message : "부스 위치 저장에 실패했습니다.",
            );
          } finally {
            setSaving(false);
          }
        })();
      });

      markerRefs.current.push({ marker, overlay, dotOverlay });
      bounds.extend(position);
      hasPosition = true;
    });

    if (hasPosition) {
      map.setBounds(bounds);
    }

    return () => {
      markerRefs.current.forEach(({ marker, overlay, dotOverlay }) => {
        marker?.setMap(null);
        overlay?.setMap(null);
        dotOverlay?.setMap(null);
      });
      markerRefs.current = [];
    };
  }, [
    isKakaoLoaded,
    colleges,
    placedBooths,
    selectedItem,
    editorMode,
    updateBoothState,
    updateCollegeState,
  ]);

  const activateBoothMode = () => {
    setEditorMode("booth");
    if (selectedItem?.kind === "college") {
      setSelectedItem(null);
    }
    setStatusMessage("부스 편집 모드입니다. 부스만 선택/드래그할 수 있습니다.");
  };

  const activateCollegeMode = () => {
    setEditorMode("college");
    if (selectedItem?.kind === "booth") {
      setSelectedItem(null);
    }
    setStatusMessage("단과대 편집 모드입니다. 단과대만 선택/드래그할 수 있습니다.");
  };

  const handleSelectBooth = (boothId: number) => {
    setEditorMode("booth");
    setSelectedItem({ kind: "booth", id: boothId });
    setStatusMessage("부스가 선택되었습니다. 지도를 클릭하거나 해당 마커를 드래그해 위치를 지정해 주세요.");
  };

  const handleSelectCollege = (collegeId: number) => {
    setEditorMode("college");
    setSelectedItem({ kind: "college", id: collegeId });
    setStatusMessage("단과대가 선택되었습니다. 지도를 클릭하거나 해당 마커를 드래그해 위치를 지정해 주세요.");
  };

  const handleClearSelection = () => {
    setSelectedItem(null);
    setEditorMode("idle");
    setStatusMessage("보기 모드입니다. 편집하려면 부스 또는 단과대 편집 모드를 선택해 주세요.");
  };

  const handleChangeDate = async (date: string) => {
    try {
      setSaving(true);
      setGlobalError(null);

      setSelectedDate(date);
      setSelectedItem(null);
      setEditorMode("idle");
      setStatusMessage(`관리자 편집 날짜가 변경되었습니다. 현재 선택 날짜: ${date}`);
      await loadMapData(date);
    } catch (error) {
      setGlobalError(
        error instanceof Error ? error.message : "운영 날짜를 변경하지 못했습니다.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleClearBoothLocation = () => {
    if (!selectedBooth) return;
    setPendingClearBooth({ id: selectedBooth.id, name: selectedBooth.name });
  };

  const handleToggleComingSoonOverlay = useCallback(async (enabled: boolean) => {
    const previous = comingSoonOverlayEnabled;
    setComingSoonOverlayEnabled(enabled);

    try {
      setComingSoonOverlaySaving(true);
      setGlobalError(null);
      await updateComingSoonOverlayEnabled(enabled);
      setStatusMessage(
        enabled
          ? "타임테이블 Coming Soon 오버레이를 표시하도록 변경했습니다."
          : "타임테이블 Coming Soon 오버레이를 숨기도록 변경했습니다.",
      );
    } catch (error) {
      setComingSoonOverlayEnabled(previous);
      setGlobalError(
        error instanceof Error ? error.message : "타임테이블 오버레이 설정을 저장하지 못했습니다.",
      );
    } finally {
      setComingSoonOverlaySaving(false);
    }
  }, [comingSoonOverlayEnabled]);

  const confirmClearBoothLocation = async () => {
    if (!pendingClearBooth) {
      return;
    }

    try {
      setSaving(true);
      setGlobalError(null);
      await clearBoothLocation(pendingClearBooth.id);
      updateBoothState(pendingClearBooth.id, null, null);
      setSelectedItem(null);
      setEditorMode("idle");
      setStatusMessage(`부스 좌표를 제거했습니다: ${pendingClearBooth.name}`);
      setPendingClearBooth(null);
    } catch (error) {
      setGlobalError(
        error instanceof Error ? error.message : "부스 좌표 제거에 실패했습니다.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <AdminShell
      title="지도 편집 관리자 페이지"
      headerClassName="sticky top-0 z-20 border-b border-[var(--border-base)] bg-[var(--admin-header-bg)]"
      mainClassName="mx-auto grid w-full max-w-[1360px] gap-6 px-6 py-6 lg:grid-cols-[360px_minmax(0,1fr)]"
      actions={
        <>
          <button
            type="button"
            onClick={() => navigate("/admin")}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-[var(--border-base)] bg-white px-3 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface-subtle)]"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.3} />
            관리자 홈
          </button>

          <button
            type="button"
            onClick={() => void loadMapData(selectedDate)}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-[var(--border-base)] bg-white px-3 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface-subtle)]"
          >
            <RefreshCcw className="h-4 w-4" strokeWidth={2.3} />
            새로고침
          </button>

          <button
            type="button"
            disabled
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-[var(--accent)] px-3 text-sm font-medium text-white opacity-70"
          >
            <Save className="h-4 w-4" strokeWidth={2.3} />
            {saving ? "저장 중..." : "즉시 저장"}
          </button>
        </>
      }
    >
        <AdminMapSidebar
          globalError={globalError}
          festivalDates={FESTIVAL_DATES}
          selectedDate={selectedDate}
          editorMode={editorMode}
          statusMessage={statusMessage}
          comingSoonOverlayEnabled={comingSoonOverlayEnabled}
          comingSoonOverlaySaving={comingSoonOverlaySaving}
          unplacedBooths={unplacedBooths}
          colleges={colleges}
          selectedItem={selectedItem}
          selectedBooth={selectedBooth}
          selectedCollege={selectedCollege}
          onChangeDate={(date) => {
            void handleChangeDate(date);
          }}
          onActivateBoothMode={activateBoothMode}
          onActivateCollegeMode={activateCollegeMode}
          onClearSelection={handleClearSelection}
          onToggleComingSoonOverlay={(enabled) => {
            void handleToggleComingSoonOverlay(enabled);
          }}
          onSelectBooth={handleSelectBooth}
          onSelectCollege={handleSelectCollege}
          onClearBoothLocation={handleClearBoothLocation}
        />

        <section className="rounded-2xl border border-[var(--border-base)] bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[var(--text)]">지도 편집 영역</h2>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                마커 클릭 또는 왼쪽 목록 선택 후 지도를 클릭하면 위치가 바뀝니다. 마커 드래그도 가능합니다.
              </p>
            </div>

            <span className="rounded-full border border-[var(--border-base)] bg-[var(--surface-subtle)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-muted)]">
              {saving ? "저장 중" : "즉시 저장"}
            </span>
          </div>

          <div className="relative min-h-[720px] overflow-hidden rounded-2xl border border-[var(--border-base)]">
            <div ref={mapContainerRef} className="h-[720px] w-full" />

            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface-subtle)]/90">
                <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.3} />
                  지도 데이터를 불러오는 중입니다...
                </div>
              </div>
            )}
          </div>
        </section>
    </AdminShell>
    <AlertDialog
      open={Boolean(pendingClearBooth)}
      onOpenChange={(open) => {
        if (!open && !saving) {
          setPendingClearBooth(null);
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>부스 좌표 제거</AlertDialogTitle>
          <AlertDialogDescription>
            선택한 부스의 지도 좌표를 제거하시겠습니까?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving}>취소</AlertDialogCancel>
          <AlertDialogAction
            disabled={saving}
            onClick={(event) => {
              event.preventDefault();
              void confirmClearBoothLocation();
            }}
          >
            {saving ? "처리 중..." : "제거"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
