import { useCallback, useState } from "react";
import { boardApi } from "@/api/boardApi";
import type {
  LostFoundInput,
  LostFoundItem,
  Notice,
  NoticeInput,
} from "@/types/model/board.model";

export const useBoard = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const listNotices = useCallback(async (): Promise<Notice[]> => {
    setLoading(true);
    setError(null);
    try {
      return await boardApi.listNotices();
    } catch (err) {
      setError(err as Error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createNotice = useCallback(async (payload: NoticeInput): Promise<Notice> => {
    setLoading(true);
    setError(null);
    try {
      return await boardApi.createNotice(payload);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const listLostItems = useCallback(async (): Promise<LostFoundItem[]> => {
    setLoading(true);
    setError(null);
    try {
      return await boardApi.listLostItems();
    } catch (err) {
      setError(err as Error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createLostItem = useCallback(
    async (payload: LostFoundInput): Promise<LostFoundItem> => {
      setLoading(true);
      setError(null);
      try {
        return await boardApi.createLostItem(payload);
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const updateLostItemClaimed = useCallback(
    async (id: string, isClaimed: boolean): Promise<LostFoundItem> => {
      setLoading(true);
      setError(null);
      try {
        return await boardApi.updateLostItemClaimed(id, isClaimed);
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    loading,
    error,
    listNotices,
    createNotice,
    listLostItems,
    createLostItem,
    updateLostItemClaimed,
  };
};
