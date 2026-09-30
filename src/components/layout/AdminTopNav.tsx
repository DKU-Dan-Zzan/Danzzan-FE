// 역할: 관리자 콘솔 상단 고정 내비게이션. 왼쪽에 학교명, 오른쪽에 대메뉴와 hover 하위 메뉴를 그린다.
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { ArrowUpRight, LogOut } from "lucide-react"

import { ADMIN_NAV_MENUS, findActiveAdminMenuKey, type AdminNavMenu } from "@/config/adminNav"
import { ADMIN_FOCUS_VISIBLE_RING_CLASS } from "@/lib/common/adminFocusStyles"
import { useAdminAuth } from "@/hooks/app/admin/useAdminAuth"
import { cn } from "@/components/common/ui/utils"
import { canManageStaff, hasAdminPermission } from "@/api/common/authCore"
import { authStore } from "@/store/common/authStore"

// TODO: 학교별 서비스로 확장할 때 설정 페이지에 저장된 학교명을 불러오도록 바꾼다.
const SCHOOL_NAME = "단국대학교"

export default function AdminTopNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAdminAuth()
  const session = useSyncExternalStore(authStore.subscribe, authStore.getSnapshot, authStore.getSnapshot)
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

  const closeMenu = useCallback(() => {
    clearCloseTimer()
    setOpenMenuKey(null)
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
      if (path === "/admin/invite") window.scrollTo({ top: 0, left: 0, behavior: "instant" })
    },
    [navigate],
  )

  const handleLogout = async () => {
    await logout()
    navigate("/admin/login", { replace: true })
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border-base)] bg-[var(--admin-header-bg)]">
      <div className="mx-auto flex w-full max-w-[1360px] flex-col items-stretch justify-between gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-6 sm:px-6">
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

        <nav aria-label="관리자 메뉴" className="flex flex-1 flex-wrap items-center justify-start gap-1 sm:justify-end [&_button]:whitespace-nowrap">
          {ADMIN_NAV_MENUS.filter((menu) => {
            if (menu.key === "managers") return canManageStaff(session.role)
            if (menu.key === "ticketing") return hasAdminPermission(session.role, session.permissions, "TICKETING")
            if (menu.key === "settings") return hasAdminPermission(session.role, session.permissions, "OPERATIONS") || hasAdminPermission(session.role, session.permissions, "TICKETING")
            return hasAdminPermission(session.role, session.permissions, "OPERATIONS")
          }).map((menu) => (
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
              onDismiss={closeMenu}
              onNavigate={goTo}
              pathname={location.pathname}
              hash={location.hash}
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
  onDismiss,
  onNavigate,
  pathname,
  hash,
}: {
  menu: AdminNavMenu
  isActive: boolean
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
  onDismiss: () => void
  onNavigate: (path: string, external?: boolean) => void
  pathname: string
  hash: string
}) {
  const hasItems = menu.items.length > 0
  const showDropdown = hasItems && isOpen
  const triggerRef = useRef<HTMLButtonElement>(null)

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
      onKeyDown={(event) => {
        if (event.key === "Escape" && showDropdown) {
          event.preventDefault()
          triggerRef.current?.focus()
          onDismiss()
        }
      }}
    >
      <button
        type="button"
        ref={triggerRef}
        aria-haspopup={hasItems || undefined}
        aria-expanded={hasItems ? showDropdown : undefined}
        aria-controls={hasItems ? `${menu.key}-submenu` : undefined}
        onClick={() => menu.openOnClick ? onOpen() : onNavigate(menu.path, menu.external)}
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
          <ul id={`${menu.key}-submenu`} className="min-w-[184px] rounded-xl border border-[var(--border-base)] bg-[var(--surface)] p-1.5 shadow-lg">
            {menu.items.map((item) => (
              <li key={item.path}>
                <button
                  type="button"
                  onClick={() => onNavigate(item.path, item.external)}
                  aria-current={`${pathname}${hash}` === item.path ? "page" : undefined}
                  className={cn(
                    "w-full rounded-lg px-3 py-2 text-left transition-colors hover:bg-[var(--surface-subtle)]",
                    `${pathname}${hash}` === item.path && "bg-[var(--surface-subtle)]",
                    ADMIN_FOCUS_VISIBLE_RING_CLASS,
                  )}
                >
                  <span className="flex items-center justify-between gap-3 text-sm font-semibold text-[var(--text)]">{item.label}{item.external && <ArrowUpRight aria-hidden="true" className="h-4 w-4" />}</span>
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
