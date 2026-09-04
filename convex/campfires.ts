import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const getActiveCampfires = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db
      .query("campfires")
      .withIndex("by_teamId", (q) => q.eq("teamId", args.teamId))
      .filter((q) => q.gt(q.field("activeUntil"), now))
      .collect();
  }
});

export const igniteCampfire = mutation({
  args: {
    teamId: v.id("teams"),
    clerkId: v.string(),
    title: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const worldPosition = {
      x: Math.floor(Math.random() * 20),
      y: Math.floor(Math.random() * 20),
    };

    const fortyEightHours = 48 * 60 * 60 * 1000;
    
    const campfireId = await ctx.db.insert("campfires", {
      teamId: args.teamId,
      title: args.title,
      description: args.description,
      createdBy: args.clerkId,
      worldPosition,
      activeUntil: Date.now() + fortyEightHours,
      participantIds: [args.clerkId],
      createdAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.users.addXP, {
      clerkId: args.clerkId,
      amount: 20
    });

    return campfireId;
  }
});

export const joinCampfire = mutation({
  args: {
    campfireId: v.id("campfires"),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const campfire = await ctx.db.get(args.campfireId);
    if (!campfire) throw new Error("Campfire not found");

    if (!campfire.participantIds.includes(args.clerkId)) {
      await ctx.db.patch(args.campfireId, {
        participantIds: [...campfire.participantIds, args.clerkId],
      });
    }
  }
});

export const extinguishCampfire = mutation({
  args: {
    campfireId: v.id("campfires"),
  },
  handler: async (ctx, args) => {
    // Simply set activeUntil to now so it expires immediately
    await ctx.db.patch(args.campfireId, {
      activeUntil: Date.now(),
    });
  }
});
