import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const getActiveIncidents = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("incidents")
      .withIndex("by_teamId", (q) => q.eq("teamId", args.teamId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
  }
});

export const reportIncident = mutation({
  args: {
    teamId: v.id("teams"),
    title: v.string(),
    severity: v.string(), // "low", "medium", "high", "critical"
  },
  handler: async (ctx, args) => {
    const channelId = await ctx.db.insert("channels", {
      teamId: args.teamId,
      name: `incident-${Date.now().toString().slice(-4)}`,
      type: "text",
    });

    const worldPosition = {
      x: Math.floor(Math.random() * 20),
      y: Math.floor(Math.random() * 20),
    };

    return await ctx.db.insert("incidents", {
      teamId: args.teamId,
      severity: args.severity,
      status: "active",
      channelId,
      worldPosition,
      createdAt: Date.now(),
      metadata: { title: args.title },
    });
  }
});

export const resolveIncident = mutation({
  args: {
    incidentId: v.id("incidents"),
  },
  handler: async (ctx, args) => {
    const incident = await ctx.db.get(args.incidentId);
    if (!incident) return;
    
    await ctx.db.patch(args.incidentId, {
      status: "resolved",
      resolvedAt: Date.now(),
    });

    // Trigger AI Post-Mortem Action
    await ctx.scheduler.runAfter(0, api.ai.generatePostMortem, {
      teamId: incident.teamId,
      incidentId: incident._id,
      metadata: incident.metadata,
    });
  }
});
