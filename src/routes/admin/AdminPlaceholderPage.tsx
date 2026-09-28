// 역할: 아직 기능이 없는 관리자 메뉴(테마, 매니저 초대)의 빈 화면을 공통으로 제공한다.
import { AdminShell } from "@/components/layout/AdminShell"

export default function AdminPlaceholderPage({
  title,
  eyebrow,
}: {
  title: string
  eyebrow: string
}) {
  return (
    <AdminShell
      title={title}
      eyebrow={eyebrow}
      headerClassName="border-b border-[var(--border-base)] bg-[var(--admin-header-bg)]"
      mainClassName="mx-auto w-full max-w-3xl px-6 py-6"
    >
      <div className="rounded-2xl border border-dashed border-[var(--border-base)] bg-[var(--surface)] px-6 py-16 text-center">
        <p className="text-sm font-semibold text-[var(--text)]">준비 중인 기능입니다.</p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">화면 구성이 정해지면 이곳에 추가됩니다.</p>
      </div>
    </AdminShell>
  )
}
