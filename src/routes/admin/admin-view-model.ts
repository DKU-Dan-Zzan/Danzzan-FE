// 역할: 관리자 공지/광고 화면에서 공유하는 폼 상태와 표시용 변환 모델을 정의합니다.

export type NoticeAuthor = "개발팀" | "총학생회";

export type NoticeFormState = {
  id?: number;
  title: string;
  content: string;
  author: NoticeAuthor;
  isPinned: boolean;
  thumbnailImageUrl: string;
  images: string[];
};

export type AdFormState = {
  title: string;
  imageUrl: string;
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}.${month}.${day}`;
};
