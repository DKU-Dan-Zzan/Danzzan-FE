// @vitest-environment jsdom
// 역할: BoothList의 푸드트럭 클릭 동작을 검증한다.
import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import BoothList from "@/components/app/boothmap/BoothList";
import type { Booth } from "@/types/app/boothmap/boothmap.types";

function renderBoothList(booths: Booth[], boothDetailAvailability: Record<number, boolean>) {
  const onSelectBooth = vi.fn();
  const onOpenBoothDetail = vi.fn();
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <BoothList
        booths={booths}
        boothDetailAvailability={boothDetailAvailability}
        onSelectBooth={onSelectBooth}
        onOpenBoothDetail={onOpenBoothDetail}
      />,
    );
  });

  return {
    buttons: Array.from(container.querySelectorAll("button")),
    onOpenBoothDetail,
    onSelectBooth,
    cleanup: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

describe("BoothList", () => {
  it("description이 없는 푸드트럭은 클릭해도 상세로 이동하지 않는다", () => {
    const booths: Booth[] = [
      {
        id: 1,
        name: "설명 없는 푸드트럭",
        type: "FOOD_TRUCK",
        description: null,
        location_x: 0,
        location_y: 0,
      },
    ];
    const { buttons, onOpenBoothDetail, onSelectBooth, cleanup } = renderBoothList(booths, {
      1: false,
    });

    act(() => {
      buttons[0]?.click();
    });

    expect(onOpenBoothDetail).not.toHaveBeenCalled();
    expect(onSelectBooth).not.toHaveBeenCalled();
    cleanup();
  });

  it("description이 있는 푸드트럭은 클릭하면 상세로 이동한다", () => {
    const booths: Booth[] = [
      {
        id: 2,
        name: "설명 있는 푸드트럭",
        type: "FOOD_TRUCK",
        description: "대표 메뉴 소개",
        location_x: 0,
        location_y: 0,
      },
    ];
    const { buttons, onOpenBoothDetail, onSelectBooth, cleanup } = renderBoothList(booths, {
      2: true,
    });

    act(() => {
      buttons[0]?.click();
    });

    expect(onOpenBoothDetail).toHaveBeenCalledWith(2);
    expect(onSelectBooth).not.toHaveBeenCalled();
    cleanup();
  });
  it("체험 부스는 표시용 이름과 칩 라벨을 분리해서 보여준다", () => {
    const booths: Booth[] = [
      {
        id: 3,
        name: "엔비디아 (기업)",
        type: "EXPERIENCE",
        description: "기업 부스",
        location_x: 0,
        location_y: 0,
      },
      {
        id: 4,
        name: "베이크슈",
        type: "EXPERIENCE",
        description: "학생 부스",
        location_x: 0,
        location_y: 0,
      },
    ];
    const { cleanup } = renderBoothList(booths, {});

    expect(document.body.textContent).toContain("엔비디아");
    expect(document.body.textContent).not.toContain("(기업)");
    expect(document.body.textContent).toContain("기업부스");
    expect(document.body.textContent).toContain("학생부스");
    cleanup();
  });
});
