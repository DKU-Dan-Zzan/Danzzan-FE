import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SheetMode, SheetSnap } from "@/types/app/boothmap/boothmap.types";
import { BOTTOM_SHEET_HEIGHT_RATIO } from "@/utils/app/boothmap/sheetSnap";

type SnapPx = { PEEK: number; HALF: number; FULL: number };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function nearestSnap(height: number, snaps: SnapPx): SheetSnap {
  const entries: Array<[SheetSnap, number]> = [
    ["PEEK", snaps.PEEK],
    ["HALF", snaps.HALF],
    ["FULL", snaps.FULL],
  ];
  entries.sort((a, b) => Math.abs(a[1] - height) - Math.abs(b[1] - height));
  return entries[0][0];
}

export default function BottomSheet({
  mode,
  snap,
  onSnapChange,
  onBackToList,
  children,
  bottomOffset = 0,
  frameWidth = 430,
}: {
  mode: SheetMode;
  snap: SheetSnap;
  onSnapChange: (next: SheetSnap) => void;
  onBackToList: () => void;
  children: React.ReactNode;
  bottomOffset?: number;
  frameWidth?: number;
}) {
  const buildSnaps = useCallback(() => {
    const usable = window.innerHeight - bottomOffset;
    return {
      PEEK: 40,
      HALF: Math.round(usable * BOTTOM_SHEET_HEIGHT_RATIO.HALF),
      FULL: Math.round(usable * BOTTOM_SHEET_HEIGHT_RATIO.FULL),
    } satisfies SnapPx;
  }, [bottomOffset]);

  const snaps = useMemo<SnapPx>(() => buildSnaps(), [buildSnaps]);
  const [height, setHeight] = useState<number>(snaps[snap]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      setHeight(snaps[snap]);
    });
    return () => cancelAnimationFrame(rafId);
  }, [snap, snaps]);

  useEffect(() => {
    const onResize = () => {
      const next = buildSnaps();
      setHeight(next[snap]);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [buildSnaps, snap]);

  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);
  const lastYRef = useRef(0);
  const lastTRef = useRef(0);
  const velocityRef = useRef(0);

  const minH = snaps.PEEK;
  const maxH = snaps.FULL;

  const onPointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    setIsDragging(true);
    startYRef.current = e.clientY;
    startHeightRef.current = height;
    lastYRef.current = e.clientY;
    lastTRef.current = performance.now();
    velocityRef.current = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;

    const y = e.clientY;
    const dy = startYRef.current - y;
    const nextHeight = clamp(startHeightRef.current + dy, minH, maxH);
    setHeight(nextHeight);

    const now = performance.now();
    const dt = now - lastTRef.current;
    if (dt > 0) {
      const vy = (lastYRef.current - y) / dt;
      velocityRef.current = vy;
      lastYRef.current = y;
      lastTRef.current = now;
    }
  };

  const endDrag = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);

    const v = velocityRef.current;
    const currentSnap = nearestSnap(height, snaps);

    let target: SheetSnap = currentSnap;
    const fast = Math.abs(v) > 0.9;

    if (fast) {
      if (v > 0) target = currentSnap === "PEEK" ? "HALF" : "FULL";
      else target = currentSnap === "FULL" ? "HALF" : "PEEK";
    } else {
      target = nearestSnap(height, snaps);
    }

    onSnapChange(target);
    setHeight(snaps[target]);
  };

  const contentScrollable = snap !== "PEEK";

  return (
    <div
      className={[
        "fixed z-50 flex flex-col overflow-hidden border-t border-[var(--boothmap-border)] bg-[var(--boothmap-surface)] shadow-[var(--boothmap-bottom-sheet-shadow)]",
        "rounded-t-2xl",
      ].join(" ")}
      style={{
        left: "50%",
        transform: "translateX(-50%)",
        width: `min(${frameWidth}px, 100vw)`,
        bottom: bottomOffset,
        height,
        transition: isDragging ? "none" : "height 180ms ease",
      }}
    >
      <div
        className="cursor-grab select-none px-0 pb-2 pt-3"
        style={{ touchAction: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        aria-label="bottom-sheet-handle"
      >
        <div className="mx-auto h-1.5 w-12 rounded-full bg-[var(--boothmap-surface-softer)]" />
      </div>

      {mode === "DETAIL" && (
        <div className="px-4 pb-1">
          <button
            type="button"
            onClick={onBackToList}
            className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--boothmap-text-muted)] transition hover:text-[var(--boothmap-text-subtle)]"
          >
            ← 목록으로
          </button>
        </div>
      )}

      <div
        className={[
          "px-4 pb-4",
          contentScrollable ? "overflow-y-auto" : "overflow-hidden",
          "overflow-x-hidden",
        ].join(" ")}
        style={{
          WebkitOverflowScrolling: "touch",
          pointerEvents: contentScrollable ? "auto" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}
