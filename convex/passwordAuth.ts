import { ConvexCredentials } from "@convex-dev/auth/providers/ConvexCredentials";
import {
  type EmailConfig,
  createAccount,
  invalidateSessions,
  modifyAccountCredentials,
  retrieveAccount,
  signInViaProvider,
  type GenericActionCtxWithAuthConfig,
} from "@convex-dev/auth/server";
import type { GenericDoc } from "@convex-dev/auth/server";
import type { GenericDataModel, WithoutSystemFields, DocumentByName } from "convex/server";
import type { Value } from "convex/values";
import { Scrypt } from "lucia";
import { internal } from "./_generated/api";

type PasswordFlow =
  | "signUp"
  | "signIn"
  | "reset"
  | "reset-verification"
  | "email-verification";

export interface PasswordConfig<DataModel extends GenericDataModel> {
  id?: string;
  profile?: (
    params: Record<string, Value | undefined>,
    ctx: GenericActionCtxWithAuthConfig<DataModel>,
  ) => WithoutSystemFields<DocumentByName<DataModel, "users">> & {
    email: string;
  };
  validatePasswordRequirements?: (password: string) => void;
  verify?: EmailConfig | ((...args: any[]) => EmailConfig);
  reset?: EmailConfig | ((...args: any[]) => EmailConfig);
}

function defaultProfile(params: Record<string, Value | undefined>) {
  return {
    email: String(params.email ?? "").trim().toLowerCase(),
  };
}

function validateDefaultPasswordRequirements(password: string) {
  if (!password || password.length < 8) {
    throw new Error("Invalid password");
  }
}

function isKnownAccountLookupError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }
  return (
    error.message === "InvalidAccountId" ||
    error.message === "InvalidSecret" ||
    error.message === "TooManyFailedAttempts"
  );
}

async function resolveEmailForSignIn<DataModel extends GenericDataModel>(
  ctx: GenericActionCtxWithAuthConfig<DataModel>,
  flow: PasswordFlow | undefined,
  params: Record<string, Value | undefined>,
  fallbackEmail: string,
) {
  if (flow !== "signIn" || fallbackEmail) {
    return fallbackEmail;
  }

  const username = typeof params.username === "string" ? params.username.trim().toLowerCase() : "";
  if (!username) {
    return fallbackEmail;
  }

  const matchedEmail = await ctx.runQuery(internal.usersInternal.resolveLoginEmailByHandle, {
    username,
  });

  return matchedEmail ?? fallbackEmail;
}

async function retrievePasswordAccount<DataModel extends GenericDataModel>(
  ctx: GenericActionCtxWithAuthConfig<DataModel>,
  provider: string,
  email: string,
  secret?: string,
) {
  try {
    return await retrieveAccount(ctx, {
      provider,
      account: {
        id: email,
        ...(secret !== undefined ? { secret } : {}),
      },
    });
  } catch (error) {
    if (!isKnownAccountLookupError(error)) {
      throw error;
    }
    return null;
  }
}

export function PasswordAuth<DataModel extends GenericDataModel>(
  config: PasswordConfig<DataModel> = {},
) {
  const provider = config.id ?? "password";

  return ConvexCredentials<DataModel>({
    id: "password",
    authorize: async (params, ctx) => {
      const flow = params.flow as PasswordFlow | undefined;
      const passwordToValidate =
        flow === "signUp"
          ? (params.password as string | undefined)
          : flow === "reset-verification"
            ? (params.newPassword as string | undefined)
            : null;

      if (passwordToValidate !== null) {
        if (passwordToValidate === undefined) {
          throw new Error("Missing password.");
        }
        if (config.validatePasswordRequirements) {
          config.validatePasswordRequirements(passwordToValidate);
        } else {
          validateDefaultPasswordRequirements(passwordToValidate);
        }
      }

      const profile = config.profile?.(params, ctx) ?? defaultProfile(params);
      const email = await resolveEmailForSignIn(
        ctx,
        flow,
        params,
        String(profile.email ?? "").trim().toLowerCase(),
      );
      if (!email) {
        throw new Error("Email is required.");
      }

      const secret = params.password as string | undefined;
      let account: GenericDoc<DataModel, "authAccounts">;
      let user: GenericDoc<DataModel, "users">;

      if (flow === "signUp") {
        if (secret === undefined) {
          throw new Error("Missing `password` param for `signUp` flow");
        }
        const created = await createAccount(ctx, {
          provider,
          account: { id: email, secret },
          profile: {
            ...profile,
            email,
          } as any,
          shouldLinkViaEmail: config.verify !== undefined,
          shouldLinkViaPhone: false,
        });
        ({ account, user } = created);
      } else if (flow === "signIn") {
        if (secret === undefined) {
          throw new Error("Missing `password` param for `signIn` flow");
        }
        const retrieved = await retrievePasswordAccount(ctx, provider, email, secret);
        if (retrieved === null) {
          throw new Error("Invalid credentials");
        }
        ({ account, user } = retrieved);
      } else if (flow === "reset") {
        if (!config.reset) {
          throw new Error(`Password reset is not enabled for ${provider}`);
        }
        const retrieved = await retrievePasswordAccount(ctx, provider, email);
        if (retrieved === null) {
          throw new Error("Invalid credentials");
        }
        ({ account } = retrieved);
        return await signInViaProvider(ctx, config.reset, {
          accountId: account._id,
          params,
        });
      } else if (flow === "reset-verification") {
        if (!config.reset) {
          throw new Error(`Password reset is not enabled for ${provider}`);
        }
        const nextPassword = params.newPassword as string | undefined;
        if (nextPassword === undefined) {
          throw new Error("Missing `newPassword` param for `reset-verification` flow");
        }
        const retrieved = await retrievePasswordAccount(ctx, provider, email);
        if (retrieved === null) {
          throw new Error("Invalid credentials");
        }
        const { account: resetAccount } = retrieved;
        const result = await signInViaProvider(ctx, config.reset, { params });
        if (result === null || resetAccount.userId !== result.userId) {
          throw new Error("Invalid code");
        }
        await modifyAccountCredentials(ctx, {
          provider,
          account: { id: email, secret: nextPassword },
        });
        await invalidateSessions(ctx, { userId: result.userId, except: [result.sessionId] });
        return result;
      } else if (flow === "email-verification") {
        if (!config.verify) {
          throw new Error(`Email verification is not enabled for ${provider}`);
        }
        const retrieved = await retrievePasswordAccount(ctx, provider, email);
        if (retrieved === null) {
          throw new Error("Invalid credentials");
        }
        ({ account } = retrieved);
        return await signInViaProvider(ctx, config.verify, {
          accountId: account._id,
          params,
        });
      } else {
        throw new Error(
          "Missing `flow` param, it must be one of " +
            '"signUp", "signIn", "reset", "reset-verification" or ' +
            '"email-verification"!',
        );
      }

      if (config.verify && !account.emailVerified) {
        return await signInViaProvider(ctx, config.verify, {
          accountId: account._id,
          params,
        });
      }

      return { userId: user._id };
    },
    crypto: {
      async hashSecret(password: string) {
        return await new Scrypt().hash(password);
      },
      async verifySecret(password: string, hash: string) {
        return await new Scrypt().verify(hash, password);
      },
    },
    extraProviders: [config.reset, config.verify],
  });
}
