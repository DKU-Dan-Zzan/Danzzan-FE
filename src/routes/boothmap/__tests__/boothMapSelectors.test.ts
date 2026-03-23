// 역할: 부스맵 필터/선택 셀렉터 함수의 분기 결과를 검증합니다.
import { describe, expect, it } from "vitest";
import type { Booth, College, PrimaryFilter, Pub } from "@/types/app/boothmap/boothmap.types";
import {
  getShouldShowPubList,
  getVisibleBooths,
  getVisibleColleges,
  getVisiblePubs,
} from "@/routes/boothmap/boothMapSelectors";

const booths: Booth[] = [
  { id: 1, name: "푸드1", type: "FOOD_TRUCK", location_x: 0, location_y: 0 },
  { id: 2, name: "체험1", type: "EXPERIENCE", location_x: 1, location_y: 1 },
];

const colleges: College[] = [
  { id: 10, name: "공과대학", location_x: 0, location_y: 0 },
  { id: 20, name: "인문대학", location_x: 1, location_y: 1 },
];

const pubs: Pub[] = [
  {
    id: 100,
    college_id: 10,
    department_id: 1,
    department: "컴공",
    name: "주점 A",
    intro: "",
    description: "",
    instagram: "",
    images: [],
  },
  {
    id: 200,
    college_id: 20,
    department_id: 2,
    department: "국문",
    name: "주점 B",
    intro: "",
    description: "",
    instagram: "",
    images: [],
  },
];

describe("boothMapSelectors", () => {
  it("primary filter에 맞는 booth 목록을 반환한다", () => {
    expect(getVisibleBooths("ALL", booths)).toHaveLength(2);
    expect(getVisibleBooths("PUB", booths)).toHaveLength(0);
    expect(getVisibleBooths("FOOD_TRUCK", booths)).toEqual([booths[0]]);
  });

  it("college 필터와 선택 상태를 반영한다", () => {
    expect(getVisibleColleges("ALL", colleges, null)).toHaveLength(2);
    expect(getVisibleColleges("EXPERIENCE", colleges, null)).toHaveLength(0);
    expect(getVisibleColleges("PUB", colleges, 10)).toEqual([colleges[0]]);
  });

  it("selectedCollegeId에 따라 pub 목록을 좁힌다", () => {
    expect(getVisiblePubs(pubs, null)).toHaveLength(2);
    expect(getVisiblePubs(pubs, 20)).toEqual([pubs[1]]);
  });

  it("pub list 노출 여부를 계산한다", () => {
    const pubFilter: PrimaryFilter = "PUB";
    const otherFilter: PrimaryFilter = "ALL";
    expect(getShouldShowPubList(pubFilter, null)).toBe(true);
    expect(getShouldShowPubList(otherFilter, { kind: "college", id: 10 })).toBe(true);
    expect(getShouldShowPubList(otherFilter, { kind: "booth", id: 1 })).toBe(false);
  });
});
