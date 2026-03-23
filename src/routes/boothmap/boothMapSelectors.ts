// 역할: 부스맵 리스트/지도 렌더에 사용하는 필터링·선택 셀렉터를 제공합니다.
import type {
  Booth,
  College,
  PrimaryFilter,
  Pub,
  SelectedMapItem,
} from "@/types/app/boothmap/boothmap.types";

export const getVisibleBooths = (
  primaryFilter: PrimaryFilter,
  booths: Booth[],
): Booth[] => {
  if (primaryFilter === "ALL") return booths;
  if (primaryFilter === "PUB") return [];
  return booths.filter((booth) => booth.type === primaryFilter);
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
  if (!selectedCollegeId) return pubs;
  return pubs.filter((pub) => pub.college_id === selectedCollegeId);
};

export const getShouldShowPubList = (
  primaryFilter: PrimaryFilter,
  selectedMapItem: SelectedMapItem,
): boolean => {
  return primaryFilter === "PUB" || selectedMapItem?.kind === "college";
};
