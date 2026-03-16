import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Map,
  MapPin,
  Save,
  Store,
  Tent,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";

type EditorMode = "idle" | "booth" | "pub" | "facility";

export default function AdminMap() {
  const navigate = useNavigate();

  const [editorMode, setEditorMode] = useState<EditorMode>("idle");

  return (
    <div className="min-h-dvh bg-[var(--bg-base)]">
      <header className="sticky top-0 z-20 border-b border-[var(--border-base)] bg-[var(--bg-base)]">
        <div className="mx-auto flex w-full max-w-[1360px] items-center justify-between px-8 py-3">
          <div>
            <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              ADMIN PORTAL
            </p>
            <h1 className="text-2xl font-semibold text-[var(--text)]">
              지도 편집 관리자 페이지
            </h1>
          </div>

          <div className="flex items-center gap-2">
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
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-[var(--accent)] px-3 text-sm font-medium text-white transition-colors hover:brightness-95"
            >
              <Save className="h-4 w-4" strokeWidth={2.3} />
              저장
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1360px] gap-6 px-6 py-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* 왼쪽 편집 패널 */}
        <aside className="space-y-4">
          <section className="rounded-2xl border border-[var(--border-base)] bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Map className="h-4 w-4 text-[var(--accent)]" strokeWidth={2.3} />
              <h2 className="text-sm font-bold text-[var(--text)]">편집 도구</h2>
            </div>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              추가할 항목 종류를 선택한 뒤 지도에서 위치를 지정할 수 있도록 확장할 예정입니다.
            </p>

            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setEditorMode("booth")}
                className={`flex items-center gap-2 rounded-2xl border px-3 py-3 text-sm font-semibold transition-colors ${
                  editorMode === "booth"
                    ? "border-[var(--accent)] bg-[var(--accent)]/5 text-[var(--accent)]"
                    : "border-[var(--border-base)] bg-[var(--surface-subtle)] text-[var(--text)] hover:bg-[var(--border-base)]"
                }`}
              >
                <Tent className="h-4 w-4" strokeWidth={2.3} />
                부스 추가 모드
              </button>

              <button
                type="button"
                onClick={() => setEditorMode("pub")}
                className={`flex items-center gap-2 rounded-2xl border px-3 py-3 text-sm font-semibold transition-colors ${
                  editorMode === "pub"
                    ? "border-[var(--accent)] bg-[var(--accent)]/5 text-[var(--accent)]"
                    : "border-[var(--border-base)] bg-[var(--surface-subtle)] text-[var(--text)] hover:bg-[var(--border-base)]"
                }`}
              >
                <UtensilsCrossed className="h-4 w-4" strokeWidth={2.3} />
                주점 추가 모드
              </button>

              <button
                type="button"
                onClick={() => setEditorMode("facility")}
                className={`flex items-center gap-2 rounded-2xl border px-3 py-3 text-sm font-semibold transition-colors ${
                  editorMode === "facility"
                    ? "border-[var(--accent)] bg-[var(--accent)]/5 text-[var(--accent)]"
                    : "border-[var(--border-base)] bg-[var(--surface-subtle)] text-[var(--text)] hover:bg-[var(--border-base)]"
                }`}
              >
                <Store className="h-4 w-4" strokeWidth={2.3} />
                편의시설 추가 모드
              </button>

              <button
                type="button"
                onClick={() => setEditorMode("idle")}
                className="flex items-center gap-2 rounded-2xl border border-[var(--border-base)] bg-white px-3 py-3 text-sm font-semibold text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-subtle)]"
              >
                <Trash2 className="h-4 w-4" strokeWidth={2.3} />
                선택 해제
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border-base)] bg-white p-4 shadow-sm">
            <h2 className="text-sm font-bold text-[var(--text)]">현재 모드</h2>

            <div className="mt-3 rounded-2xl bg-[var(--surface-subtle)] px-3 py-3">
              {editorMode === "idle" && (
                <p className="text-sm text-[var(--text-muted)]">
                  현재 선택된 편집 모드가 없습니다.
                </p>
              )}
              {editorMode === "booth" && (
                <p className="text-sm font-semibold text-[var(--accent)]">
                  부스 추가 모드
                </p>
              )}
              {editorMode === "pub" && (
                <p className="text-sm font-semibold text-[var(--accent)]">
                  주점 추가 모드
                </p>
              )}
              {editorMode === "facility" && (
                <p className="text-sm font-semibold text-[var(--accent)]">
                  편의시설 추가 모드
                </p>
              )}
            </div>

            <p className="mt-3 text-xs leading-5 text-[var(--text-muted)]">
              지금은 기본 페이지 구조만 준비한 상태입니다.
              <br />
              다음 단계에서 배경 지도 이미지, 좌표 클릭, 마커 배치, 항목 저장 기능을 연결하면 됩니다.
            </p>
          </section>

          <section className="rounded-2xl border border-[var(--border-base)] bg-white p-4 shadow-sm">
            <h2 className="text-sm font-bold text-[var(--text)]">선택된 항목 정보</h2>

            <div className="mt-3 rounded-2xl border border-dashed border-[var(--border-base)] bg-[var(--surface-subtle)] px-4 py-6 text-center">
              <MapPin className="mx-auto h-5 w-5 text-[var(--text-muted)]" strokeWidth={2.3} />
              <p className="mt-2 text-sm font-semibold text-[var(--text-muted)]">
                아직 선택된 항목이 없습니다
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                마커 선택 기능을 붙이면 이 영역에 상세 정보가 표시됩니다.
              </p>
            </div>
          </section>
        </aside>

        {/* 오른쪽 지도 편집 영역 */}
        <section className="rounded-2xl border border-[var(--border-base)] bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[var(--text)]">지도 편집 영역</h2>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                추후 지도 배경 이미지와 마커 편집 기능이 들어갈 영역입니다.
              </p>
            </div>

            <span className="rounded-full border border-[var(--border-base)] bg-[var(--surface-subtle)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-muted)]">
              개발 중
            </span>
          </div>

          <div className="flex min-h-[720px] items-center justify-center rounded-2xl border-2 border-dashed border-[var(--border-base)] bg-[var(--surface-subtle)]">
            <div className="text-center">
              <Map className="mx-auto h-10 w-10 text-[var(--text-muted)]" strokeWidth={2.1} />
              <p className="mt-3 text-base font-semibold text-[var(--text)]">
                지도 캔버스 영역
              </p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                배경 이미지 삽입, 좌표 클릭, 마커 드래그 기능을 여기에 연결하면 됩니다.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}