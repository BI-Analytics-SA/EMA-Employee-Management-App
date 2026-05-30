/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ResendOTPPasswordReset from "../ResendOTPPasswordReset.js";
import type * as auth from "../auth.js";
import type * as contracts_actions from "../contracts/actions.js";
import type * as contracts_emailAction from "../contracts/emailAction.js";
import type * as contracts_mutations from "../contracts/mutations.js";
import type * as contracts_queries from "../contracts/queries.js";
import type * as crons from "../crons.js";
import type * as dashboard_queries from "../dashboard/queries.js";
import type * as documents_actions from "../documents/actions.js";
import type * as documents_mutations from "../documents/mutations.js";
import type * as documents_queries from "../documents/queries.js";
import type * as employees_actions from "../employees/actions.js";
import type * as employees_import from "../employees/import.js";
import type * as employees_mutations from "../employees/mutations.js";
import type * as employees_queries from "../employees/queries.js";
import type * as http from "../http.js";
import type * as invites_actions from "../invites/actions.js";
import type * as invites_mutations from "../invites/mutations.js";
import type * as invites_queries from "../invites/queries.js";
import type * as jobDocuments_actions from "../jobDocuments/actions.js";
import type * as jobDocuments_mutations from "../jobDocuments/mutations.js";
import type * as jobDocuments_queries from "../jobDocuments/queries.js";
import type * as jobs_mutations from "../jobs/mutations.js";
import type * as jobs_queries from "../jobs/queries.js";
import type * as lib_billing from "../lib/billing.js";
import type * as lib_calendarDates from "../lib/calendarDates.js";
import type * as lib_permissions from "../lib/permissions.js";
import type * as lib_planAccess from "../lib/planAccess.js";
import type * as lib_planEvents from "../lib/planEvents.js";
import type * as lib_platformAdmin from "../lib/platformAdmin.js";
import type * as lib_storage from "../lib/storage.js";
import type * as migrations_seedPlatformAdmins from "../migrations/seedPlatformAdmins.js";
import type * as migrations_stripContractFields from "../migrations/stripContractFields.js";
import type * as migrations_stripMedicalModule from "../migrations/stripMedicalModule.js";
import type * as organizations_mutations from "../organizations/mutations.js";
import type * as organizations_queries from "../organizations/queries.js";
import type * as platform_mutations from "../platform/mutations.js";
import type * as platform_queries from "../platform/queries.js";
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
  ResendOTPPasswordReset: typeof ResendOTPPasswordReset;
  auth: typeof auth;
  "contracts/actions": typeof contracts_actions;
  "contracts/emailAction": typeof contracts_emailAction;
  "contracts/mutations": typeof contracts_mutations;
  "contracts/queries": typeof contracts_queries;
  crons: typeof crons;
  "dashboard/queries": typeof dashboard_queries;
  "documents/actions": typeof documents_actions;
  "documents/mutations": typeof documents_mutations;
  "documents/queries": typeof documents_queries;
  "employees/actions": typeof employees_actions;
  "employees/import": typeof employees_import;
  "employees/mutations": typeof employees_mutations;
  "employees/queries": typeof employees_queries;
  http: typeof http;
  "invites/actions": typeof invites_actions;
  "invites/mutations": typeof invites_mutations;
  "invites/queries": typeof invites_queries;
  "jobDocuments/actions": typeof jobDocuments_actions;
  "jobDocuments/mutations": typeof jobDocuments_mutations;
  "jobDocuments/queries": typeof jobDocuments_queries;
  "jobs/mutations": typeof jobs_mutations;
  "jobs/queries": typeof jobs_queries;
  "lib/billing": typeof lib_billing;
  "lib/calendarDates": typeof lib_calendarDates;
  "lib/permissions": typeof lib_permissions;
  "lib/planAccess": typeof lib_planAccess;
  "lib/planEvents": typeof lib_planEvents;
  "lib/platformAdmin": typeof lib_platformAdmin;
  "lib/storage": typeof lib_storage;
  "migrations/seedPlatformAdmins": typeof migrations_seedPlatformAdmins;
  "migrations/stripContractFields": typeof migrations_stripContractFields;
  "migrations/stripMedicalModule": typeof migrations_stripMedicalModule;
  "organizations/mutations": typeof organizations_mutations;
  "organizations/queries": typeof organizations_queries;
  "platform/mutations": typeof platform_mutations;
  "platform/queries": typeof platform_queries;
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
