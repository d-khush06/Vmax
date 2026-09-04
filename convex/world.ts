import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getWorldObjects = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("worldObjects")
      .withIndex("by_teamId", (q) => q.eq("teamId", args.teamId))
      .collect();
  }
});

export const placeObject = mutation({
  args: {
    teamId: v.id("teams"),
    type: v.string(),
    gridX: v.number(),
    gridY: v.number(),
    milestoneId: v.optional(v.string()),
    status: v.string(),
    metadata: v.any()
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("worldObjects", {
      teamId: args.teamId,
      type: args.type,
      gridX: args.gridX,
      gridY: args.gridY,
      milestoneId: args.milestoneId,
      status: args.status,
      metadata: args.metadata
    });
  }
});

export const completeMilestoneObject = mutation({
  args: {
    teamId: v.id("teams"),
    milestoneId: v.string(),
  },
  handler: async (ctx, args) => {
    const obj = await ctx.db
      .query("worldObjects")
      .withIndex("by_teamId", (q) => q.eq("teamId", args.teamId))
      .filter((q) => q.eq(q.field("milestoneId"), args.milestoneId))
      .first();

    if (obj) {
      await ctx.db.patch(obj._id, { status: "complete" });
    }
  }
});

// Mock timezone lighting. Real implementation would check active users' timezones.
export const getWorldTimeOfDay = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    // Return a dummy value based on server time for now,
    // or calculate based on team members' local time if available in `users` table.
    const hour = new Date().getUTCHours();
    
    if (hour >= 6 && hour < 18) {
      return "day";
    } else if (hour >= 18 && hour < 20) {
      return "dusk";
    } else {
      return "night";
    }
  }
});
