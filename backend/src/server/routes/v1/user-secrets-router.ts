import { z } from "zod";

import { readLimit } from "@app/server/config/rateLimiter";
import { verifyAuth } from "@app/server/plugins/auth/verify-auth";
import { AuthMode } from "@app/services/auth/auth-type";
import { TCheckUserPermissions } from "@app/services/user-secrets/user-secrets-types";

export const registerUserSecretsRouter = async (server: FastifyZodProvider) => {
  server.route({
    method: "GET",
    url: "/",
    config: {
      rateLimit: readLimit
    },
    schema: {
      params: z.object({}),
      querystring: z.object({
        credentialType: z.string().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
        orderBy: z.string().optional()
      }),
      response: {
        200: z.object({
          status: z.string(),
          secrets: z.array(
            z.object({
              id: z.string(),
              title: z.string(),
              fields: z.any()
            })
          )
        })
      }
    },
    onRequest: verifyAuth([AuthMode.JWT]),
    handler: async (req) => {
      const userData: TCheckUserPermissions = {
        actor: req.permission.type,
        actorId: req.permission.id,
        actorAuthMethod: req.permission.authMethod,
        actorOrgId: req.permission.orgId,
        orgId: req.permission.orgId
      };
      const optionalParams = {
        credentialType: req.query.credentialType,
        limit: req.query.limit,
        offset: req.query.offset,
        orderBy: req.query.orderBy
      };
      const secrets = await server.services.userSecrets.getUserCredentials(userData, optionalParams);
      return {
        status: "success",
        secrets
      };
    }
  });

  server.route({
    method: "POST",
    url: "/",
    config: {
      rateLimit: readLimit
    },
    schema: {
      params: z.object({}),
      body: z.object({
        credentialType: z.string(),
        title: z.string().min(1),
        fields: z.record(z.string(), z.string())
      }),
      response: {
        200: z.object({
          status: z.string()
        })
      }
    },
    onRequest: verifyAuth([AuthMode.JWT]),
    handler: async (req) => {
      const userData: TCheckUserPermissions = {
        actor: req.permission.type,
        actorId: req.permission.id,
        actorAuthMethod: req.permission.authMethod,
        actorOrgId: req.permission.orgId,
        orgId: req.permission.orgId
      };

      await server.services.userSecrets.createUserCredentials({ ...userData, ...req.body });
      return {
        status: "success"
      };
    }
  });

  server.route({
    method: "DELETE",
    url: "/",
    config: {
      rateLimit: readLimit
    },
    schema: {
      querystring: z.object({
        id: z.string()
      }),
      response: {
        200: z.object({
          status: z.string()
        })
      }
    },
    onRequest: verifyAuth([AuthMode.JWT]),
    handler: async (req) => {
      const userData: TCheckUserPermissions = {
        actor: req.permission.type,
        actorId: req.permission.id,
        actorAuthMethod: req.permission.authMethod,
        actorOrgId: req.permission.orgId,
        orgId: req.permission.orgId
      };
      await server.services.userSecrets.deleteCredentialsById(req.query.id, userData);
      return {
        status: "success"
      };
    }
  });

  server.route({
    method: "PUT",
    url: "/",
    config: {
      rateLimit: readLimit
    },
    schema: {
      body: z.object({
        id: z.string(),
        fields: z.record(z.string(), z.string())
      }),
      response: {
        200: z.object({
          status: z.string()
        })
      }
    },
    onRequest: verifyAuth([AuthMode.JWT]),
    handler: async (req) => {
      const userData: TCheckUserPermissions = {
        actor: req.permission.type,
        actorId: req.permission.id,
        actorAuthMethod: req.permission.authMethod,
        actorOrgId: req.permission.orgId,
        orgId: req.permission.orgId
      };
      await server.services.userSecrets.updateUserCredentialById(req.body.id, req.body.fields, userData);
      return {
        status: "success"
      };
    }
  });
};
