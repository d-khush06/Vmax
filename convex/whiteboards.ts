import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const whiteboard = await ctx.db
      .query("whiteboards")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .first();
    
    return whiteboard;
  },
});

export const save = mutation({
  args: { 
    teamId: v.id("teams"),
    snapshot: v.string() 
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("whiteboards")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { snapshot: args.snapshot });
    } else {
      await ctx.db.insert("whiteboards", {
        teamId: args.teamId,
        snapshot: args.snapshot,
      });
    }
  },
});
