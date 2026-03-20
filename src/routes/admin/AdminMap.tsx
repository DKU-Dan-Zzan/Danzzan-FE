import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  Map,
  MapPin,
  RefreshCcw,
  Save,
  School,
  Tent,
  Trash2,
} from "lucide-react";
import {
  clearBoothLocation,
  getAdminMap,
  type AdminMapBooth,
  type AdminMapCollege,
  updateBoothLocation,
  updateCollegeLocation,
  updateActiveOperationDate,
} from "../../api/adminMapApi";
import useKakaoMapLoader from "../../hooks/useKakaoMapLoader";
import { AdminShell } from "@/components/layout/AdminShell";

declare global {
  interface Window {
    kakao: any;
  }
}

function createCollegeMarkerSvg(selected: boolean) {
  const stroke = selected ? "#1d4ed8" : "#1e40af";
  const fill = selected ? "#dbeafe" : "#eff6ff";

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg width="44" height="52" viewBox="0 0 44 52" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 50C22 50 38 33.8 38 21C38 11.6112 30.3888 4 21 4C11.6112 4 4 11.6112 4 21C4 33.8 22 50 22 50Z"
        fill="${fill}" stroke="${stroke}" stroke-width="3"/>
      <path d="M14 20.5L22 15L30 20.5V29.5H14V20.5Z" fill="${stroke}"/>
      <rect x="19.5" y="21.5" width="5" height="8" rx="1" fill="white"/>
    </svg>
  `)}`;
}

function getBoothColor(type?: string) {
  if (type === "FOOD_TRUCK") return "#ef4444";
  if (type === "EXPERIENCE") return "#10b981";
  if (type === "EVENT") return "#f6da3b";
  if (type === "FACILITY") return "#3b82f6";
  return "#10b981";
}

function createBoothMarkerSvg(type: string | undefined, selected: boolean) {
  const mainColor = getBoothColor(type);
  const stroke = selected ? "#111827" : mainColor;
  const fill = selected ? "#ffffff" : mainColor;
  const inner = selected ? mainColor : "#ffffff";

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg width="44" height="52" viewBox="0 0 44 52" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 50C22 50 38 33.8 38 21C38 11.6112 30.3888 4 21 4C11.6112 4 4 11.6112 4 21C4 33.8 22 50 22 50Z"
        fill="${fill}" stroke="${stroke}" stroke-width="3"/>
      <circle cx="21" cy="21" r="7" fill="${inner}" />
    </svg>
  `)}`;
}

function createMarkerImage(
  kakao: any,
  options: {
    kind: "booth" | "college";
    boothType?: string;
    selected: boolean;
  },
) {
  const width = options.selected ? 44 : 36;
  const height = options.selected ? 52 : 44;

  const size = new kakao.maps.Size(width, height);
  const offset = new kakao.maps.Point(width / 2, height);

  const src =
    options.kind === "college"
      ? createCollegeMarkerSvg(options.selected)
      : createBoothMarkerSvg(options.boothType, options.selected);

  return new kakao.maps.MarkerImage(src, size, { offset });
}

function createLabelContent(options: {
  name: string;
  kind: "booth" | "college";
  selected: boolean;
  dimmed: boolean;
}) {
  const accent = options.kind === "college" ? "#2563eb" : "#10b981";
  const background = options.selected ? accent : "#ffffff";
  const color = options.selected ? "#ffffff" : "#111827";
  const border = options.selected ? accent : "#d1d5db";
  const opacity = options.dimmed ? 0.55 : 1;

  return `
    <div style="
      pointer-events:none;
      transform: translateY(-52px);
      opacity:${opacity};
    ">
      <div style="
        display:inline-flex;
        align-items:center;
        max-width:180px;
        padding:6px 10px;
        border-radius:999px;
        border:1px solid ${border};
        background:${background};
        color:${color};
        font-size:12px;
        font-weight:700;
        line-height:1;
        white-space:nowrap;
        box-shadow:0 6px 14px rgba(15,23,42,0.12);
      ">
        ${options.name}
      </div>
    </div>
  `;
}

function createAnchorDotContent(selected: boolean, kind: "booth" | "college") {
  const color = kind === "college" ? "#2563eb" : "#10b981";
  const size = selected ? 10 : 8;
  const border = selected ? "#111827" : "#ffffff";

  return `
    <div style="
      width:${size}px;
      height:${size}px;
      border-radius:999px;
      background:${color};
      border:2px solid ${border};
      box-shadow:0 2px 6px rgba(15,23,42,0.18);
      pointer-events:none;
    "></div>
  `;
}

type EditorMode = "idle" | "booth" | "college";
type SelectedItem =
  | { kind: "booth"; id: number }
  | { kind: "college"; id: number }
  | null;

export default function AdminMap() {
  const navigate = useNavigate();
  const { isLoaded: isKakaoLoaded, isError: isKakaoError } = useKakaoMapLoader();

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const mapClickHandlerRef = useRef<((mouseEvent: any) => void) | null>(null);
  const markerRefs = useRef<Array<{ marker: any; overlay: any | null; dotOverlay: any }>>([]);

  const [editorMode, setEditorMode] = useState<EditorMode>("idle");
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);

  const [colleges, setColleges] = useState<AdminMapCollege[]>([]);
  const [booths, setBooths] = useState<AdminMapBooth[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>(
    "보기 모드입니다. 부스 편집 또는 단과대 편집 모드를 선택해 주세요."
  );

  const FESTIVAL_DATES = ["2026-05-12", "2026-05-13", "2026-05-14"];
  const [selectedDate, setSelectedDate] = useState<string>("2026-05-12");

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

  const selectedInfo = selectedBooth ?? selectedCollege;

  const loadMapData = useCallback(async (date?: string) => {
    try {
      setGlobalError(null);
      setLoading(true);

      const data = await getAdminMap(date);
      setColleges(data.colleges ?? []);
      setBooths(data.booths ?? []);
      // setSelectedDate(data.activeOperationDate ?? date ?? "2026-05-12");
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
    void loadMapData();
  }, [loadMapData]);

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

    const handleMapClick = (mouseEvent: any) => {
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
    });

    let hasPosition = false;

    // college/booth loop 안에서 bounds.extend(position) 할 때
    hasPosition = true;

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

      // await updateActiveOperationDate(date);
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

  const handleClearBoothLocation = async () => {
    if (!selectedBooth) return;

    const confirmed = window.confirm("이 부스의 지도 좌표를 제거하시겠습니까?");
    if (!confirmed) return;

    try {
      setSaving(true);
      setGlobalError(null);
      await clearBoothLocation(selectedBooth.id);
      updateBoothState(selectedBooth.id, null, null);
      setSelectedItem(null);
      setEditorMode("idle");
      setStatusMessage("부스 좌표를 제거했습니다.");
    } catch (error) {
      setGlobalError(
        error instanceof Error ? error.message : "부스 좌표 제거에 실패했습니다.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
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
            onClick={() => void loadMapData()}
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
        <aside className="space-y-4">
          {globalError && (
            <div className="flex items-start gap-2 rounded-2xl border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] px-3 py-3 text-sm text-[var(--status-danger-text)]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.3} />
              <p>{globalError}</p>
            </div>
          )}

          <section className="rounded-2xl border border-[var(--border-base)] bg-white p-4 shadow-sm">
            <h2 className="text-sm font-bold text-[var(--text)]">현재 운영 일차</h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              여기서 선택한 날짜는 관리자 지도 편집 기준입니다.
            </p>

            <div className="mt-3 flex gap-2">
              {FESTIVAL_DATES.map((date) => {
                const isSelected = selectedDate === date;

                return (
                  <button
                    key={date}
                    type="button"
                    onClick={() => void handleChangeDate(date)}
                    className={`rounded-2xl px-4 py-2 text-sm font-semibold transition-colors ${
                      isSelected
                        ? "bg-[var(--accent)] text-white"
                        : "border border-[var(--border-base)] bg-[var(--surface-subtle)] text-[var(--text)] hover:bg-[var(--border-base)]"
                    }`}
                  >
                    {date}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border-base)] bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Map className="h-4 w-4 text-[var(--accent)]" strokeWidth={2.3} />
              <h2 className="text-sm font-bold text-[var(--text)]">편집 도구</h2>
            </div>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              부스 편집 모드에서는 부스만, 단과대 편집 모드에서는 단과대만 이동할 수 있습니다.
            </p>

            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={activateBoothMode}
                className={`flex items-center gap-2 rounded-2xl border px-3 py-3 text-sm font-semibold transition-colors ${
                  editorMode === "booth"
                    ? "border-[var(--accent)] bg-[var(--accent)]/5 text-[var(--accent)]"
                    : "border-[var(--border-base)] bg-[var(--surface-subtle)] text-[var(--text)] hover:bg-[var(--border-base)]"
                }`}
              >
                <Tent className="h-4 w-4" strokeWidth={2.3} />
                부스 편집 모드
              </button>

              <button
                type="button"
                onClick={activateCollegeMode}
                className={`flex items-center gap-2 rounded-2xl border px-3 py-3 text-sm font-semibold transition-colors ${
                  editorMode === "college"
                    ? "border-[var(--accent)] bg-[var(--accent)]/5 text-[var(--accent)]"
                    : "border-[var(--border-base)] bg-[var(--surface-subtle)] text-[var(--text)] hover:bg-[var(--border-base)]"
                }`}
              >
                <School className="h-4 w-4" strokeWidth={2.3} />
                단과대 편집 모드
              </button>

              <button
                type="button"
                onClick={handleClearSelection}
                className="flex items-center gap-2 rounded-2xl border border-[var(--border-base)] bg-white px-3 py-3 text-sm font-semibold text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-subtle)]"
              >
                <Trash2 className="h-4 w-4" strokeWidth={2.3} />
                선택 해제
              </button>
            </div>

            <div className="mt-4 rounded-2xl bg-[var(--surface-subtle)] px-3 py-3 text-xs leading-5 text-[var(--text-muted)]">
              {statusMessage || "왼쪽 목록에서 항목을 선택하면 편집 안내가 여기에 표시됩니다."}
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border-base)] bg-white p-4 shadow-sm">
            <h2 className="text-sm font-bold text-[var(--text)]">배치 안 된 부스</h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              먼저 선택한 뒤 지도에서 위치를 지정해 주세요.
            </p>

            <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
              {unplacedBooths.length === 0 && (
                <div className="rounded-2xl bg-[var(--surface-subtle)] px-3 py-4 text-center text-sm text-[var(--text-muted)]">
                  배치되지 않은 부스가 없습니다.
                </div>
              )}

              {unplacedBooths.map((booth) => {
                const isSelected =
                  selectedItem?.kind === "booth" && selectedItem.id === booth.id;

                return (
                  <button
                    key={booth.id}
                    type="button"
                    onClick={() => handleSelectBooth(booth.id)}
                    className={`w-full rounded-2xl border px-3 py-3 text-left transition-colors ${
                      isSelected
                        ? "border-[var(--accent)] bg-[var(--accent)]/10 ring-2 ring-[var(--accent)]/20"
                        : "border-[var(--border-base)] bg-[var(--surface-subtle)] hover:bg-[var(--border-base)]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-[var(--text)]">
                        {booth.name}
                      </span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-[var(--text-muted)]">
                        {booth.type}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border-base)] bg-white p-4 shadow-sm">
            <h2 className="text-sm font-bold text-[var(--text)]">단과대 목록</h2>

            <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
              {colleges.map((college) => {
                const isSelected =
                  selectedItem?.kind === "college" && selectedItem.id === college.id;

                return (
                  <button
                    key={college.id}
                    type="button"
                    onClick={() => handleSelectCollege(college.id)}
                    className={`w-full rounded-2xl border px-3 py-3 text-left transition-colors ${
                      isSelected
                        ? "border-[var(--accent)] bg-[var(--accent)]/10 ring-2 ring-[var(--accent)]/20"
                        : "border-[var(--border-base)] bg-[var(--surface-subtle)] hover:bg-[var(--border-base)]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-[var(--text)]">
                        {college.name}
                      </span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-[var(--text-muted)]">
                        {college.locationX != null && college.locationY != null ? "배치됨" : "미배치"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border-base)] bg-white p-4 shadow-sm">
            <h2 className="text-sm font-bold text-[var(--text)]">선택된 항목 정보</h2>

            <div className="mt-3 rounded-2xl border border-dashed border-[var(--border-base)] bg-[var(--surface-subtle)] px-4 py-6">
              {!selectedInfo && (
                <div className="text-center">
                  <MapPin className="mx-auto h-5 w-5 text-[var(--text-muted)]" strokeWidth={2.3} />
                  <p className="mt-2 text-sm font-semibold text-[var(--text-muted)]">
                    아직 선택된 항목이 없습니다
                  </p>
                </div>
              )}

              {selectedBooth && (
                <div className="space-y-2">
                  <p className="text-sm font-bold text-[var(--text)]">{selectedBooth.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">유형: {selectedBooth.type}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    경도(X): {selectedBooth.locationX ?? "-"}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    위도(Y): {selectedBooth.locationY ?? "-"}
                  </p>

                  <button
                    type="button"
                    onClick={() => void handleClearBoothLocation()}
                    className="mt-2 inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2.3} />
                    부스 좌표 제거
                  </button>
                </div>
              )}

              {selectedCollege && (
                <div className="space-y-2">
                  <p className="text-sm font-bold text-[var(--text)]">{selectedCollege.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    경도(X): {selectedCollege.locationX ?? "-"}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    위도(Y): {selectedCollege.locationY ?? "-"}
                  </p>
                </div>
              )}
            </div>
          </section>
        </aside>

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
  );
}
