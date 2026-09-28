import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { Toaster } from "sonner";
import { useLocation } from "react-router-dom";
import { UserPlus, Users, RefreshCw, ShieldCheck, MoreHorizontal } from "lucide-react";
import { authStore } from "@/store/common/authStore";
import { useAdminInvite } from "@/hooks/app/admin/useAdminInvite";
import { Button } from "@/components/common/ui/button";
import { Input } from "@/components/common/ui/input";
import {
  AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription,
  AlertDialogFooter, AlertDialogCancel,
} from "@/components/common/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/common/ui/dropdown-menu";
import type { StaffMember, StaffPermission, StaffFilter } from "@/api/app/admin/adminInviteApi";

const staffFilters: { value: StaffFilter; label: string }[] = [
  { value: "ALL", label: "전체" },
  { value: "TICKETING", label: "티켓 매니저" },
  { value: "OPERATIONS", label: "운영 매니저" },
  { value: "BOTH", label: "티켓&운영 매니저" },
  { value: "ADMIN", label: "최고 관리자" },
];

const panel = "rounded-2xl border border-[var(--admin-panel-border)] bg-[var(--admin-panel-bg)] p-5 sm:p-6";
const roleLabel = (role: StaffMember["role"]) => role === "ADMIN" ? "최고 관리자" : role === "MANAGER" ? "매니저" : "일반 회원";
const roleBadgeColor = {
  ADMIN: "bg-violet-100 text-violet-800",
  MANAGER: "bg-emerald-100 text-emerald-800",
  USER: "bg-slate-100 text-slate-700",
};

function RoleBadge({ userRole }: { userRole: StaffMember["role"] }) {
  return <span className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${roleBadgeColor[userRole]}`}>{roleLabel(userRole)}</span>;
}

function StaffProfile({ member }: { member: StaffMember }) {
  return <div className="min-w-0 space-y-1">
    <div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{member.name}</span><RoleBadge userRole={member.role} /></div>
    <p className="break-all text-sm">{member.studentId}</p>
    <p className="text-sm text-[var(--text-muted)]">{member.college || "소속 대학 미등록"} · {member.major || "학과 미등록"}</p>
  </div>;
}

const scopeLabel = (permissions: readonly StaffPermission[]) => permissions.length === 0 ? "권한 없음" : permissions.map(permission => permission === "TICKETING" ? "티켓팅" : "운영 관리").join(" · ");
function ScopeControls({ value, onChange, disabled = false }: { value: StaffPermission[]; onChange: (value: StaffPermission[]) => void; disabled?: boolean }) {
  const toggle = (permission: StaffPermission) => onChange(value.includes(permission) ? value.filter(item => item !== permission) : [...value, permission]);
  return <fieldset disabled={disabled} className="min-w-0 space-y-3">
    <legend className="text-sm font-semibold">부여할 운영 범위</legend>
    <p className="text-xs text-[var(--text-muted)]">하나 이상 선택해 주세요. 두 권한을 함께 부여할 수 있습니다.</p>
    <div className="grid gap-3 sm:grid-cols-2">
      {([
        { permission: "OPERATIONS", title: "운영 관리", description: "공지·광고, 부스맵, 타임테이블 등" },
        { permission: "TICKETING", title: "티켓팅 관리", description: "축제 티켓 설정, 현장 팔찌 배부" },
      ] as const).map(({ permission, title, description }) => <label key={permission} className={`flex min-w-0 items-start gap-3 rounded-xl border p-3.5 transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${value.includes(permission) ? "border-[var(--text)] bg-[var(--admin-panel-bg)]" : "border-[var(--admin-panel-border)] bg-[var(--admin-panel-bg)] hover:border-[var(--text-muted)]"}`}>
        <input type="checkbox" className="mt-1 h-4 w-4 shrink-0" checked={value.includes(permission)} onChange={() => toggle(permission)} />
        <span className="min-w-0"><span className="block text-sm font-semibold">{title}</span><span className="mt-1 block text-xs leading-5 text-[var(--text-muted)]">{description}</span></span>
      </label>)}
    </div>
  </fieldset>;
}

function InviteContent({ epoch, actorId }: { epoch: number; actorId: string | null }) {
  const location = useLocation();
  const [toastTop, setToastTop] = useState(84);
  useEffect(() => {
    const header = document.querySelector('[aria-label="관리자 메뉴"]')?.closest("header");
    if (!header) return;
    const update = () => setToastTop(header.getBoundingClientRect().height + 12);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const id = location.hash.slice(1);
    if (id === "invite-manager" || id === "manager-list") {
      const frame = window.requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView?.({ block: "start" });
      });
      return () => window.cancelAnimationFrame(frame);
    }
  }, [location.hash, location.key]);
  const model = useAdminInvite(epoch, actorId);
  const [selectedPermissions, setSelectedPermissions] = useState<StaffPermission[]>([]);
  const origin = useRef<HTMLElement | null>(null);
  const openRoleConfirm = (member: StaffMember, role: "USER" | "MANAGER", trigger: HTMLElement, permissions = member.permissions) => {
    origin.current = trigger;
    setSelectedPermissions(role === "USER" ? [] : permissions);
    model.setConfirm({ action: "ROLE", member: { ...member }, role, permissions: role === "USER" ? [] : permissions });
  };
  const openAdminConfirm = (member: StaffMember, action: "PROMOTE" | "DEMOTE") => {
    setSelectedPermissions([]);
    model.setConfirm({ action, member: { ...member } });
  };
  const onSubmit = (event: FormEvent) => { event.preventDefault(); model.search(); };
  const candidate = model.candidate.data;
  const list = model.list.data;
  const confirm = model.confirm;
  const confirmRole = confirm?.action === "ROLE" ? confirm.role : undefined;
  useEffect(() => { if (candidate && !confirm) setSelectedPermissions(candidate.role === "MANAGER" ? candidate.permissions : []); }, [candidate, confirm]);
  return <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-7 text-[var(--text)] sm:px-8 sm:py-10">
    <Toaster position="top-right" duration={5000} closeButton richColors
      offset={{ top: toastTop, right: 16 }} mobileOffset={{ top: toastTop, right: 16, left: 16 }}
      toastOptions={{ closeButtonAriaLabel: "알림 닫기" }} />
    <header><p className="text-xs font-semibold tracking-[0.18em] text-[var(--text-muted)]">MANAGERS</p><h1 className="mt-2 text-2xl font-bold sm:text-3xl">운영진 관리</h1><p className="mt-2 text-sm text-[var(--text-muted)]">새 매니저를 초대하고, 등록된 매니저의 세부 권한을 관리하세요.</p></header>
    <section aria-labelledby="staff-roles-title" className="rounded-xl bg-[var(--surface-subtle)] p-4 sm:p-5">
      <h2 id="staff-roles-title" className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4" aria-hidden="true" />역할별 권한 안내</h2>
      <dl className="mt-4 space-y-3 text-sm leading-6">
        <div className="grid gap-1 sm:grid-cols-[6rem_1fr] sm:items-start sm:gap-3"><dt><RoleBadge userRole="ADMIN" /></dt><dd>모든 운영 기능을 사용하고, 매니저 권한을 부여·회수합니다.</dd></div>
        <div className="grid gap-1 sm:grid-cols-[6rem_1fr] sm:items-start sm:gap-3"><dt><RoleBadge userRole="MANAGER" /></dt><dd>부여받은 범위만 사용합니다. 티켓팅 관리와 티켓팅 외 운영 관리를 각각 선택할 수 있으며, 매니저 권한 관리는 할 수 없습니다.</dd></div>
        <div className="grid gap-1 sm:grid-cols-[6rem_1fr] sm:items-start sm:gap-3"><dt><RoleBadge userRole="USER" /></dt><dd>축제 정보 조회·티켓 예매 등 일반 서비스를 이용하며, 관리자 화면에는 접근할 수 없습니다.</dd></div>
      </dl>
    </section>
    {list && !list.managementEnabled && <p role="status" className="rounded-xl border border-[var(--admin-panel-border)] p-4 text-sm">현재 권한 변경은 준비 중입니다. 회원 조회와 매니저 목록은 확인할 수 있습니다.</p>}
    <section id="invite-manager" className={`${panel} scroll-mt-40 sm:scroll-mt-28`} aria-labelledby="staff-search-title">
      <h2 id="staff-search-title" className="flex items-center gap-2 text-lg font-semibold"><UserPlus className="h-5 w-5" />새 매니저 초대</h2>
      <form onSubmit={onSubmit} className="mt-5 space-y-2">
        <label htmlFor="staff-student-id" className="text-sm font-medium">학번</label>
        <div className="flex flex-col gap-3 sm:flex-row"><Input id="staff-student-id" value={model.studentId} onChange={e => model.editStudentId(e.target.value)} autoComplete="off" placeholder="가입한 회원의 정확한 학번" aria-describedby="staff-search-help staff-search-error" aria-invalid={Boolean(model.validation)} className="h-11 flex-1" /><Button type="submit" disabled={model.candidate.isFetching || model.busy} className="h-11 sm:w-28">{model.candidate.isFetching ? "조회 중…" : "조회"}</Button></div>
        <p id="staff-search-help" className="text-xs text-[var(--text-muted)]">먼저 일반 회원으로 가입한 계정만 지정할 수 있습니다.</p>
        <p id="staff-search-error" role="alert" className="text-sm text-[var(--admin-alert-error-text)]">{model.validation}</p>
      </form>
      {model.candidate.isError && <div className="mt-4 text-sm" role="alert"><p>{model.candidate.error.status === 404 ? "해당 학번으로 가입된 회원이 없습니다." : "회원을 조회하지 못했습니다. 다시 시도해 주세요."}</p><Button variant="outline" className="mt-2" onClick={model.search}>다시 조회</Button></div>}
      {candidate && !model.candidate.isError && <div className="mt-5 rounded-xl bg-[var(--surface-subtle)] p-4 sm:p-5">
        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-6">
          <div className="min-w-0 border-b border-[var(--admin-panel-border)] pb-5 md:border-b-0 md:border-r md:pb-0 md:pr-6">
            <StaffProfile member={candidate} />
          </div>
          {candidate.role !== "ADMIN"
            ? <ScopeControls value={selectedPermissions} onChange={setSelectedPermissions} disabled={!model.canChange} />
            : <p className="text-sm text-[var(--text-muted)]">최고 관리자 권한은 목록에서 관리할 수 있습니다.</p>}
        </div>
        {candidate.role !== "ADMIN" && <div className="mt-5 flex justify-end border-t border-[var(--admin-panel-border)] pt-4">
          <Button className="w-full sm:w-auto" disabled={!model.canChange || selectedPermissions.length === 0} onClick={e => openRoleConfirm(candidate, "MANAGER", e.currentTarget, selectedPermissions)}>{candidate.role === "USER" ? "매니저로 지정" : "운영 범위 수정"}</Button>
        </div>}
      </div>}
    </section>
    {model.message && <div aria-live="polite" role="status" className="text-sm leading-6">{model.message}{model.uncertain && <Button variant="outline" className="ml-3" onClick={() => void model.refresh()} disabled={model.list.isFetching}>현재 권한 다시 확인</Button>}</div>}
    <section id="manager-list" className={`${panel} scroll-mt-40 sm:scroll-mt-28`} aria-labelledby="staff-list-title" aria-busy={model.list.isFetching}>
      <div className="flex items-center justify-between gap-3"><h2 id="staff-list-title" className="flex items-center gap-2 text-lg font-semibold"><Users className="h-5 w-5" />매니저 목록{list && <span className="text-sm font-normal text-[var(--text-muted)]">{list.totalElements}명</span>}</h2><Button variant="outline" size="sm" disabled={model.list.isFetching || model.busy} onClick={() => void model.refresh()}><RefreshCw className="mr-1 h-4 w-4" />새로고침</Button></div>
      <div role="group" aria-label="관리자 권한 필터" className="mt-5 flex flex-wrap gap-2">
        {staffFilters.map(filter => <button key={filter.value} type="button" aria-pressed={model.filter === filter.value} disabled={model.busy} onClick={() => model.changeFilter(filter.value)} className={`rounded-full border px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 ${model.filter === filter.value ? "border-[var(--text)] bg-[var(--text)] text-[var(--admin-panel-bg)]" : "border-[var(--admin-panel-border)] bg-[var(--admin-panel-bg)] text-[var(--text-muted)] hover:bg-[var(--surface-subtle)]"}`}>{filter.label}</button>)}
      </div>
      <p className="mt-2 text-xs text-[var(--text-muted)]">권한별 필터에는 최고 관리자도 포함됩니다. 티켓&운영 매니저는 두 권한을 모두 가진 계정만 표시합니다.</p>
      {model.list.isPending ? <p className="py-10 text-center text-sm text-[var(--text-muted)]">매니저 목록을 불러오는 중입니다…</p> : model.list.isError ? <p role="alert" className="py-8 text-center text-sm">매니저 목록을 불러오지 못했습니다. 새로고침해 주세요.</p> : list?.items.length === 0 ? <p className="py-10 text-center text-sm text-[var(--text-muted)]">{model.filter === "ALL" ? "등록된 관리자가 없습니다." : "선택한 권한에 해당하는 관리자가 없습니다."}</p> : <div className="mt-5">
        <p id="staff-table-scroll-help" className="mb-2 text-xs text-[var(--text-muted)] lg:hidden">표가 잘리면 좌우로 스크롤해 확인하세요.</p>
        <div role="region" aria-label="매니저 목록 표" aria-describedby="staff-table-scroll-help" tabIndex={0} className="overflow-x-auto rounded-xl border border-[var(--admin-panel-border)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
          <table className="w-full min-w-[760px] text-left text-sm" aria-labelledby="staff-list-title">
            <thead className="border-b border-[var(--admin-panel-border)] bg-[var(--surface-subtle)] text-xs text-[var(--text-muted)]">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">이름 · 학번</th>
                <th scope="col" className="px-4 py-3 font-medium">소속</th>
                <th scope="col" className="px-4 py-3 font-medium">역할</th>
                <th scope="col" className="px-4 py-3 font-medium">세부 권한</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">권한 관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--admin-panel-border)]">
              {list?.items.map(member => <tr key={member.id} className="hover:bg-[var(--surface-subtle)]/40">
                <th scope="row" className="px-4 py-4 align-middle text-left font-normal">
                  <span className="block font-semibold">{member.name}</span>
                  <span className="mt-1 block text-xs tabular-nums text-[var(--text-muted)]">{member.studentId}</span>
                </th>
                <td className="px-4 py-4 align-middle">
                  <span className="block">{member.major || "학과 미등록"}</span>
                  <span className="mt-1 block text-xs text-[var(--text-muted)]">{member.college || "소속 대학 미등록"}</span>
                </td>
                <td className="px-4 py-4 align-middle"><RoleBadge userRole={member.role} /></td>
                <td className="px-4 py-4 align-middle">{member.role === "ADMIN" ? <><span className="block">전체 권한</span><span className="mt-1 block text-xs text-[var(--text-muted)]">매니저 권한 관리 포함</span></> : <div className="space-y-1">{member.permissions.length ? member.permissions.map(permission => <span key={permission} className="block whitespace-nowrap">{permission === "OPERATIONS" ? "운영 관리" : "티켓팅"}</span>) : "권한 없음"}</div>}</td>
                <td className="px-4 py-4 align-middle text-right">{member.role === "MANAGER" ? <DropdownMenu><DropdownMenuTrigger disabled={!model.canChange} aria-label={`${member.name} 권한 관리 메뉴`} onFocus={event => { origin.current = event.currentTarget; }} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-[color:color-mix(in_srgb,var(--outline_variant)_90%,transparent)] bg-[var(--surface_container_lowest)] px-3 text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface_container_low)] disabled:pointer-events-none disabled:opacity-50"><MoreHorizontal className="h-4 w-4" aria-hidden="true" />더보기</DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => openRoleConfirm(member, "MANAGER", origin.current ?? document.body)}>세부 권한 수정</DropdownMenuItem><DropdownMenuItem onSelect={() => openAdminConfirm(member, "PROMOTE")}>최고 관리자로 지정</DropdownMenuItem><DropdownMenuItem variant="destructive" onSelect={() => openRoleConfirm(member, "USER", origin.current ?? document.body)}>매니저 권한 회수</DropdownMenuItem></DropdownMenuContent></DropdownMenu> : member.role === "ADMIN" ? String(member.id) === actorId ? <span className="whitespace-nowrap text-xs text-[var(--text-muted)]">본인 계정</span> : <DropdownMenu><DropdownMenuTrigger disabled={!model.canChange} aria-label={`${member.name} 권한 관리 메뉴`} onFocus={event => { origin.current = event.currentTarget; }} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-[color:color-mix(in_srgb,var(--outline_variant)_90%,transparent)] bg-[var(--surface_container_lowest)] px-3 text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface_container_low)] disabled:pointer-events-none disabled:opacity-50"><MoreHorizontal className="h-4 w-4" aria-hidden="true" />더보기</DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem variant="destructive" onSelect={() => openAdminConfirm(member, "DEMOTE")}>최고 관리자 권한 회수</DropdownMenuItem></DropdownMenuContent></DropdownMenu> : <span className="whitespace-nowrap text-xs text-[var(--text-muted)]">권한 변경 불가</span>}</td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </div>}
      {list && !model.list.isError && list.totalPages > 0 && <nav aria-label="매니저 목록 페이지" className="mt-6 flex items-center justify-center gap-4"><Button variant="outline" size="sm" disabled={model.page === 0 || model.busy} onClick={() => model.setPage(model.page - 1)}>이전</Button><span className="text-sm">{model.page + 1} / {list.totalPages}</span><Button variant="outline" size="sm" disabled={model.page + 1 >= list.totalPages || model.busy} onClick={() => model.setPage(model.page + 1)}>다음</Button></nav>}
    </section>
    <AlertDialog open={model.confirm !== null} onOpenChange={open => { if (!open && !model.busy) model.setConfirm(null); }}>
      <AlertDialogContent onCloseAutoFocus={event => { event.preventDefault(); origin.current?.focus(); }}>
        <AlertDialogTitle>{confirm?.action === "PROMOTE" ? "최고 관리자로 지정할까요?" : confirm?.action === "DEMOTE" ? "최고 관리자 권한을 회수할까요?" : confirmRole === "MANAGER" ? "운영 범위를 저장할까요?" : "매니저 권한을 회수할까요?"}</AlertDialogTitle>
        <AlertDialogDescription>{confirm?.member.name} · {confirm?.member.studentId}<br />{confirm?.action === "PROMOTE" ? "모든 운영·티켓팅 기능과 다른 회원의 권한을 관리할 수 있게 됩니다. 대상 회원은 다시 로그인해야 합니다." : confirm?.action === "DEMOTE" ? "티켓·운영 매니저로 변경됩니다. 두 운영 권한은 유지되며, 다른 회원의 권한을 관리하는 기능만 회수됩니다. 대상 회원은 다시 로그인해야 합니다." : confirmRole === "MANAGER" ? `선택한 범위: ${scopeLabel(selectedPermissions)}. 대상 회원은 다시 로그인해야 합니다.` : "일반 회원 계정은 유지되며 운영 기능 접근 권한이 회수됩니다."}</AlertDialogDescription>
        {confirmRole === "MANAGER" && <div className="mt-4"><ScopeControls value={selectedPermissions} onChange={setSelectedPermissions} disabled={model.busy} /></div>}
        <AlertDialogFooter><AlertDialogCancel disabled={model.busy}>취소</AlertDialogCancel><Button disabled={model.busy || !model.canChange || (confirmRole === "MANAGER" && selectedPermissions.length === 0)} onClick={() => { if (confirm) void model.applyChange(confirm.action === "ROLE" ? { ...confirm, permissions: selectedPermissions } : confirm); }}>{model.busy ? "처리 중…" : confirm?.action === "PROMOTE" ? "최고 관리자로 지정" : confirm?.action === "DEMOTE" ? "매니저로 변경" : confirmRole === "MANAGER" ? "저장하기" : "회수하기"}</Button></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </main>;
}

export default function AdminInvite() {
  const session = useSyncExternalStore(authStore.subscribe, authStore.getSnapshot, authStore.getSnapshot);
  const epoch = authStore.getSessionEpoch();
  if (session.role !== "admin") return <p role="alert" className="p-8">매니저 권한 관리는 최고 관리자만 사용할 수 있습니다.</p>;
  return <InviteContent key={epoch} epoch={epoch} actorId={session.user?.id ?? null} />;
}
