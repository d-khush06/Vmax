import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const updateTheme = mutation({
  args: { clerkId: v.string(), theme: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      return;
    }

    await ctx.db.patch(user._id, { theme: args.theme });
  },
});

export const getTheme = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    return user?.theme || "classic";
  },
});

export const getPingStamina = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) return { remaining: 0, max: 5 };

    const MAX_PINGS = 5;
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    // Reset logic if it's been a day
    if (!user.lastPingResetAt || now - user.lastPingResetAt > oneDay) {
      return { remaining: MAX_PINGS, max: MAX_PINGS };
    }

    return { remaining: user.pingsRemaining ?? MAX_PINGS, max: MAX_PINGS };
  },
});

export const consumePing = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) throw new Error("User not found");

    const MAX_PINGS = 5;
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    let remaining = user.pingsRemaining ?? MAX_PINGS;
    let lastReset = user.lastPingResetAt ?? now;

    if (now - lastReset > oneDay) {
      remaining = MAX_PINGS;
      lastReset = now;
    }

    if (remaining <= 0) {
      throw new Error("You are out of Ping Stamina for today! Build a Campfire instead.");
    }

    await ctx.db.patch(user._id, {
      pingsRemaining: remaining - 1,
      lastPingResetAt: lastReset,
    });
    
    return remaining - 1;
  },
});

export const getUserProgress = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) return { level: 1, xp: 0 };
    return { level: user.level ?? 1, xp: user.xp ?? 0 };
  }
});

import { internalMutation } from "./_generated/server";

export const addXP = internalMutation({
  args: { clerkId: v.string(), amount: v.number() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      await ctx.db.insert("users", {
        clerkId: args.clerkId,
        email: "",
        level: 1,
        xp: args.amount,
        pingsRemaining: 5,
        lastPingResetAt: Date.now()
      });
      return;
    }

    let currentLevel = user.level ?? 1;
    let currentXP = (user.xp ?? 0) + args.amount;
    
    // Level up logic (simple: 100 XP per level)
    const xpNeeded = currentLevel * 100;
    if (currentXP >= xpNeeded) {
      currentLevel += 1;
      currentXP -= xpNeeded;
    }

    await ctx.db.patch(user._id, {
      level: currentLevel,
      xp: currentXP,
    });
  }
});

export const syncUser = mutation({
  args: {
    clerkId: v.string(),
    full_name: v.optional(v.string()),
    avatar_url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        full_name: args.full_name ?? existingUser.full_name,
        avatar_url: args.avatar_url ?? existingUser.avatar_url,
      });
      return existingUser._id;
    } else {
      return await ctx.db.insert("users", {
        clerkId: args.clerkId,
        email: "",
        full_name: args.full_name,
        avatar_url: args.avatar_url,
        level: 1,
        xp: 0,
        pingsRemaining: 5,
        lastPingResetAt: Date.now()
      });
    }
  }
});
