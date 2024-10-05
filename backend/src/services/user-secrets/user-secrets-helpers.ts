import { TselectQueryOptionalParams } from "./user-secrets-types";

export const getOrderByFromQueryParams = (orderBy: string): TselectQueryOptionalParams["orderBy"] => {
  const [column, order] = orderBy.split(":");
  return {
    column,
    order: order ? (order as "asc" | "desc") : undefined
  };
};
