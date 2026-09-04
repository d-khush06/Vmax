import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.optional(v.string()),
    email: v.string(),
    full_name: v.optional(v.string()),
    avatar_url: v.optional(v.string()),
    name: v.optional(v.string()),
    tokenIdentifier: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    theme: v.optional(v.string()),
    pingsRemaining: v.optional(v.number()),
    lastPingResetAt: v.optional(v.number()),
    level: v.optional(v.number()),
    xp: v.optional(v.number()),
  }).index("by_clerkId", ["clerkId"]),

  teams: defineTable({
    name: v.string(),
    joinCode: v.string(),
    createdBy: v.string(), // clerkId
    imageUrl: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
  }).index("by_joinCode", ["joinCode"]),

  teamMembers: defineTable({
    teamId: v.id("teams"),
    clerkId: v.optional(v.string()),
    userId: v.optional(v.string()),
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
    clerkId: v.optional(v.string()),
    userId: v.optional(v.string()),
    channelId: v.optional(v.string()),
    content: v.string(),
    fileStorageId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
    fileType: v.optional(v.string()),
    isEdited: v.optional(v.boolean()),
    reactions: v.optional(
      v.array(
        v.object({
          emoji: v.string(),
          clerkIds: v.array(v.string()),
        })
      )
    ),
    replyToMessageId: v.optional(v.id("messages")),
    isPoll: v.optional(v.boolean()),
    pollOptions: v.optional(
      v.array(
        v.object({
          id: v.string(),
          text: v.string(),
          votes: v.array(v.string()), // array of clerkIds
        })
      )
    ),
  }).index("by_teamId", ["teamId"]),

  typing_indicators: defineTable({
    teamId: v.id("teams"),
    clerkId: v.string(),
    isTyping: v.boolean(),
    updatedAt: v.number(),
  }).index("by_team_and_user", ["teamId", "clerkId"])
    .index("by_teamId", ["teamId"]),

  whiteboards: defineTable({
    teamId: v.id("teams"),
    snapshot: v.string(),
  }).index("by_teamId", ["teamId"]),

  kanban_tasks: defineTable({
    teamId: v.id("teams"),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.string(), // e.g. 'todo', 'in-progress', 'done'
    clerkId: v.optional(v.string()),
    userId: v.optional(v.string()),
    priority: v.optional(v.string()), // 'low', 'medium', 'high', 'urgent'
    assigneeId: v.optional(v.string()), // clerkId
    tags: v.optional(v.array(v.string())),
    dueDate: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    checklist: v.optional(
      v.array(
        v.object({
          id: v.string(),
          title: v.string(),
          completed: v.boolean(),
        })
      )
    ),
    comments: v.optional(
      v.array(
        v.object({
          id: v.string(),
          clerkId: v.string(),
          text: v.string(),
          createdAt: v.number(),
        })
      )
    ),
  }).index("by_teamId", ["teamId"]),

  files: defineTable({
    teamId: v.id("teams"),
    storageId: v.id("_storage"),
    name: v.string(),
    size: v.number(),
    type: v.string(),
    uploaderId: v.optional(v.string()), // clerkId
    userId: v.optional(v.string()), // legacy field
  }).index("by_teamId", ["teamId"]),

  calendar_events: defineTable({
    teamId: v.id("teams"),
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.string(),
    endTime: v.string(),
    clerkId: v.optional(v.string()),
    userId: v.optional(v.string()),
  }).index("by_teamId", ["teamId"]),

  automations: defineTable({
    teamId: v.id("teams"),
    name: v.optional(v.string()), // Added for flowchart naming
    createdBy: v.string(),
    enabled: v.boolean(),
    nodes: v.array(
      v.object({
        id: v.string(),
        type: v.string(), // "lever" | "wire" | "piston"
        config: v.any(),
        position: v.object({ x: v.number(), y: v.number() }),
      })
    ),
    edges: v.array(
      v.object({
        id: v.string(),
        source: v.string(),
        target: v.string(),
      })
    ),
  }).index("by_teamId", ["teamId"]),

  worldObjects: defineTable({
    teamId: v.id("teams"),
    type: v.string(), // 'building', 'statue', etc.
    gridX: v.number(),
    gridY: v.number(),
    milestoneId: v.optional(v.string()), 
    status: v.string(), // "scaffolding" | "complete"
    metadata: v.any(),
  }).index("by_teamId", ["teamId"]),

  incidents: defineTable({
    teamId: v.id("teams"),
    severity: v.string(), // "low" | "medium" | "high" | "critical"
    status: v.string(), // "active" | "resolved"
    channelId: v.optional(v.string()), // Dedicated chat/voice channel ID
    worldPosition: v.object({ x: v.number(), y: v.number() }),
    createdAt: v.number(),
    resolvedAt: v.optional(v.number()),
    metadata: v.any(), // Incident title, description, etc.
  }).index("by_teamId", ["teamId"])
    .index("by_status", ["status"]),

  trades: defineTable({
    teamId: v.id("teams"),
    initiatorId: v.string(), // clerkId
    receiverId: v.string(), // clerkId
    status: v.string(), // "pending" | "active" | "completed" | "cancelled"
    initiatorItems: v.array(v.any()), // array of file objects
    receiverItems: v.array(v.any()),
    initiatorAccepted: v.boolean(),
    receiverAccepted: v.boolean(),
    createdAt: v.number(),
  }).index("by_teamId", ["teamId"]),

  ai_insights: defineTable({
    teamId: v.id("teams"),
    type: v.string(), // "post-mortem" | "advice" | "summary"
    relatedId: v.optional(v.string()), // e.g., incidentId
    content: v.string(), // The AI generated text
    createdAt: v.number(),
  }).index("by_teamId", ["teamId"]),

  campfires: defineTable({
    teamId: v.id("teams"),
    title: v.string(),
    description: v.string(),
    createdBy: v.string(), // clerkId
    worldPosition: v.object({ x: v.number(), y: v.number() }),
    activeUntil: v.number(),
    participantIds: v.array(v.string()),
    createdAt: v.number(),
  }).index("by_teamId", ["teamId"]),

  presence: defineTable({
    teamId: v.id("teams"),
    clerkId: v.string(),
    name: v.string(),
    avatarUrl: v.string(),
    route: v.string(),
    x: v.number(),
    y: v.number(),
    updatedAt: v.number(),
  }).index("by_teamId", ["teamId"])
    .index("by_team_and_clerk", ["teamId", "clerkId"]),
});
