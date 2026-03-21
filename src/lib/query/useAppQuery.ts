import {
  type QueryKey,
  type UseQueryOptions,
  type UseQueryResult,
  useQuery,
} from "@tanstack/react-query";
import { type AppError, normalizeAppError } from "@/lib/error/appError";

type AppQueryFnContext = {
  signal: AbortSignal;
};

export type AppQueryOptions<TData, TQueryKey extends QueryKey> = Omit<
  UseQueryOptions<TData, AppError, TData, TQueryKey>,
  "queryFn"
> & {
  queryFn: (context: AppQueryFnContext) => Promise<TData>;
};

export const useAppQuery = <TData, TQueryKey extends QueryKey>(
  options: AppQueryOptions<TData, TQueryKey>,
): UseQueryResult<TData, AppError> => {
  const { queryFn, ...restOptions } = options;

  return useQuery({
    ...restOptions,
    queryFn: async ({ signal }) => {
      try {
        return await queryFn({ signal });
      } catch (error) {
        throw normalizeAppError(error);
      }
    },
  });
};
