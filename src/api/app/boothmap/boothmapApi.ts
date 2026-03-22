import { http } from "@/lib/http"
import {
  parseBoothMapContract,
  parseBoothSummaryContract,
  parsePubDetailContract,
  parsePubsContract,
  type ContractBoothDto,
  type ContractBoothMapResponse,
  type ContractBoothSummaryResponse,
  type ContractCollegeDto,
  type ContractPubDetailResponse,
  type ContractPubSummaryResponse,
} from "@/api/app/boothmap/boothmapContract"

export type CollegeDto = ContractCollegeDto

export type BoothDto = ContractBoothDto

export type BoothMapResponse = ContractBoothMapResponse

export type BoothSummaryResponse = ContractBoothSummaryResponse

export type PubSummaryResponse = ContractPubSummaryResponse

export type PubDetailResponse = ContractPubDetailResponse

type RequestOptions = {
  signal?: AbortSignal
}

export async function getBoothMap(date?: string, options?: RequestOptions) {
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  const endpoint = `/map/booth-map${query}`
  const res = await http.get<unknown>(endpoint, {
    signal: options?.signal,
  });
  return parseBoothMapContract(res.data, endpoint);
}

export async function getBoothSummary(boothId: number, date?: string, options?: RequestOptions) {
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  const endpoint = `/map/booths/${boothId}${query}`
  const res = await http.get<unknown>(endpoint, {
    signal: options?.signal,
  });
  return parseBoothSummaryContract(res.data, endpoint);
}

export async function getPubs(date?: string, options?: RequestOptions) {
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  const endpoint = `/map/pubs${query}`
  const res = await http.get<unknown>(endpoint, {
    signal: options?.signal,
  });
  return parsePubsContract(res.data, endpoint);
}

export async function getPubDetail(pubId: number, date?: string, options?: RequestOptions) {
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  const endpoint = `/map/pubs/${pubId}${query}`
  const res = await http.get<unknown>(endpoint, {
    signal: options?.signal,
  });
  return parsePubDetailContract(res.data, endpoint);
}
