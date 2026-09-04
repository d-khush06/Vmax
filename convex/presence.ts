import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const updatePresence = mutation({
  args: {
    teamId: v.id("teams"),
    clerkId: v.string(),
    name: v.string(),
    avatarUrl: v.string(),
    route: v.string(),
    x: v.number(),
    y: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("presence")
      .withIndex("by_team_and_clerk", (q) =>
        q.eq("teamId", args.teamId).eq("clerkId", args.clerkId)
      )
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        avatarUrl: args.avatarUrl,
        route: args.route,
        x: args.x,
        y: args.y,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("presence", {
        teamId: args.teamId,
        clerkId: args.clerkId,
        name: args.name,
        avatarUrl: args.avatarUrl,
        route: args.route,
        x: args.x,
        y: args.y,
        updatedAt: now,
      });
    }

    // Optional: Cleanup old presence data (older than 1 minute)
    // In a production app, we'd use a cron job, but doing a small cleanup on write works for small scale.
    // Or we just filter it on the query side.
  },
});

export const getPresence = query({
  args: { teamId: v.id("teams"), route: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let presenceList = await ctx.db
      .query("presence")
      .withIndex("by_teamId", (q) => q.eq("teamId", args.teamId))
      .collect();

    const thirtySecondsAgo = Date.now() - 30000;
    
    // Filter out inactive users and match route if provided
    return presenceList.filter(p => {
      if (p.updatedAt < thirtySecondsAgo) return false;
      if (args.route && p.route !== args.route) return false;
      return true;
    });
  },
});
