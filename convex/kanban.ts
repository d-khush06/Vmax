import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("kanban_tasks")
      .withIndex("by_teamId", (q) => q.eq("teamId", args.teamId))
      .collect();
  }
});

export const add = mutation({
  args: {
    teamId: v.id("teams"),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.string(),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("kanban_tasks", {
      teamId: args.teamId,
      title: args.title,
      description: args.description,
      status: args.status,
      clerkId: args.clerkId,
    });
  },
});

export const updateColumn = mutation({
  args: {
    taskId: v.id("kanban_tasks"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, { status: args.status });
  }
});
