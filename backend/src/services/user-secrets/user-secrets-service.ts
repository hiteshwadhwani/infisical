import { TUserSecretCredentialsUpdate } from "@app/db/schemas";

import { TKmsServiceFactory } from "../kms/kms-service";
import { TUserSecretsDALFactory } from "./user-secrets-dal";
import { transformUserCredentialsToBusinessLogic } from "./user-secrets-transformer";
import { CreateSecretFuncParamsType } from "./user-secrets-types";

type TUserSecretsServiceFactoryDep = {
  userSecretsDAL: TUserSecretsDALFactory;
  kmsService: TKmsServiceFactory;
};

export type TUserSecretsServiceFactory = ReturnType<typeof userSecretsServiceFactory>;

export const userSecretsServiceFactory = ({ userSecretsDAL, kmsService }: TUserSecretsServiceFactoryDep) => {
  const encryptWithRoot = kmsService.encryptWithRootKey();
  const decryptWithRoot = kmsService.decryptWithRootKey();

  const createSecrets = async (data: CreateSecretFuncParamsType) => {
    const stringifiedFields = JSON.stringify(data.fields);
    const encryptedFields = encryptWithRoot(Buffer.from(stringifiedFields, "utf-8"));
    await userSecretsDAL.createSecret({
      ...data,
      fields: encryptedFields.toString("base64")
    });
  };

  const getSecrets = async (orgId: string, userId: string, credentialType?: string) => {
    const secrets = credentialType
      ? await userSecretsDAL.getSecretByCredentialType(orgId, userId, credentialType)
      : await userSecretsDAL.getSecrets(orgId, userId);
    if (!secrets) return [];
    const decryptedSecrets = secrets.map((secret) => {
      const decryptedFields = decryptWithRoot(Buffer.from(secret.fields, "base64"));
      const jsonDecryptedFields = JSON.parse(decryptedFields.toString("utf-8")) as Record<string, string>;
      return {
        ...secret,
        fields: jsonDecryptedFields
      };
    });
    return transformUserCredentialsToBusinessLogic(decryptedSecrets);
  };

  const updateSecrets = async (orgId: string, fields: Pick<TUserSecretCredentialsUpdate, "fields">) => {
    const stringifiedFields = JSON.stringify(fields);
    const encryptedFields = encryptWithRoot(Buffer.from(stringifiedFields, "utf-8"));
    await userSecretsDAL.updateSecrets(orgId, {
      fields: encryptedFields.toString("base64")
    });
  };

  return {
    getSecrets,
    createSecrets,
    updateSecrets,
    deleteSecret: userSecretsDAL.deleteSecret
  };
};
