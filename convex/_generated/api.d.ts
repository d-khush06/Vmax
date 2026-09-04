/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as automationEngine from "../automationEngine.js";
import type * as automations from "../automations.js";
import type * as calendar from "../calendar.js";
import type * as campfires from "../campfires.js";
import type * as files from "../files.js";
import type * as incidents from "../incidents.js";
import type * as kanban from "../kanban.js";
import type * as messages from "../messages.js";
import type * as presence from "../presence.js";
import type * as teams from "../teams.js";
import type * as trades from "../trades.js";
import type * as typing from "../typing.js";
import type * as users from "../users.js";
import type * as whiteboards from "../whiteboards.js";
import type * as world from "../world.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  automationEngine: typeof automationEngine;
  automations: typeof automations;
  calendar: typeof calendar;
  campfires: typeof campfires;
  files: typeof files;
  incidents: typeof incidents;
  kanban: typeof kanban;
  messages: typeof messages;
  presence: typeof presence;
  teams: typeof teams;
  trades: typeof trades;
  typing: typeof typing;
  users: typeof users;
  whiteboards: typeof whiteboards;
  world: typeof world;
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
