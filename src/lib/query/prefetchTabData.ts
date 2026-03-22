import {
  getBoothMap,
  getPubs,
  type BoothDto,
  type CollegeDto,
  type PubSummaryResponse,
} from "@/api/app/boothmap/boothmapApi";
import { getNotices } from "@/api/app/notice/noticeApi";
import { studentProfileApi } from "@/api/app/auth/studentProfileApi";
import { authStore } from "@/store/common/authStore";
import type { AuthUser } from "@/types/common/auth.model";
import type { Booth, College, Pub } from "@/types/app/boothmap/boothmap.types";
import { queryClient } from "@/lib/query/queryClient";
import { appQueryKeys } from "@/lib/query/queryKeys";

const NOTICE_PREFETCH_PAGE_SIZE = 10;
export const DEFAULT_BOOTHMAP_PREFETCH_DATE = "2026-05-12";
const BOTTOM_NAV_DATA_PREFETCH_PATHS = ["/notice", "/map", "/mypage"] as const;
type BottomNavDataPrefetchPath = (typeof BOTTOM_NAV_DATA_PREFETCH_PATHS)[number];

const normalizeRoutePath = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    return "/";
  }

  const withoutHash = trimmed.split("#", 1)[0] ?? "";
  const withoutQuery = withoutHash.split("?", 1)[0] ?? "";
  if (!withoutQuery || withoutQuery === "/") {
    return "/";
  }

  return withoutQuery.endsWith("/") ? withoutQuery.slice(0, -1) : withoutQuery;
};

const resolveDataPrefetchPath = (value: string): BottomNavDataPrefetchPath | null => {
  const normalizedPath = normalizeRoutePath(value);
  const matchedPath = BOTTOM_NAV_DATA_PREFETCH_PATHS.find((path) => {
    return normalizedPath === path || normalizedPath.startsWith(`${path}/`);
  });
  return matchedPath ?? null;
};

function mapCollegeDtoToCollege(dto: CollegeDto): College {
  return {
    id: dto.collegeId,
    name: dto.name,
    location_x: dto.locationX,
    location_y: dto.locationY,
  };
}

function mapBoothDtoToBooth(dto: BoothDto): Booth {
  return {
    id: dto.boothId,
    name: dto.name,
    type: dto.type,
    location_x: dto.locationX,
    location_y: dto.locationY,
  };
}

function mapPubSummaryToPub(dto: PubSummaryResponse): Pub {
  return {
    id: dto.pubId,
    college_id: dto.collegeId,
    department_id: -1,
    department: dto.department,
    name: dto.name,
    intro: dto.intro,
    description: undefined,
    instagram: undefined,
    images: dto.mainImageUrl ? [dto.mainImageUrl] : [],
    mainImageUrl: dto.mainImageUrl ?? undefined,
  };
}

const prefetchNoticeTabData = async () => {
  await queryClient.prefetchQuery({
    queryKey: appQueryKeys.noticeList({
      keyword: "",
      category: "ALL",
      page: 0,
      size: NOTICE_PREFETCH_PAGE_SIZE,
    }),
    queryFn: ({ signal }) =>
      getNotices(
        {
          keyword: undefined,
          category: undefined,
          page: 0,
          size: NOTICE_PREFETCH_PAGE_SIZE,
        },
        { signal },
      ),
    staleTime: 30_000,
  });
};

const prefetchBoothMapTabData = async () => {
  await queryClient.prefetchQuery({
    queryKey: appQueryKeys.boothMapData(DEFAULT_BOOTHMAP_PREFETCH_DATE),
    queryFn: async ({ signal }) => {
      const [boothMapData, pubsData] = await Promise.all([
        getBoothMap(DEFAULT_BOOTHMAP_PREFETCH_DATE, { signal }),
        getPubs(DEFAULT_BOOTHMAP_PREFETCH_DATE, { signal }),
      ]);

      return {
        colleges: boothMapData.colleges.map(mapCollegeDtoToCollege),
        booths: boothMapData.booths.map(mapBoothDtoToBooth),
        pubs: pubsData.map(mapPubSummaryToPub),
      };
    },
    staleTime: 60_000,
  });
};

const hasMyPageProfileGap = (user: AuthUser | null | undefined): boolean => {
  return !user?.name?.trim() || !user?.college?.trim();
};

const prefetchMyPageTabData = async () => {
  const snapshot = authStore.getSnapshot();
  if (!snapshot.tokens?.accessToken || snapshot.role !== "student") {
    return;
  }
  if (!hasMyPageProfileGap(snapshot.user)) {
    return;
  }

  await queryClient.prefetchQuery({
    queryKey: appQueryKeys.myPageProfile(),
    queryFn: () => studentProfileApi.me(),
    staleTime: 60_000,
  });

  const refreshedUser = queryClient.getQueryData<AuthUser | null>(
    appQueryKeys.myPageProfile(),
  );
  if (!refreshedUser) {
    return;
  }

  authStore.setSession(
    {
      tokens: snapshot.tokens,
      user: refreshedUser,
    },
    snapshot.role ?? undefined,
  );
};

const tabDataPrefetchers: Record<BottomNavDataPrefetchPath, () => Promise<void>> = {
  "/notice": prefetchNoticeTabData,
  "/map": prefetchBoothMapTabData,
  "/mypage": prefetchMyPageTabData,
};

export const prefetchTabDataByPath = async (routePath: string): Promise<void> => {
  const matchedPath = resolveDataPrefetchPath(routePath);
  if (!matchedPath) {
    return;
  }

  await tabDataPrefetchers[matchedPath]();
};

export const prefetchBottomNavTabData = async (): Promise<void> => {
  await Promise.all(BOTTOM_NAV_DATA_PREFETCH_PATHS.map((path) => tabDataPrefetchers[path]()));
};
