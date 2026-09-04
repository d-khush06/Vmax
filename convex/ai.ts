import { action, internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const getInsights = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ai_insights")
      .withIndex("by_teamId", (q) => q.eq("teamId", args.teamId))
      .order("desc")
      .take(10);
  }
});

// Using an Action because LLM calls are side-effects
export const generatePostMortem = action({
  args: {
    teamId: v.id("teams"),
    incidentId: v.id("incidents"),
    metadata: v.any(),
  },
  handler: async (ctx, args) => {
    // Stubbed LLM call. In a real environment with API keys, we would call OpenAI/Gemini here.
    // e.g. const response = await fetch("https://api.openai.com/v1/chat/completions", ...)
    
    // For now, simulate a network delay and generate a stubbed post-mortem.
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    const content = `Auto Post-Mortem for ${args.metadata?.title || 'Unknown Incident'}:\n\nRoot Cause Analysis: The system encountered a transient state failure during high load.\n\nResolution: Load balancers were scaled manually, and the incident was marked as resolved.\n\nAction Items: Monitor the specific cluster for the next 24 hours.`;

    // Save the insight back to the DB
    await ctx.runMutation(internal.ai.saveInsight, {
      teamId: args.teamId,
      type: "post-mortem",
      relatedId: args.incidentId,
      content,
    });
  }
});

export const saveInsight = internalMutation({
  args: {
    teamId: v.id("teams"),
    type: v.string(),
    relatedId: v.optional(v.string()),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("ai_insights", {
      teamId: args.teamId,
      type: args.type,
      relatedId: args.relatedId,
      content: args.content,
      createdAt: Date.now(),
    });
  }
});
