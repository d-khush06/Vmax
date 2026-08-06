import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { teamId: v.optional(v.id("teams")) },
  handler: async (ctx, args) => {
    if (!args.teamId) return [];
    
    const events = await ctx.db
      .query("calendarEvents")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId!))
      .collect();
      
    return events.map(e => ({
      ...e,
      id: e._id,
      start_time: e.startTime,
      end_time: e.endTime
    }));
  }
});

export const add = mutation({
  args: { 
    teamId: v.id("teams"),
    title: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    clerkId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const subject = identity?.subject || args.clerkId;
    
    if (!subject) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", subject))
      .first();

    if (!user) throw new Error("User not found");

    await ctx.db.insert("calendarEvents", {
      teamId: args.teamId,
      createdBy: user._id,
      title: args.title,
      startTime: args.startTime,
      endTime: args.endTime
    });
  }
});
