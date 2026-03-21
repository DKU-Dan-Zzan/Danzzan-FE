import { useCallback, useEffect, useRef, useState } from "react";
import {
  getAdminNotices,
  type NoticeResponse,
  type NoticeStatusFilter,
} from "@/api/app/admin/adminApi";

type UseAdminNoticesOptions = {
  onError: (message: string) => void;
};

export const useAdminNotices = ({ onError }: UseAdminNoticesOptions) => {
  const [noticeKeyword, setNoticeKeyword] = useState("");
  const [noticePage, setNoticePage] = useState(0);
  const [noticeTotalPages, setNoticeTotalPages] = useState(0);
  const [notices, setNotices] = useState<NoticeResponse[]>([]);
  const [noticeLoading, setNoticeLoading] = useState(false);
  const [noticeStatus, setNoticeStatus] = useState<NoticeStatusFilter>("ACTIVE");

  const keywordRef = useRef(noticeKeyword);
  const statusRef = useRef(noticeStatus);

  useEffect(() => {
    keywordRef.current = noticeKeyword;
  }, [noticeKeyword]);

  useEffect(() => {
    statusRef.current = noticeStatus;
  }, [noticeStatus]);

  const reloadNotices = useCallback(async (
    page = 0,
    keyword = keywordRef.current,
    status: NoticeStatusFilter = statusRef.current,
  ) => {
    try {
      setNoticeLoading(true);
      const res = await getAdminNotices({
        page,
        size: 10,
        keyword: keyword.trim() || undefined,
        status,
      });
      setNotices(res.content);
      setNoticePage(res.number);
      setNoticeTotalPages(res.totalPages);
    } catch (error) {
      onError(error instanceof Error ? error.message : "공지 목록을 불러오지 못했습니다.");
    } finally {
      setNoticeLoading(false);
    }
  }, [onError]);

  return {
    noticeKeyword,
    setNoticeKeyword,
    noticePage,
    noticeTotalPages,
    notices,
    noticeLoading,
    noticeStatus,
    setNoticeStatus,
    reloadNotices,
  };
};
