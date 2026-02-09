import { useCallback, useState } from "react";
import { wristbandApi } from "@/api/wristbandApi";
import type { WristbandAttendee, WristbandSession, WristbandStats } from "@/types/model/wristband.model";

export const useWristband = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const listSessions = useCallback(async (): Promise<WristbandSession[]> => {
    setLoading(true);
    setError(null);
    try {
      return await wristbandApi.listSessions();
    } catch (err) {
      setError(err as Error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getStats = useCallback(async (date: string): Promise<WristbandStats | null> => {
    setLoading(true);
    setError(null);
    try {
      return await wristbandApi.getStats(date);
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const findAttendee = useCallback(
    async (keyword: string, date: string): Promise<WristbandAttendee | null> => {
      setLoading(true);
      setError(null);
      try {
        return await wristbandApi.findAttendee(keyword, date);
      } catch (err) {
        setError(err as Error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const issueWristband = useCallback(async (keyword: string, date: string) => {
    setLoading(true);
    setError(null);
    try {
      await wristbandApi.issueWristband(keyword, date);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    listSessions,
    getStats,
    findAttendee,
    issueWristband,
  };
};
