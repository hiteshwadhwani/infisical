import { TDbClient } from "@app/db";
import {
  TableName,
  TUserSecretCredentialsInsert,
  TUserSecretCredentialsUpdate,
  TUserSecretsInsert
} from "@app/db/schemas";
import { DatabaseError } from "@app/lib/errors";
import { ormify } from "@app/lib/knex";

import { GetSecretReturnType } from "./user-secrets-types";

export type TUserSecretsDALFactory = ReturnType<typeof userSecretsDALFactory>;

export const userSecretsDALFactory = (db: TDbClient) => {
  const userSecretsOrm = ormify(db, TableName.UserSecrets);
  const userSecretCredentialsOrm = ormify(db, TableName.UserSecretCredentials);

  const createIfNotExistsUserSecret = async (data: TUserSecretsInsert) => {
    try {
      let userSecret = await userSecretsOrm.findOne({
        orgId: data.orgId,
        userId: data.userId
      });
      if (!userSecret) {
        userSecret = await userSecretsOrm.create(data);
      }
      return userSecret;
    } catch (error) {
      throw new DatabaseError({ error, message: "Error creating user secret" });
    }
  };

  const createCredentials = async (data: TUserSecretCredentialsInsert) => {
    try {
      await userSecretCredentialsOrm.insertMany([
        {
          credentialType: data.credentialType,
          title: data.title,
          fields: data.fields,
          secretId: data.secretId
        }
      ]);
    } catch (error) {
      throw new DatabaseError({ error, message: "Error creating secret" });
    }
  };

  const getCredentials = async (orgId: string, userId: string): Promise<GetSecretReturnType[] | void> => {
    try {
      const secrets = await db(TableName.UserSecrets)
        .where({ orgId, userId })
        .join(
          TableName.UserSecretCredentials,
          `${TableName.UserSecrets}.id`,
          `${TableName.UserSecretCredentials}.secretId`
        )
        .select(`${TableName.UserSecrets}.*`, `${TableName.UserSecretCredentials}.*`);
      return secrets as GetSecretReturnType[];
    } catch (error) {
      throw new DatabaseError({ error, message: "Error getting secrets" });
    }
  };

  const updateCredentialsById = async (recordId: string, data: TUserSecretCredentialsUpdate) => {
    try {
      await db(TableName.UserSecretCredentials).update(data).where({ id: recordId });
    } catch (error) {
      throw new DatabaseError({ error, message: "Error updating secret" });
    }
  };

  const deleteCredentialsById = async (recordId: string) => {
    try {
      await db(TableName.UserSecretCredentials).delete().where({ id: recordId });
    } catch (error) {
      throw new DatabaseError({ error, message: "Error deleting secret" });
    }
  };

  const getCredentialsByCredentialType = async (orgId: string, userId: string, credentialType: string) => {
    try {
      const secret = await db(TableName.UserSecrets)
        .where({ orgId, userId })
        .join(
          TableName.UserSecretCredentials,
          `${TableName.UserSecrets}.id`,
          `${TableName.UserSecretCredentials}.secretId`
        )
        .where({ credentialType })
        .select(`${TableName.UserSecrets}.*`, `${TableName.UserSecretCredentials}.*`);
      return secret as GetSecretReturnType[];
    } catch (error) {
      throw new DatabaseError({ error, message: "Error getting secret by validation type" });
    }
  };

  return {
    createIfNotExistsUserSecret,
    createCredentials,
    getCredentials,
    updateCredentialsById,
    deleteCredentialsById,
    getCredentialsByCredentialType
  };
};
