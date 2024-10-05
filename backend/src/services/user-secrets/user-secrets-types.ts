import { TUserSecretCredentials, TUserSecretCredentialsInsert, TUserSecrets } from "@app/db/schemas";

import { ActorAuthMethod, ActorType } from "../auth/auth-type";

export enum CredentialTypes {
  WebLogin = "web_login",
  CreditCard = "credit_card",
  SecureNote = "secure_note"
}

export type GetSecretReturnType = TUserSecrets & TUserSecretCredentials;

export type TransformCredentialsToBusinessLogicType = Omit<GetSecretReturnType, "fields"> & {
  fields: Record<string, string>;
};

export type CreateSecretFuncParamsType = Omit<TUserSecretCredentialsInsert, "secretId" | "fields"> & {
  fields: Record<string, string>;
};

export type GetSecretsServiceReturnType = {
  title: string;
  fields: Record<string, string>;
};

export type TCheckUserPermissions = {
  actor: ActorType;
  actorId: string;
  actorAuthMethod: ActorAuthMethod;
  actorOrgId: string;
  orgId: string;
};
