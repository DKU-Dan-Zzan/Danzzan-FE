import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { adminInviteApi, type StaffMember, type StaffPermission, type StaffFilter } from "@/api/app/admin/adminInviteApi";
import { authStore } from "@/store/common/authStore";
import { useAppQuery } from "@/lib/query/useAppQuery";
import { appQueryKeys } from "@/lib/query/queryKeys";
import { normalizeAppError } from "@/lib/error/appError";

export type StaffChange =
  | { action: "ROLE"; member: StaffMember; role: "USER" | "MANAGER"; permissions: StaffPermission[] }
  | { action: "PROMOTE"; member: StaffMember }
  | { action: "DEMOTE"; member: StaffMember };

export function useAdminInvite(epoch: number, actorId: string | null) {
  const client = useQueryClient();
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<StaffFilter>("ALL");
  const [validation, setValidation] = useState("");
  const [message, setMessage] = useState("");
  const [uncertain, setUncertain] = useState(false);
  const [confirm, setConfirm] = useState<StaffChange | null>(null);
  const submitting = useRef(false);
  const successToast = useRef<string | number | undefined>(undefined);
  const alive = useRef(true);
  const current = () => alive.current && authStore.getSessionEpoch() === epoch && authStore.getSnapshot().role === "admin";
  const scope = appQueryKeys.adminStaff(actorId, epoch);
  const allowed = authStore.getSnapshot().role === "admin";
  const list = useAppQuery({
    queryKey: [...scope, "list", filter, page],
    queryFn: ({ signal }) => adminInviteApi.list(page, 20, signal, filter),
    enabled: allowed,
    retry: false,
    staleTime: 0,
  });
  const candidate = useAppQuery({
    queryKey: [...scope, "candidate", submitted],
    queryFn: ({ signal }) => adminInviteApi.candidate(submitted, signal),
    enabled: allowed && Boolean(submitted),
    retry: false,
    staleTime: 0,
  });
  const mutation = useMutation({
    mutationFn: (change: StaffChange) => {
      if (change.action === "PROMOTE") return adminInviteApi.promoteAdmin(change.member.id);
      if (change.action === "DEMOTE") return adminInviteApi.demoteAdmin(change.member.id);
      return adminInviteApi.updateRole(change.member.id, change.role, change.permissions);
    },
    retry: false,
  });

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      if (successToast.current !== undefined) toast.dismiss(successToast.current);
      const queryKey = appQueryKeys.adminStaff(actorId, epoch);
      void client.cancelQueries({ queryKey });
      client.removeQueries({ queryKey });
    };
  }, [client, actorId, epoch]);

  useEffect(() => {
    if (list.data && page > 0 && page >= list.data.totalPages) {
      setPage(Math.max(0, list.data.totalPages - 1));
    }
  }, [list.data, page]);

  useEffect(() => {
    const status = candidate.error?.status ?? list.error?.status;
    if (status === 403) navigate("/admin", { replace: true, state: { message: "매니저 권한 관리에 접근할 수 없습니다." } });
    if (status === 401) navigate("/admin/login", { replace: true });
  }, [candidate.error, list.error, navigate]);

  const changeFilter = (value: StaffFilter) => {
    setFilter(value);
    setPage(0);
  };
  const editStudentId = (value: string) => {
    void client.cancelQueries({ queryKey: [...scope, "candidate"] });
    client.removeQueries({ queryKey: [...scope, "candidate"] });
    setStudentId(value);
    setSubmitted("");
    setConfirm(null);
    setValidation("");
  };
  const search = () => {
    const value = studentId.trim();
    if (!value || value.length > 255) {
      setValidation("학번을 1~255자 이내로 입력해 주세요.");
      return;
    }
    setValidation("");
    setConfirm(null);
    if (submitted === value) void candidate.refetch();
    else setSubmitted(value);
  };
  const refresh = async () => {
    const results = await Promise.all([list.refetch(), ...(submitted ? [candidate.refetch()] : [])]);
    if (!current()) return false;
    const refreshed = results.every(result => !result.isError);
    if (refreshed) setUncertain(false);
    return refreshed;
  };
  const applyChange = async (override?: StaffChange) => {
    const selected = override ?? confirm;
    if (!selected || submitting.current || uncertain || !current() || !list.data?.managementEnabled || list.isError) return;
    submitting.current = true;
    setMessage("");
    try {
      await mutation.mutateAsync(selected);
      if (!current()) return;
      setConfirm(null);
      successToast.current = toast.success(selected.action === "PROMOTE"
        ? `${selected.member.name}님을 최고 관리자로 지정했습니다.`
        : selected.action === "DEMOTE"
          ? `${selected.member.name}님을 티켓·운영 매니저로 변경했습니다.`
          : selected.role === "MANAGER"
            ? `${selected.member.name}님의 매니저 권한을 저장했습니다.`
            : `${selected.member.name}님의 매니저 권한을 회수했습니다.`, {
        id: successToast.current,
        duration: 5000,
        description: selected.action === "ROLE" && selected.role === "USER"
          ? "일반 회원 계정은 유지됩니다."
          : "대상 회원은 다시 로그인해 주세요.",
      });
      await client.invalidateQueries({ queryKey: scope, refetchType: "none" });
      if (!await refresh() && current()) setMessage("권한 변경은 완료됐지만 목록을 불러오지 못했습니다. 새로고침해 주세요.");
    } catch (error) {
      if (!current()) return;
      const parsed = normalizeAppError(error);
      setConfirm(null);
      if (parsed.status === 403) { navigate("/admin", { replace: true }); return; }
      if (parsed.status === 401) { navigate("/admin/login", { replace: true }); return; }
      if (parsed.status === null || parsed.status >= 500) {
        setUncertain(true);
        setMessage(parsed.status === 503 && parsed.code === "STAFF_MANAGEMENT_DISABLED"
          ? "현재 권한 변경을 사용할 수 없습니다. 새로고침 후 확인해 주세요."
          : "변경 결과를 확인하지 못했습니다. 새로고침으로 현재 권한을 확인한 후 다시 진행해 주세요.");
      } else {
        setMessage(parsed.message);
        if (parsed.status === 404 || parsed.status === 409) await refresh();
      }
    } finally {
      submitting.current = false;
    }
  };
  return {
    studentId, editStudentId, search, validation, message, uncertain, confirm, setConfirm,
    list, candidate, page, setPage, filter, changeFilter, refresh, applyChange,
    busy: mutation.isPending,
    canChange: list.data?.managementEnabled === true && !list.isError && !mutation.isPending && !uncertain,
  };
}
