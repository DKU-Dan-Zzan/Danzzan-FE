import { getApiBaseUrl } from "@/api/common/baseUrl";
import { createFetchWithAuth } from "@/api/common/fetchAuth";
import { parseNoticeImagePresignContract } from "@/api/app/admin/adminContract";
import {
  clearAdminSession,
  getAdminAccessToken,
  reissueAdminToken,
} from "@/lib/app/admin/admin-auth-session";

const fetchWithAuth = createFetchWithAuth({
  getBaseUrl: getApiBaseUrl,
  getAccessToken: getAdminAccessToken,
  reissueAccessToken: reissueAdminToken,
  refreshKey: "admin-auth",
  sessionExpiredMessage: "세션이 만료되었습니다. 다시 로그인해 주세요.",
  credentials: "include",
  clearSession: clearAdminSession,
});

export type AdminBoothManagementBooth = {
  id: number;
  type: "EXPERIENCE" | "FOOD_TRUCK" | "EVENT" | "FACILITY";
  name: string;
  description: string | null;
  locationX: number | null;
  locationY: number | null;
  placed: boolean;
  operationInfoExists: boolean;
  operationStatus: "OPEN" | "CLOSED" | "UNKNOWN";
  startTime: string | null;
  endTime: string | null;
};

export type AdminBoothManagementPub = {
  id: number;
  type: "PUB";
  collegeId: number;
  name: string;
  intro: string | null;
  description: string | null;
  collegeName: string;
  department: string;
  instagram: string | null;
  operationInfoExists: boolean;
  displayOperationIds: number[];
};

export type AdminPubOperation = {
  id: number;
  operationDate: string;
  startTime: string;
  endTime: string;
};

export type AdminCollegeOption = {
  id: number;
  name: string;
};

export type AdminPubImage = {
  id: number;
  imageUrl: string;
  isMain: boolean;
  createdAt: string;
};

export type AdminBoothManagementResponse = {
  booths: AdminBoothManagementBooth[];
  pubs: AdminBoothManagementPub[];
  pubOperations: AdminPubOperation[];
  colleges: AdminCollegeOption[];
};

export type UpdateAdminBoothPayload = {
  operationDate: string;
  operationStatus: "OPEN" | "CLOSED" | "UNKNOWN";
  name?: string | null;
  description?: string | null;
  startTime?: string | null;
  endTime?: string | null;
};

export type CreateAdminBoothPayload = {
  type: "EXPERIENCE" | "FOOD_TRUCK" | "EVENT" | "FACILITY";
  name: string;
  description?: string | null;
  operationStatus: "OPEN" | "CLOSED" | "UNKNOWN";
  startTime?: string | null;
  endTime?: string | null;
  operationDates: string[];
};

export type UpdateAdminPubPayload = {
  name?: string | null;
  intro?: string | null;
  description?: string | null;
  instagram?: string | null;
  displayOperationIds: number[];
};

export type CreateAdminPubPayload = {
  collegeId: number;
  department: string;
  name: string;
  intro?: string | null;
  description?: string | null;
  instagram?: string | null;
  displayOperationIds: number[];
};

export type UpsertAdminPubOperationPayload = {
  operationDate: string;
  startTime: string;
  endTime: string;
};

export type AdminPubImagePresignRequest = {
  fileName: string;
  contentType: string;
  fileSize?: number;
};

export type AdminPubImagePresignResponse = {
  presignedUrl: string;
  fileUrl: string;
  imageUrl?: string;
  expiresAt?: string;
  method: "PUT";
};

export type RegisterAdminPubImagesPayload = {
  imageUrls: string[];
  mainImageUrl?: string | null;
};

export async function getAdminBoothManagement(date?: string): Promise<AdminBoothManagementResponse> {
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  return fetchWithAuth<AdminBoothManagementResponse>(`/admin/map/booth-management${query}`, {
    method: "GET",
  });
}

export async function updateAdminBooth(
  boothId: number,
  payload: UpdateAdminBoothPayload,
): Promise<void> {
  await fetchWithAuth<void>(`/admin/map/booths/${boothId}/management`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function createAdminBooth(payload: CreateAdminBoothPayload): Promise<number> {
  return fetchWithAuth<number>("/admin/map/booths", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAdminPub(
  pubId: number,
  payload: UpdateAdminPubPayload,
): Promise<void> {
  await fetchWithAuth<void>(`/admin/map/pubs/${pubId}/management`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function createAdminPub(payload: CreateAdminPubPayload): Promise<number> {
  return fetchWithAuth<number>("/admin/map/pubs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function hideAdminPub(pubId: number): Promise<void> {
  await fetchWithAuth<void>(`/admin/map/pubs/${pubId}/hide`, {
    method: "PATCH",
  });
}

export async function createAdminPubOperation(
  payload: UpsertAdminPubOperationPayload,
): Promise<void> {
  await fetchWithAuth<void>("/admin/map/pub-operations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAdminPubOperation(
  pubOperationId: number,
  payload: UpsertAdminPubOperationPayload,
): Promise<void> {
  await fetchWithAuth<void>(`/admin/map/pub-operations/${pubOperationId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminPubOperation(pubOperationId: number): Promise<void> {
  await fetchWithAuth<void>(`/admin/map/pub-operations/${pubOperationId}`, {
    method: "DELETE",
  });
}

export async function getAdminPubImages(pubId: number): Promise<AdminPubImage[]> {
  return fetchWithAuth<AdminPubImage[]>(`/admin/map/pubs/${pubId}/images`, {
    method: "GET",
  });
}

export async function getAdminPubImagePresign(
  pubId: number,
  payload: AdminPubImagePresignRequest,
): Promise<AdminPubImagePresignResponse> {
  const endpoint = `/admin/map/pubs/${pubId}/images/presign`;
  const raw = await fetchWithAuth<unknown>(endpoint, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return parseNoticeImagePresignContract(raw, endpoint);
}

export async function registerAdminPubImages(
  pubId: number,
  payload: RegisterAdminPubImagesPayload,
): Promise<void> {
  await fetchWithAuth<void>(`/admin/map/pubs/${pubId}/images`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAdminPubMainImage(pubId: number, imageId: number): Promise<void> {
  await fetchWithAuth<void>(`/admin/map/pubs/${pubId}/images/${imageId}/main`, {
    method: "PATCH",
  });
}

export async function deleteAdminPubImage(pubId: number, imageId: number): Promise<void> {
  await fetchWithAuth<void>(`/admin/map/pubs/${pubId}/images/${imageId}`, {
    method: "DELETE",
  });
}

export type DirectUploadResponse = {
  imageUrl: string;
  key: string;
};

export async function uploadPubImageDirect(
  pubId: number,
  file: File,
): Promise<DirectUploadResponse> {
  const baseUrl = getApiBaseUrl();
  const token = getAdminAccessToken();
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${baseUrl}/admin/map/pubs/${pubId}/images/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) {
    throw Object.assign(new Error("주점 이미지 업로드에 실패했습니다."), { status: res.status });
  }

  return res.json();
}
