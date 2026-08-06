import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(), // Clerk User ID (subject)
    name: v.string(),
    email: v.string(),
    avatarUrl: v.string(),
  }).index("by_token", ["tokenIdentifier"]),

  teams: defineTable({
    name: v.string(),
    joinCode: v.string(),
    createdBy: v.id("users"),
  }).index("by_joinCode", ["joinCode"]),

  teamMembers: defineTable({
    teamId: v.id("teams"),
    userId: v.id("users"),
    role: v.string(),
  })
    .index("by_team", ["teamId"])
    .index("by_user", ["userId"])
    .index("by_team_and_user", ["teamId", "userId"]),

  messages: defineTable({
    teamId: v.id("teams"),
    userId: v.id("users"),
    channelId: v.string(),
    content: v.string(),
  }).index("by_team_and_channel", ["teamId", "channelId"]),

  kanbanTasks: defineTable({
    teamId: v.id("teams"),
    createdBy: v.id("users"),
    content: v.string(),
    columnId: v.string(), // e.g. "todo", "in_progress", "done"
  }).index("by_team", ["teamId"]),

  calendarEvents: defineTable({
    teamId: v.id("teams"),
    createdBy: v.id("users"),
    title: v.string(),
    startTime: v.string(), // ISO String
    endTime: v.string(), // ISO String
  }).index("by_team", ["teamId"]),

  files: defineTable({
    teamId: v.id("teams"),
    userId: v.id("users"),
    storageId: v.id("_storage"),
    name: v.string(),
    size: v.number(),
    type: v.string(), // e.g. "image/png", "application/pdf"
  }).index("by_team", ["teamId"]),
});
