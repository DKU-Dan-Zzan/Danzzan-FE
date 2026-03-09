// API 연동 전 임시로 사용하는 부스맵 더미 데이터

import type { Booth, College, Pub } from "../types/boothmap.types";

export const mockColleges: College[] = [
  { id: 1, name: "소융대", location_x: 127.1266, location_y: 37.3224 },
  { id: 2, name: "경영대", location_x: 127.1272, location_y: 37.3229 },
  { id: 3, name: "공대", location_x: 127.1258, location_y: 37.3221 },
];

export const mockBooths: Booth[] = [
  {
    id: 101,
    name: "타코야끼",
    type: "FOOD_TRUCK",
    description: "바삭한 타코야끼와 음료 판매",
    location_x: 127.1269,
    location_y: 37.3225,
  },
  {
    id: 102,
    name: "포토존",
    type: "EXPERIENCE",
    description: "즉석 사진 촬영/인화",
    location_x: 127.1263,
    location_y: 37.3227,
  },
  {
    id: 103,
    name: "화장실",
    type: "FACILITY",
    description: "가장 가까운 화장실 안내",
    location_x: 127.1259,
    location_y: 37.3226,
  },
];

export const mockPubs: Pub[] = [
  {
    id: 201,
    college_id: 1,
    department_id: 11,
    name: "소프트웨어학과 주점",
    intro: "레트로",
    description: "칵테일/안주 판매",
    instagram: "@sw_pub",
  },
  {
    id: 202,
    college_id: 1,
    department_id: 12,
    name: "컴퓨터공학과 주점",
    intro: "게임룸",
    description: "맥주/하이볼",
    instagram: "@ce_pub",
  },
  {
    id: 203,
    college_id: 2,
    department_id: 21,
    name: "경영학과 주점",
    intro: "라운지",
    description: "와인/치즈",
    instagram: "@biz_pub",
  },
];