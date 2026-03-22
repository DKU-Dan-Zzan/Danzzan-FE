import {
  type MutationKey,
  type UseMutationOptions,
  type UseMutationResult,
  useMutation,
} from "@tanstack/react-query";
import { type AppError, normalizeAppError } from "@/lib/error/appError";

export type AppMutationOptions<
  TData,
  TVariables = void,
  TContext = unknown,
  TMutationKey extends MutationKey = MutationKey,
> = Omit<
  UseMutationOptions<TData, AppError, TVariables, TContext>,
  "mutationFn" | "mutationKey"
> & {
  mutationFn: (variables: TVariables) => Promise<TData>;
  mutationKey?: TMutationKey;
};

export const useAppMutation = <
  TData,
  TVariables = void,
  TContext = unknown,
  TMutationKey extends MutationKey = MutationKey,
>(
  options: AppMutationOptions<TData, TVariables, TContext, TMutationKey>,
): UseMutationResult<TData, AppError, TVariables, TContext> => {
  const { mutationFn, ...restOptions } = options;

  return useMutation({
    ...restOptions,
    mutationFn: async (variables) => {
      try {
        return await mutationFn(variables);
      } catch (error) {
        throw normalizeAppError(error);
      }
    },
  });
};
