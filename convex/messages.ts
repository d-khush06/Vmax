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
            clerkId: user?.tokenIdentifier,
          },
          created_at: msg._creationTime,
          fileUrl: msg.fileStorageId ? await ctx.storage.getUrl(msg.fileStorageId) : undefined,
        };
      })
    );
  }
});

export const send = mutation({
  args: { 
    teamId: v.id("teams"),
    content: v.string(),
    clerkId: v.optional(v.string()),
    gifUrl: v.optional(v.string()),
    fileStorageId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
    fileType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const subject = identity?.subject || args.clerkId;
    
    if (!subject) throw new Error("Unauthenticated");

    let user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", subject))
      .first();

    if (!user && args.clerkId) {
      const allUsers = await ctx.db.query("users").collect();
      user = allUsers.find(u => u.tokenIdentifier.includes(args.clerkId!)) || null;
    }

    if (!user) throw new Error("User not found");

    await ctx.db.insert("messages", {
      teamId: args.teamId,
      userId: user._id,
      channelId: "general",
      content: args.content,
      gifUrl: args.gifUrl,
      fileStorageId: args.fileStorageId,
      fileName: args.fileName,
      fileType: args.fileType,
    });
  }
});

export const update = mutation({
  args: {
    messageId: v.id("messages"),
    content: v.string(),
    clerkId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const subject = identity?.subject || args.clerkId;
    if (!subject) throw new Error("Unauthenticated");

    let user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", subject))
      .first();

    if (!user && args.clerkId) {
      const allUsers = await ctx.db.query("users").collect();
      user = allUsers.find(u => u.tokenIdentifier.includes(args.clerkId!)) || null;
    }
    if (!user) throw new Error("User not found");

    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");
    if (message.userId !== user._id) throw new Error("Unauthorized");

    await ctx.db.patch(args.messageId, {
      content: args.content,
      isEdited: true
    });
  }
});

export const remove = mutation({
  args: {
    messageId: v.id("messages"),
    clerkId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const subject = identity?.subject || args.clerkId;
    if (!subject) throw new Error("Unauthenticated");

    let user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", subject))
      .first();

    if (!user && args.clerkId) {
      const allUsers = await ctx.db.query("users").collect();
      user = allUsers.find(u => u.tokenIdentifier.includes(args.clerkId!)) || null;
    }
    if (!user) throw new Error("User not found");

    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");
    if (message.userId !== user._id) throw new Error("Unauthorized");

    // Optional: Delete associated file if it exists
    if (message.fileStorageId) {
      await ctx.storage.delete(message.fileStorageId);
    }

    await ctx.db.delete(args.messageId);
  }
});
