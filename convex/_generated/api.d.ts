/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as announcements from "../announcements.js";
import type * as audit from "../audit.js";
import type * as auth from "../auth.js";
import type * as badges from "../badges.js";
import type * as banners from "../banners.js";
import type * as changelogs from "../changelogs.js";
import type * as crons from "../crons.js";
import type * as downloads from "../downloads.js";
import type * as forum from "../forum.js";
import type * as homepageContent from "../homepageContent.js";
import type * as http from "../http.js";
import type * as launcher from "../launcher.js";
import type * as launcherNode from "../launcherNode.js";
import type * as passwordAuth from "../passwordAuth.js";
import type * as payments from "../payments.js";
import type * as paymentsNode from "../paymentsNode.js";
import type * as rbac from "../rbac.js";
import type * as resellerNode from "../resellerNode.js";
import type * as resellers from "../resellers.js";
import type * as subscriptions from "../subscriptions.js";
import type * as tickets from "../tickets.js";
import type * as users from "../users.js";
import type * as usersInternal from "../usersInternal.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  announcements: typeof announcements;
  audit: typeof audit;
  auth: typeof auth;
  badges: typeof badges;
  banners: typeof banners;
  changelogs: typeof changelogs;
  crons: typeof crons;
  downloads: typeof downloads;
  forum: typeof forum;
  homepageContent: typeof homepageContent;
  http: typeof http;
  launcher: typeof launcher;
  launcherNode: typeof launcherNode;
  passwordAuth: typeof passwordAuth;
  payments: typeof payments;
  paymentsNode: typeof paymentsNode;
  rbac: typeof rbac;
  resellerNode: typeof resellerNode;
  resellers: typeof resellers;
  subscriptions: typeof subscriptions;
  tickets: typeof tickets;
  users: typeof users;
  usersInternal: typeof usersInternal;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
