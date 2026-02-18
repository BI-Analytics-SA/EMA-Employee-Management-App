/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as contracts_actions from "../contracts/actions.js";
import type * as contracts_mutations from "../contracts/mutations.js";
import type * as contracts_queries from "../contracts/queries.js";
import type * as dashboard_queries from "../dashboard/queries.js";
import type * as documents_actions from "../documents/actions.js";
import type * as documents_mutations from "../documents/mutations.js";
import type * as documents_queries from "../documents/queries.js";
import type * as employees_actions from "../employees/actions.js";
import type * as employees_mutations from "../employees/mutations.js";
import type * as employees_queries from "../employees/queries.js";
import type * as http from "../http.js";
import type * as invites_actions from "../invites/actions.js";
import type * as invites_mutations from "../invites/mutations.js";
import type * as invites_queries from "../invites/queries.js";
import type * as lib_permissions from "../lib/permissions.js";
import type * as lib_storage from "../lib/storage.js";
import type * as migrations_stripContractFields from "../migrations/stripContractFields.js";
import type * as migrations_stripEmployeeFields from "../migrations/stripEmployeeFields.js";
import type * as organizations_mutations from "../organizations/mutations.js";
import type * as organizations_queries from "../organizations/queries.js";
import type * as reportPreferences_mutations from "../reportPreferences/mutations.js";
import type * as reportPreferences_queries from "../reportPreferences/queries.js";
import type * as userProfiles_mutations from "../userProfiles/mutations.js";
import type * as userProfiles_queries from "../userProfiles/queries.js";
import type * as users_queries from "../users/queries.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  "contracts/actions": typeof contracts_actions;
  "contracts/mutations": typeof contracts_mutations;
  "contracts/queries": typeof contracts_queries;
  "dashboard/queries": typeof dashboard_queries;
  "documents/actions": typeof documents_actions;
  "documents/mutations": typeof documents_mutations;
  "documents/queries": typeof documents_queries;
  "employees/actions": typeof employees_actions;
  "employees/mutations": typeof employees_mutations;
  "employees/queries": typeof employees_queries;
  http: typeof http;
  "invites/actions": typeof invites_actions;
  "invites/mutations": typeof invites_mutations;
  "invites/queries": typeof invites_queries;
  "lib/permissions": typeof lib_permissions;
  "lib/storage": typeof lib_storage;
  "migrations/stripContractFields": typeof migrations_stripContractFields;
  "migrations/stripEmployeeFields": typeof migrations_stripEmployeeFields;
  "organizations/mutations": typeof organizations_mutations;
  "organizations/queries": typeof organizations_queries;
  "reportPreferences/mutations": typeof reportPreferences_mutations;
  "reportPreferences/queries": typeof reportPreferences_queries;
  "userProfiles/mutations": typeof userProfiles_mutations;
  "userProfiles/queries": typeof userProfiles_queries;
  "users/queries": typeof users_queries;
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
