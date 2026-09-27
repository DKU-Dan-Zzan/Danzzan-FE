// 역할: 관리자 콘솔 상단 고정 내비게이션. 왼쪽에 학교명, 오른쪽에 대메뉴와 hover 하위 메뉴를 그린다.
import { useCallback, useEffect, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { LogOut } from "lucide-react"

import { ADMIN_NAV_MENUS, findActiveAdminMenuKey, type AdminNavMenu } from "@/config/adminNav"
import { ADMIN_FOCUS_VISIBLE_RING_CLASS } from "@/lib/common/adminFocusStyles"
import { useAdminAuth } from "@/hooks/app/admin/useAdminAuth"
import { cn } from "@/components/common/ui/utils"

// TODO: 학교별 서비스로 확장할 때 설정 페이지에 저장된 학교명을 불러오도록 바꾼다.
const SCHOOL_NAME = "단국대학교"

export default function AdminTopNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAdminAuth()
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(null)
  const closeTimerRef = useRef<number | null>(null)

  const activeMenuKey = findActiveAdminMenuKey(location.pathname)

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [])

  // 메뉴와 하위 목록 사이를 지나갈 때 깜빡이지 않도록 닫기를 잠깐 미룬다.
  const scheduleClose = useCallback(() => {
    clearCloseTimer()
    closeTimerRef.current = window.setTimeout(() => setOpenMenuKey(null), 120)
  }, [clearCloseTimer])

  useEffect(() => clearCloseTimer, [clearCloseTimer])

  const goTo = useCallback(
    (path: string, external?: boolean) => {
      setOpenMenuKey(null)
      if (external) {
        window.location.assign(path)
        return
      }
      navigate(path)
    },
    [navigate],
  )

  const handleLogout = async () => {
    await logout()
    navigate("/admin/login", { replace: true })
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border-base)] bg-[var(--admin-header-bg)]">
      <div className="mx-auto flex w-full max-w-[1360px] items-center justify-between gap-6 px-6 py-3">
        <button
          type="button"
          onClick={() => goTo("/admin")}
          className={cn(
            "shrink-0 text-lg font-bold tracking-tight text-[var(--text)]",
            ADMIN_FOCUS_VISIBLE_RING_CLASS,
          )}
        >
          {SCHOOL_NAME}
        </button>

        <nav aria-label="관리자 메뉴" className="flex flex-1 items-center justify-end gap-1">
          {ADMIN_NAV_MENUS.map((menu) => (
            <AdminNavMenuButton
              key={menu.key}
              menu={menu}
              isActive={activeMenuKey === menu.key}
              isOpen={openMenuKey === menu.key}
              onOpen={() => {
                clearCloseTimer()
                setOpenMenuKey(menu.key)
              }}
              onClose={scheduleClose}
              onNavigate={goTo}
            />
          ))}

          <button
            type="button"
            onClick={() => void handleLogout()}
            className={cn(
              "ml-2 inline-flex h-8 items-center gap-1.5 rounded-md border border-[var(--border-base)] bg-[var(--surface)] px-3 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface-subtle)]",
              ADMIN_FOCUS_VISIBLE_RING_CLASS,
            )}
          >
            <LogOut className="h-4 w-4" strokeWidth={2.3} />
            로그아웃
          </button>
        </nav>
      </div>
    </header>
  )
}

function AdminNavMenuButton({
  menu,
  isActive,
  isOpen,
  onOpen,
  onClose,
  onNavigate,
}: {
  menu: AdminNavMenu
  isActive: boolean
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
  onNavigate: (path: string, external?: boolean) => void
}) {
  const hasItems = menu.items.length > 0
  const showDropdown = hasItems && isOpen

  return (
    <div
      className="relative"
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
      onFocus={onOpen}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          onClose()
        }
      }}
    >
      <button
        type="button"
        aria-haspopup={hasItems || undefined}
        aria-expanded={hasItems ? showDropdown : undefined}
        // 대메뉴를 누르면 하위 항목의 첫 번째 페이지로 이동한다.
        onClick={() => onNavigate(menu.path, menu.external)}
        className={cn(
          "inline-flex h-9 items-center rounded-md px-3 text-sm font-semibold transition-colors",
          isActive
            ? "bg-[var(--surface-subtle)] text-[var(--text)]"
            : "text-[var(--text-muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text)]",
          ADMIN_FOCUS_VISIBLE_RING_CLASS,
        )}
      >
        {menu.label}
      </button>

      {showDropdown && (
        <div className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-1.5">
          <ul className="min-w-[184px] rounded-xl border border-[var(--border-base)] bg-[var(--surface)] p-1.5 shadow-lg">
            {menu.items.map((item) => (
              <li key={item.path}>
                <button
                  type="button"
                  onClick={() => onNavigate(item.path, item.external)}
                  className={cn(
                    "w-full rounded-lg px-3 py-2 text-left transition-colors hover:bg-[var(--surface-subtle)]",
                    ADMIN_FOCUS_VISIBLE_RING_CLASS,
                  )}
                >
                  <span className="block text-sm font-semibold text-[var(--text)]">{item.label}</span>
                  {item.description && (
                    <span className="mt-0.5 block text-xs text-[var(--text-muted)]">{item.description}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
