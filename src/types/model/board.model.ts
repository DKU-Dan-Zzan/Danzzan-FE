export interface Notice {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  isUrgent: boolean;
  imageUrl: string;
}

export interface NoticeInput {
  title: string;
  content: string;
  author: string;
  isUrgent: boolean;
}

export interface LostFoundItem {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  foundLocation: string;
  foundDate: string;
  isClaimed: boolean;
}

export interface LostFoundInput {
  name: string;
  description: string;
  foundLocation: string;
  foundDate: string;
}
