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
  /** 대메뉴를 눌렀을 때 이동할 대표 경로. */
  path: string
  external?: boolean
  openOnClick?: boolean
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
    openOnClick: true,
    label: "티켓팅",
    path: "/admin/ticketing",
    items: [
      { label: "티켓 설정", path: "/admin/ticketing", description: "예매 일정·수량·안내 이미지" },
      { label: "팔찌 배부", path: "/ticket/admin", description: "팔찌 배부 관리 화면으로 이동", external: true },
    ],
  },
  {
    key: "managers",
    label: "운영진 관리",
    path: "/admin/invite",
    items: [
      { label: "새 매니저 초대", path: "/admin/invite#invite-manager", description: "가입한 회원에게 관리 범위 부여" },
      { label: "매니저 목록", path: "/admin/invite#manager-list", description: "매니저 권한과 담당 업무 확인" },
    ],
  },
]

/** 현재 경로가 어느 대메뉴에 속하는지 찾는다. 가장 긴 경로가 우선한다. */
export const findActiveAdminMenuKey = (pathname: string): string | undefined => {
  const candidates = ADMIN_NAV_MENUS.flatMap((menu) => {
    const paths = menu.items.length > 0 ? menu.items.map((item) => item.path) : [menu.path]
    return paths.map((path) => ({ key: menu.key, path: path.split("#")[0] }))
  })

  const matched = candidates
    .filter(({ path }) => pathname === path || pathname.startsWith(`${path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0]

  return matched?.key
}
