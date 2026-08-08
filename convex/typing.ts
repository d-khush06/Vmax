import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const setTyping = mutation({
  args: {
    teamId: v.id("teams"),
    clerkId: v.string(),
    isTyping: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("typing_indicators")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("clerkId", args.clerkId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        isTyping: args.isTyping,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("typing_indicators", {
        teamId: args.teamId,
        clerkId: args.clerkId,
        isTyping: args.isTyping,
        updatedAt: Date.now(),
      });
    }
  },
});

export const getTypingUsers = query({
  args: {
    teamId: v.id("teams"),
    currentUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const indicators = await ctx.db
      .query("typing_indicators")
      .withIndex("by_teamId", (q) => q.eq("teamId", args.teamId))
      .collect();

    // Filter out users who haven't updated in 5 seconds (stale) or current user
    const now = Date.now();
    const activeIndicators = indicators.filter(
      (ind) => ind.isTyping && ind.clerkId !== args.currentUserId && now - ind.updatedAt < 5000
    );

    return Promise.all(
      activeIndicators.map(async (ind) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", ind.clerkId))
          .first();
        return { ...ind, user };
      })
    );
  },
});
