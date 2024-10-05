import { TUserSecretCredentialsUpdate } from "@app/db/schemas";
import { TPermissionServiceFactory } from "@app/ee/services/permission/permission-service";

import { TKmsServiceFactory } from "../kms/kms-service";
import { TUserSecretsDALFactory } from "./user-secrets-dal";
import { getOrderByFromQueryParams } from "./user-secrets-helpers";
import { transformUserCredentialsToBusinessLogic } from "./user-secrets-transformer";
import {
  CreateSecretFuncParamsType,
  TCheckUserPermissions,
  TGetUserCredentialsOptionalParams
} from "./user-secrets-types";

type TUserSecretsServiceFactoryDep = {
  userSecretsDAL: TUserSecretsDALFactory;
  kmsService: TKmsServiceFactory;
  permissionService: TPermissionServiceFactory;
};

export type TUserSecretsServiceFactory = ReturnType<typeof userSecretsServiceFactory>;

export const userSecretsServiceFactory = ({
  userSecretsDAL,
  kmsService,
  permissionService
}: TUserSecretsServiceFactoryDep) => {
  const encryptWithRoot = kmsService.encryptWithRootKey();
  const decryptWithRoot = kmsService.decryptWithRootKey();

  const checkUserPermission = async (data: TCheckUserPermissions) => {
    const { permission } = await permissionService.getOrgPermission(
      data.actor,
      data.actorId,
      data.orgId,
      data.actorAuthMethod,
      data.actorOrgId
    );
    if (!permission) return false;
    return true;
  };

  const createUserCredentials = async (data: CreateSecretFuncParamsType & TCheckUserPermissions) => {
    // check user permission
    const hasPermission = await checkUserPermission({ ...data });
    if (!hasPermission) {
      throw new Error("User does not have permission to create secrets");
    }

    // create user secrets if not exists
    const userSecrets = await userSecretsDAL.createIfNotExistsUserSecret({
      orgId: data.orgId,
      userId: data.actorId
    });

    const stringifiedFields = JSON.stringify(data.fields);
    const encryptedFields = encryptWithRoot(Buffer.from(stringifiedFields, "utf-8"));

    await userSecretsDAL.createCredentials({
      ...data,
      secretId: userSecrets.id,
      fields: encryptedFields.toString("base64")
    });
  };

  const getUserCredentials = async (
    userData: TCheckUserPermissions,
    optionalParams: TGetUserCredentialsOptionalParams
  ) => {
    // check user permissions
    const hasPermission = await checkUserPermission({ ...userData });
    if (!hasPermission) {
      throw new Error("User does not have permission to get secrets");
    }
    const { orgId, actorId: userId } = userData;

    const optioanlDbQueryParams = {
      ...optionalParams,
      orderBy: optionalParams.orderBy ? getOrderByFromQueryParams(optionalParams.orderBy) : undefined
    };

    const secrets = await userSecretsDAL.getCredentials(orgId, userId, optioanlDbQueryParams);
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

  const updateUserCredentialById = async (
    id: string,
    fields: Pick<TUserSecretCredentialsUpdate, "fields">,
    userData: TCheckUserPermissions
  ) => {
    // check user permissions
    const hasPermission = await checkUserPermission({ ...userData });
    if (!hasPermission) {
      throw new Error("User does not have permission to update secrets");
    }

    const stringifiedFields = JSON.stringify(fields);
    const encryptedFields = encryptWithRoot(Buffer.from(stringifiedFields, "utf-8"));
    await userSecretsDAL.updateCredentialsById(id, {
      fields: encryptedFields.toString("base64")
    });
  };

  const deleteCredentialsById = async (id: string, userData: TCheckUserPermissions) => {
    // check user permissions
    const hasPermission = await checkUserPermission({ ...userData });
    if (!hasPermission) {
      throw new Error("User does not have permission to delete secrets");
    }
    await userSecretsDAL.deleteCredentialsById(id);
  };

  return {
    getUserCredentials,
    createUserCredentials,
    updateUserCredentialById,
    deleteCredentialsById
  };
};
