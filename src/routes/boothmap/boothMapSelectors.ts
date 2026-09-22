// 역할: 부스맵 리스트/지도 렌더에 사용하는 필터링·선택 셀렉터를 제공합니다.
import type {
  Booth,
  College,
  PrimaryFilter,
  Pub,
  SelectedMapItem,
} from "@/types/app/boothmap/boothmap.types";

const BOOTH_TYPE_ORDER = ["EXPERIENCE", "EVENT", "FACILITY", "REST_AREA", "FOOD_TRUCK"] as const;
const boothNameCollator = new Intl.Collator("ko", {
  numeric: true,
  sensitivity: "base",
});

function getBoothTypeOrder(type: Booth["type"]) {
  const index = BOOTH_TYPE_ORDER.indexOf(type);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function compareBoothName(a: Booth, b: Booth) {
  const nameCompare = boothNameCollator.compare(a.name, b.name);
  if (nameCompare !== 0) {
    return nameCompare;
  }

  return a.id - b.id;
}

function compareFoodTruckClosedLast(a: Booth, b: Booth) {
  const isAClosedFoodTruck = a.type === "FOOD_TRUCK" && a.operationStatus === "CLOSED";
  const isBClosedFoodTruck = b.type === "FOOD_TRUCK" && b.operationStatus === "CLOSED";

  if (isAClosedFoodTruck !== isBClosedFoodTruck) {
    return isAClosedFoodTruck ? 1 : -1;
  }

  return compareBoothName(a, b);
}

function sortBooths(primaryFilter: PrimaryFilter, booths: Booth[]) {
  const sorted = [...booths];

  if (primaryFilter === "ALL") {
    sorted.sort((a, b) => {
      const typeOrderCompare = getBoothTypeOrder(a.type) - getBoothTypeOrder(b.type);
      if (typeOrderCompare !== 0) {
        return typeOrderCompare;
      }

      return compareFoodTruckClosedLast(a, b);
    });

    return sorted;
  }

  if (primaryFilter === "FOOD_TRUCK") {
    sorted.sort(compareFoodTruckClosedLast);
    return sorted;
  }

  sorted.sort(compareBoothName);
  return sorted;
}

export const getVisibleBooths = (
  primaryFilter: PrimaryFilter,
  booths: Booth[],
): Booth[] => {
  if (primaryFilter === "ALL") return sortBooths(primaryFilter, booths);
  if (primaryFilter === "PUB") return [];
  return sortBooths(
    primaryFilter,
    booths.filter((booth) => booth.type === primaryFilter),
  );
};

export const getVisibleColleges = (
  primaryFilter: PrimaryFilter,
  colleges: College[],
  selectedCollegeId: number | null,
): College[] => {
  if (primaryFilter === "ALL") return colleges;
  if (primaryFilter !== "PUB") return [];
  if (!selectedCollegeId) return colleges;
  return colleges.filter((college) => college.id === selectedCollegeId);
};

export const getVisiblePubs = (
  pubs: Pub[],
  selectedCollegeId: number | null,
): Pub[] => {
  const filtered = selectedCollegeId
    ? pubs.filter((pub) => pub.college_id === selectedCollegeId)
    : pubs;
  return [...filtered].sort((a, b) => a.name.localeCompare(b.name, "ko"));
};

export const getShouldShowPubList = (
  primaryFilter: PrimaryFilter,
  selectedMapItem: SelectedMapItem,
): boolean => {
  return primaryFilter === "PUB" || selectedMapItem?.kind === "college";
};
