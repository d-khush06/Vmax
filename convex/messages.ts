import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_teamId", (q) => q.eq("teamId", args.teamId))
      .collect();

    // Populate user info for each message
    const messagesWithUsers = await Promise.all(
      messages.map(async (msg) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", msg.clerkId))
          .first();
        
        let fileUrl = null;
        if (msg.fileStorageId) {
          fileUrl = await ctx.storage.getUrl(msg.fileStorageId);
        }

        return { ...msg, users: user, fileUrl };
      })
    );

    return messagesWithUsers;
  },
});

export const send = mutation({
  args: {
    teamId: v.id("teams"),
    content: v.string(),
    clerkId: v.string(),
    fileStorageId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
    fileType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { teamId, content, clerkId, fileStorageId, fileName, fileType } = args;
    const messageId = await ctx.db.insert("messages", {
      teamId,
      content,
      clerkId,
      fileStorageId,
      fileName,
      fileType,
      isEdited: false,
    });
    return messageId;
  },
});

export const update = mutation({
  args: {
    messageId: v.id("messages"),
    content: v.string(),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");
    if (message.clerkId !== args.clerkId) throw new Error("Unauthorized");

    await ctx.db.patch(args.messageId, { content: args.content, isEdited: true });
  },
});

export const remove = mutation({
  args: {
    messageId: v.id("messages"),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");
    if (message.clerkId !== args.clerkId) throw new Error("Unauthorized");

    await ctx.db.delete(args.messageId);
  },
});
