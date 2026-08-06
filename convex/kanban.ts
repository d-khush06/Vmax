import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { teamId: v.optional(v.id("teams")) },
  handler: async (ctx, args) => {
    if (!args.teamId) return [];
    
    const tasks = await ctx.db
      .query("kanbanTasks")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId!))
      .order("desc")
      .collect();
      
    return tasks.map(t => ({
      ...t,
      id: t._id,
      column_id: t.columnId
    }));
  }
});

export const add = mutation({
  args: { 
    teamId: v.id("teams"),
    content: v.string(),
    columnId: v.string(),
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

    await ctx.db.insert("kanbanTasks", {
      teamId: args.teamId,
      createdBy: user._id,
      content: args.content,
      columnId: args.columnId,
    });
  }
});

export const updateColumn = mutation({
  args: { 
    taskId: v.id("kanbanTasks"),
    columnId: v.string() 
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, { columnId: args.columnId });
  }
});
