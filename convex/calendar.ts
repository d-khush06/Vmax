import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("calendar_events")
      .withIndex("by_teamId", (q) => q.eq("teamId", args.teamId))
      .collect();
  }
});

export const add = mutation({
  args: {
    teamId: v.id("teams"),
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.string(),
    endTime: v.string(),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("calendar_events", {
      teamId: args.teamId,
      title: args.title,
      description: args.description,
      startTime: args.startTime,
      endTime: args.endTime,
      clerkId: args.clerkId,
    });
  }
});
