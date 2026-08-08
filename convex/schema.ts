import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    full_name: v.optional(v.string()),
    avatar_url: v.optional(v.string()),
  }).index("by_clerkId", ["clerkId"]),

  teams: defineTable({
    name: v.string(),
    joinCode: v.string(),
    createdBy: v.string(), // clerkId
  }).index("by_joinCode", ["joinCode"]),

  teamMembers: defineTable({
    teamId: v.id("teams"),
    clerkId: v.string(),
    role: v.string(), // 'owner', 'admin', 'member'
  })
    .index("by_teamId", ["teamId"])
    .index("by_clerkId", ["clerkId"])
    .index("by_team_and_user", ["teamId", "clerkId"]),

  channels: defineTable({
    teamId: v.id("teams"),
    name: v.string(),
    type: v.string(), // 'text', 'voice'
  }).index("by_teamId", ["teamId"]),

  messages: defineTable({
    teamId: v.id("teams"),
    clerkId: v.string(),
    content: v.string(),
    fileStorageId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
    fileType: v.optional(v.string()),
    isEdited: v.optional(v.boolean()),
  }).index("by_teamId", ["teamId"]),

  whiteboards: defineTable({
    teamId: v.id("teams"),
    snapshot: v.string(),
  }).index("by_teamId", ["teamId"]),

  kanban_tasks: defineTable({
    teamId: v.id("teams"),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.string(), // e.g. 'todo', 'in-progress', 'done'
    clerkId: v.string(),
  }).index("by_teamId", ["teamId"]),

  files: defineTable({
    teamId: v.id("teams"),
    storageId: v.id("_storage"),
    name: v.string(),
    size: v.number(),
    type: v.string(),
    uploaderId: v.string(), // clerkId
  }).index("by_teamId", ["teamId"]),

  calendar_events: defineTable({
    teamId: v.id("teams"),
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.string(),
    endTime: v.string(),
    clerkId: v.string(),
  }).index("by_teamId", ["teamId"]),
});
