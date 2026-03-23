// 역할: 티켓팅 관리자 화면의 헤더/컨테이너/액션 영역을 표준화하는 셸 컴포넌트입니다.
import type { ReactNode } from "react";
import { AdminShell } from "@/components/layout/AdminShell";

type TicketAdminShellProps = {
  children: ReactNode;
  actions?: ReactNode;
  title?: ReactNode;
};

export function TicketAdminShell({
  children,
  actions,
  title = "팔찌 배부 관리자 포털",
}: TicketAdminShellProps) {
  return (
    <AdminShell
      title={title}
      actions={actions}
      rootClassName="min-h-screen bg-[var(--admin-page-bg)]"
      headerClassName="border-b border-[var(--border-base)] bg-[var(--admin-header-bg)]"
      headingClassName="text-2xl font-semibold text-foreground"
      mainClassName="mx-auto w-full max-w-[1360px] px-8 py-6"
    >
      {children}
    </AdminShell>
  );
}
