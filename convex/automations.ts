import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getAutomations = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("automations")
      .withIndex("by_teamId", (q) => q.eq("teamId", args.teamId))
      .collect();
  },
});

export const saveAutomation = mutation({
  args: {
    id: v.optional(v.union(v.id("automations"), v.null())),
    teamId: v.id("teams"),
    name: v.optional(v.string()), // <--- added
    createdBy: v.string(),
    enabled: v.boolean(),
    nodes: v.array(
      v.object({
        id: v.string(),
        type: v.string(),
        config: v.any(),
        position: v.object({ x: v.number(), y: v.number() }),
      })
    ),
    edges: v.array(
      v.object({
        id: v.string(),
        source: v.string(),
        target: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    if (args.id) {
      await ctx.db.patch(args.id, {
        name: args.name,
        nodes: args.nodes,
        edges: args.edges,
        enabled: args.enabled,
      });
      return args.id;
    } else {
      return await ctx.db.insert("automations", {
        teamId: args.teamId,
        name: args.name,
        createdBy: args.createdBy,
        enabled: args.enabled,
        nodes: args.nodes,
        edges: args.edges,
      });
    }
  },
});

export const deleteAutomation = mutation({
  args: { id: v.id("automations") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const toggleAutomation = mutation({
  args: { id: v.id("automations"), enabled: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { enabled: args.enabled });
  },
});
