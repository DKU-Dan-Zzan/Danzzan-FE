import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getAdminNotices,
  type NoticeStatusFilter,
} from "@/api/app/admin/adminApi";
import { appQueryKeys, useAppQuery } from "@/lib/query";

type UseAdminNoticesOptions = {
  onError: (message: string) => void;
};

export const useAdminNotices = ({ onError }: UseAdminNoticesOptions) => {
  const [noticeKeyword, setNoticeKeyword] = useState("");
  const [noticePage, setNoticePage] = useState(0);
  const [noticeStatus, setNoticeStatus] = useState<NoticeStatusFilter>("ACTIVE");

  const normalizedKeyword = useMemo(() => noticeKeyword.trim(), [noticeKeyword]);

  const noticesQuery = useAppQuery({
    queryKey: appQueryKeys.adminNotices({
      keyword: normalizedKeyword,
      status: noticeStatus,
      page: noticePage,
      size: 10,
    }),
    queryFn: ({ signal }) =>
      getAdminNotices(
        {
          page: noticePage,
          size: 10,
          keyword: normalizedKeyword || undefined,
          status: noticeStatus,
        },
        { signal },
      ),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!noticesQuery.error) {
      return;
    }
    onError(noticesQuery.error.message || "공지 목록을 불러오지 못했습니다.");
  }, [noticesQuery.error, onError]);

  const reloadNotices = useCallback(
    async (
      page = 0,
      keyword = noticeKeyword,
      status: NoticeStatusFilter = noticeStatus,
    ) => {
      const normalizedPage = Math.max(0, page);
      const sameState =
        normalizedPage === noticePage &&
        keyword === noticeKeyword &&
        status === noticeStatus;

      if (normalizedPage !== noticePage) {
        setNoticePage(normalizedPage);
      }
      if (keyword !== noticeKeyword) {
        setNoticeKeyword(keyword);
      }
      if (status !== noticeStatus) {
        setNoticeStatus(status);
      }

      if (sameState) {
        await noticesQuery.refetch();
      }
    },
    [noticeKeyword, noticePage, noticeStatus, noticesQuery],
  );

  return {
    noticeKeyword,
    setNoticeKeyword,
    noticePage,
    noticeTotalPages: noticesQuery.data?.totalPages ?? 0,
    notices: noticesQuery.data?.content ?? [],
    noticeLoading: noticesQuery.isPending || noticesQuery.isFetching,
    noticeStatus,
    setNoticeStatus,
    reloadNotices,
  };
};
