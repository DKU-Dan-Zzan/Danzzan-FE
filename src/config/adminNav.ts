// 역할: 관리자 콘솔 상단 메뉴(대메뉴/하위 항목)의 단일 정의를 제공한다.
// 메뉴 구조를 바꿀 때는 이 파일만 고치면 상단 내비게이션과 라우팅 설명이 함께 따라간다.

export type AdminNavItem = {
  label: string
  /** 앱 내부 경로. 외부/다른 앱으로 나가는 항목은 external 을 함께 지정한다. */
  path: string
  description?: string
  external?: boolean
}

export type AdminNavMenu = {
  key: string
  label: string
  /** 대메뉴를 눌렀을 때 이동할 경로. 하위 항목이 있으면 첫 번째 항목의 경로와 같다. */
  path: string
  external?: boolean
  items: AdminNavItem[]
}

export const ADMIN_NAV_MENUS: AdminNavMenu[] = [
  {
    key: "settings",
    label: "축제 설정",
    path: "/admin",
    items: [],
  },
  {
    key: "theme",
    label: "테마",
    path: "/admin/theme",
    items: [],
  },
  {
    key: "notices",
    label: "공지·광고",
    path: "/admin/notices",
    items: [
      { label: "공지사항", path: "/admin/notices", description: "긴급 공지와 일반 공지" },
      { label: "광고 배너", path: "/admin/ads", description: "홈·티켓 화면 배너" },
    ],
  },
  {
    key: "boothmap",
    label: "부스맵",
    path: "/admin/boothmap/layout",
    items: [
      { label: "부스 배치", path: "/admin/boothmap/layout", description: "지도 위 위치 지정" },
      { label: "부스 정보", path: "/admin/boothmap/booths", description: "부스·주점 상세 정보" },
    ],
  },
  {
    key: "timetable",
    label: "타임테이블",
    path: "/admin/timetable",
    items: [
      { label: "공연 일정", path: "/admin/timetable", description: "아티스트와 공연 시간" },
    ],
  },
  {
    key: "ticketing",
    label: "티켓팅",
    path: "/ticket/admin",
    external: true,
    items: [
      { label: "티켓팅 관리", path: "/ticket/admin", description: "티켓팅 관리자 페이지", external: true },
    ],
  },
  {
    key: "invite",
    label: "운영진 초대",
    path: "/admin/invite",
    items: [],
  },
]

/** 현재 경로가 어느 대메뉴에 속하는지 찾는다. 가장 긴 경로가 우선한다. */
export const findActiveAdminMenuKey = (pathname: string): string | undefined => {
  const candidates = ADMIN_NAV_MENUS.flatMap((menu) => {
    const paths = menu.items.length > 0 ? menu.items.map((item) => item.path) : [menu.path]
    return paths.map((path) => ({ key: menu.key, path }))
  })

  const matched = candidates
    .filter(({ path }) => pathname === path || pathname.startsWith(`${path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0]

  return matched?.key
}
