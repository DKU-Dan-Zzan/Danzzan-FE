// 역할: 부스맵 필터/선택 셀렉터 함수의 분기 결과를 검증한다.
import { describe, expect, it } from "vitest";
import type { Booth, College, PrimaryFilter, Pub } from "@/types/app/boothmap/boothmap.types";
import {
  getShouldShowPubList,
  getVisibleBooths,
  getVisibleColleges,
  getVisiblePubs,
} from "@/routes/boothmap/boothMapSelectors";

const booths: Booth[] = [
  {
    id: 1,
    name: "푸드트럭 B",
    type: "FOOD_TRUCK",
    location_x: 0,
    location_y: 0,
    operationStatus: "OPEN",
  },
  {
    id: 2,
    name: "체험 B",
    type: "EXPERIENCE",
    location_x: 1,
    location_y: 1,
  },
  {
    id: 3,
    name: "푸드트럭 A",
    type: "FOOD_TRUCK",
    location_x: 2,
    location_y: 2,
    operationStatus: "OPEN",
  },
  {
    id: 4,
    name: "푸드트럭 C",
    type: "FOOD_TRUCK",
    location_x: 3,
    location_y: 3,
    operationStatus: "CLOSED",
  },
  {
    id: 5,
    name: "이벤트 A",
    type: "EVENT",
    location_x: 4,
    location_y: 4,
  },
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
  it("ALL에서는 카테고리별로 묶고 각 카테고리 안에서 이름순으로 정렬한다", () => {
    expect(getVisibleBooths("ALL", booths).map((booth) => booth.id)).toEqual([2, 5, 3, 1, 4]);
  });

  it("푸드트럭 필터에서는 CLOSED 상태를 맨 아래로 정렬한다", () => {
    expect(getVisibleBooths("PUB", booths)).toHaveLength(0);
    expect(getVisibleBooths("FOOD_TRUCK", booths).map((booth) => booth.id)).toEqual([3, 1, 4]);
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

  it("pub 목록을 가나다 순으로 정렬한다", () => {
    const unordered: Pub[] = [
      { ...pubs[0], id: 301, name: "다주점", college_id: 10 },
      { ...pubs[0], id: 302, name: "가주점", college_id: 10 },
      { ...pubs[0], id: 303, name: "나주점", college_id: 10 },
    ];
    expect(getVisiblePubs(unordered, null).map((pub) => pub.name)).toEqual([
      "가주점",
      "나주점",
      "다주점",
    ]);
    expect(getVisiblePubs(unordered, 10).map((pub) => pub.name)).toEqual([
      "가주점",
      "나주점",
      "다주점",
    ]);
  });

  it("pub list 노출 여부를 계산한다", () => {
    const pubFilter: PrimaryFilter = "PUB";
    const otherFilter: PrimaryFilter = "ALL";
    expect(getShouldShowPubList(pubFilter, null)).toBe(true);
    expect(getShouldShowPubList(otherFilter, { kind: "college", id: 10 })).toBe(true);
    expect(getShouldShowPubList(otherFilter, { kind: "booth", id: 1 })).toBe(false);
  });
});
