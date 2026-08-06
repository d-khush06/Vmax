import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { teamId: v.optional(v.id("teams")) },
  handler: async (ctx, args) => {
    if (!args.teamId) return [];
    
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_team_and_channel", (q) => q.eq("teamId", args.teamId!).eq("channelId", "general"))
      .order("asc")
      .take(50);
      
    // Join with user data
    return await Promise.all(
      messages.map(async (msg) => {
        const user = await ctx.db.get(msg.userId);
        return {
          ...msg,
          users: {
            full_name: user?.name,
            avatar_url: user?.avatarUrl,
          },
          created_at: msg._creationTime
        };
      })
    );
  }
});

export const send = mutation({
  args: { 
    teamId: v.id("teams"),
    content: v.string(),
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

    await ctx.db.insert("messages", {
      teamId: args.teamId,
      userId: user._id,
      channelId: "general",
      content: args.content,
    });
  }
});
