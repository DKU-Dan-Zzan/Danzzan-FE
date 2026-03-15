// 드래그로 높이를 조절하고(PEEK/HALF/FULL) 스냅되는 BottomSheet 컴포넌트

import { useEffect, useMemo, useRef, useState } from "react";
import type { SheetMode, SheetSnap } from "../types/boothmap.types";

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
  const buildSnaps = () => {
    const usable = window.innerHeight - bottomOffset;
    return {
      PEEK: 40,
      HALF: Math.round(usable * 0.48),
      FULL: Math.round(usable * 0.82),
    } satisfies SnapPx;
  };

  const snaps = useMemo<SnapPx>(() => buildSnaps(), [bottomOffset]);
  const [height, setHeight] = useState<number>(snaps[snap]);

  useEffect(() => setHeight(snaps[snap]), [snap, snaps]);

  useEffect(() => {
    const onResize = () => {
      const next = buildSnaps();
      setHeight(next[snap]);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snap, bottomOffset]);

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
        "fixed z-50 flex flex-col overflow-hidden border-t border-gray-200 bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.08)]",
        "rounded-t-2xl",
      ].join(" ")}
      style={{
        left: "50%",
        transform: "translateX(-50%)",
        width: `min(${frameWidth}px, 100vw)`,
        bottom: bottomOffset,
        height,
        transition: isDraggingRef.current ? "none" : "height 180ms ease",
      }}
    >
      {/* handle */}
      <div
        className="cursor-grab select-none px-0 pb-2 pt-3"
        style={{ touchAction: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        aria-label="bottom-sheet-handle"
      >
        <div className="mx-auto h-1.5 w-12 rounded-full bg-gray-200" />
      </div>

      {mode === "DETAIL" && (
        <div className="px-4 pb-2">
          <button
            type="button"
            onClick={onBackToList}
            className="text-m font-extrabold text-blue-600"
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