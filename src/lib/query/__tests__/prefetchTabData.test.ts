// 역할: prefetchTabData 모듈의 동작과 회귀 여부를 검증하는 테스트다.

import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  prefetchQueryMock,
  getQueryDataMock,
  getNoticesMock,
  getBoothMapMock,
  getPubsMock,
  profileMeMock,
  getSnapshotMock,
  setSessionMock,
} = vi.hoisted(() => ({
  prefetchQueryMock: vi.fn(
    async (options: { queryFn: (ctx: { signal?: AbortSignal }) => unknown }) => {
      await options.queryFn({ signal: undefined });
    },
  ),
  getQueryDataMock: vi.fn(),
  getNoticesMock: vi.fn(),
  getBoothMapMock: vi.fn(),
  getPubsMock: vi.fn(),
  profileMeMock: vi.fn(),
  getSnapshotMock: vi.fn(),
  setSessionMock: vi.fn(),
}));

vi.mock("@/lib/query/queryClient", () => ({
  queryClient: {
    prefetchQuery: prefetchQueryMock,
    getQueryData: getQueryDataMock,
  },
}));

vi.mock("@/api/app/notice/noticeApi", () => ({
  getNotices: getNoticesMock,
}));

vi.mock("@/api/app/boothmap/boothmapApi", () => ({
  getBoothMap: getBoothMapMock,
  getPubs: getPubsMock,
}));

vi.mock("@/api/app/auth/studentProfileApi", () => ({
  studentProfileApi: {
    me: profileMeMock,
  },
}));

vi.mock("@/store/common/authStore", () => ({
  authStore: {
    getSnapshot: getSnapshotMock,
    setSession: setSessionMock,
  },
}));

import {
  DEFAULT_BOOTHMAP_PREFETCH_DATE,
  prefetchBottomNavTabData,
  prefetchTabDataByPath,
} from "@/lib/query/prefetchTabData";

describe("prefetchTabData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSnapshotMock.mockReturnValue({
      tokens: null,
      user: null,
      role: null,
    });
  });

  it("notice 경로 prefetch는 공지 1페이지 데이터를 미리 조회한다", async () => {
    getNoticesMock.mockResolvedValue({
      content: [],
      number: 0,
      totalPages: 0,
    });

    await prefetchTabDataByPath("/notice");

    expect(prefetchQueryMock).toHaveBeenCalledTimes(1);
    expect(getNoticesMock).toHaveBeenCalledWith(
      {
        keyword: undefined,
        category: undefined,
        page: 0,
        size: 10,
      },
      { signal: undefined },
    );
  });

  it("map 경로 prefetch는 기본 날짜 부스맵 데이터를 미리 조회한다", async () => {
    getBoothMapMock.mockResolvedValue({
      colleges: [],
      booths: [],
    });
    getPubsMock.mockResolvedValue([]);

    await prefetchTabDataByPath("/map?date=2026-05-12#top");

    expect(getBoothMapMock).toHaveBeenCalledWith(
      DEFAULT_BOOTHMAP_PREFETCH_DATE,
      { signal: undefined },
    );
    expect(getPubsMock).toHaveBeenCalledWith(
      DEFAULT_BOOTHMAP_PREFETCH_DATE,
      { signal: undefined },
    );
  });

  it("mypage 경로 prefetch는 학생 로그인 + 프로필 공백일 때만 세션을 보강한다", async () => {
    const tokens = {
      accessToken: "token",
      refreshToken: "",
      expiresIn: null,
    };
    const refreshedUser = {
      id: "1",
      name: "홍길동",
      role: "student",
      department: "컴퓨터공학과",
      studentId: "32220001",
      college: "공과대학",
    };
    getSnapshotMock.mockReturnValue({
      tokens,
      role: "student",
      user: {
        id: "1",
        name: "",
        role: "student",
        department: "",
        studentId: "",
        college: "",
      },
    });
    profileMeMock.mockResolvedValue(refreshedUser);
    getQueryDataMock.mockReturnValue(refreshedUser);

    await prefetchTabDataByPath("/mypage");

    expect(profileMeMock).toHaveBeenCalledTimes(1);
    expect(setSessionMock).toHaveBeenCalledWith(
      {
        tokens,
        user: refreshedUser,
      },
      "student",
    );
  });

  it("전체 탭 prefetch는 notice/map/mypage 경로를 순회한다", async () => {
    getBoothMapMock.mockResolvedValue({
      colleges: [],
      booths: [],
    });
    getPubsMock.mockResolvedValue([]);
    getNoticesMock.mockResolvedValue({
      content: [],
      number: 0,
      totalPages: 0,
    });

    await prefetchBottomNavTabData();

    expect(getNoticesMock).toHaveBeenCalledTimes(1);
    expect(getBoothMapMock).toHaveBeenCalledTimes(1);
    expect(getPubsMock).toHaveBeenCalledTimes(1);
  });
});
