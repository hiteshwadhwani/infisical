import { TselectQueryOptionalParams } from "./user-secrets-types";

export const DEFAULT_SELECT_QUERY_LIMIT: TselectQueryOptionalParams["limit"] = 5;
export const DEFAULT_SELECT_QUERY_OFFSET: TselectQueryOptionalParams["offset"] = 0;
export const DEFAULT_SELECT_QUERY_ORDER_BY: TselectQueryOptionalParams["orderBy"] = {
  column: "createdAt",
  order: "asc"
};
