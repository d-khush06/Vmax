import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const list = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("kanban_tasks")
      .withIndex("by_teamId", (q) => q.eq("teamId", args.teamId))
      .collect();
      
    return await Promise.all(
      tasks.map(async (task) => {
        let assignee = null;
        if (task.assigneeId) {
          assignee = await ctx.db.query("users").withIndex("by_clerkId", q => q.eq("clerkId", task.assigneeId!)).first();
        }
        return { ...task, assignee };
      })
    );
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
    const taskId = await ctx.db.insert("kanban_tasks", {
      teamId: args.teamId,
      title: args.title,
      description: args.description,
      status: args.status,
      clerkId: args.clerkId,
    });

    await ctx.scheduler.runAfter(0, internal.automationEngine.executeTrigger, {
      teamId: args.teamId,
      triggerType: "task_created",
      payload: { taskId, title: args.title, status: args.status, clerkId: args.clerkId }
    });

    return taskId;
  },
});

export const updateColumn = mutation({
  args: {
    taskId: v.id("kanban_tasks"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    await ctx.db.patch(args.taskId, { status: args.status });
    if (task && task.status !== args.status) {
      await ctx.scheduler.runAfter(0, internal.automationEngine.executeTrigger, {
        teamId: task.teamId,
        triggerType: "task_moved",
        payload: { taskId: args.taskId, title: task.title, status: args.status, oldStatus: task.status }
      });
      
      if (args.status === "done" && task.clerkId) {
        await ctx.scheduler.runAfter(0, internal.users.addXP, {
          clerkId: task.clerkId,
          amount: 50
        });
      }
    }
  }
});
export const updateDetails = mutation({
  args: {
    taskId: v.id("kanban_tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(v.string()),
    assigneeId: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    dueDate: v.optional(v.string()),
    coverImage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { taskId, ...updates } = args;
    await ctx.db.patch(taskId, updates);
  },
});

export const addChecklist = mutation({
  args: {
    taskId: v.id("kanban_tasks"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) return;
    const checklist = task.checklist || [];
    checklist.push({
      id: crypto.randomUUID(),
      title: args.title,
      completed: false,
    });
    await ctx.db.patch(args.taskId, { checklist });
  },
});

export const toggleChecklist = mutation({
  args: {
    taskId: v.id("kanban_tasks"),
    itemId: v.string(),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) return;
    const checklist = task.checklist || [];
    const itemIndex = checklist.findIndex((i) => i.id === args.itemId);
    if (itemIndex > -1) {
      checklist[itemIndex].completed = !checklist[itemIndex].completed;
      await ctx.db.patch(args.taskId, { checklist });
    }
  },
});

export const removeChecklist = mutation({
  args: {
    taskId: v.id("kanban_tasks"),
    itemId: v.string(),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) return;
    const checklist = (task.checklist || []).filter((i) => i.id !== args.itemId);
    await ctx.db.patch(args.taskId, { checklist });
  },
});
