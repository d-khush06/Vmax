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
        let user = null;
        if (msg.clerkId) {
          user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", msg.clerkId as string))
            .first();
        }
        
        if (!user && (msg as any).userId) {
          const allUsers = await ctx.db.query("users").collect();
          user = allUsers.find(u => u.tokenIdentifier === (msg as any).userId || u.clerkId === (msg as any).userId) || null;
        }
        
        let fileUrl = null;
        if (msg.fileStorageId) {
          fileUrl = await ctx.storage.getUrl(msg.fileStorageId);
        }

        let replyToMessage = null;
        if (msg.replyToMessageId) {
          const parent = await ctx.db.get(msg.replyToMessageId as any);
          if (parent) {
            let parentUser = null;
            if (parent.clerkId) {
              parentUser = await ctx.db.query("users").withIndex("by_clerkId", (q) => q.eq("clerkId", parent.clerkId as string)).first();
            }
            replyToMessage = { ...parent, users: parentUser };
          }
        }

        return { ...msg, users: user, fileUrl, replyToMessage };
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
    replyToMessageId: v.optional(v.id("messages")),
    isPoll: v.optional(v.boolean()),
    pollOptions: v.optional(v.array(v.object({ id: v.string(), text: v.string(), votes: v.array(v.string()) }))),
  },
  handler: async (ctx, args) => {
    const { teamId, content, clerkId, fileStorageId, fileName, fileType, replyToMessageId, isPoll, pollOptions } = args;
    const messageId = await ctx.db.insert("messages", {
      teamId,
      content,
      clerkId,
      fileStorageId,
      fileName,
      fileType,
      replyToMessageId,
      isPoll,
      pollOptions,
      isEdited: false,
      reactions: [],
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

export const toggleReaction = mutation({
  args: {
    messageId: v.id("messages"),
    emoji: v.string(),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    const reactions = message.reactions || [];
    const reactionIndex = reactions.findIndex(r => r.emoji === args.emoji);

    if (reactionIndex > -1) {
      const clerkIds = reactions[reactionIndex].clerkIds;
      if (clerkIds.includes(args.clerkId)) {
        // Remove user from reaction
        reactions[reactionIndex].clerkIds = clerkIds.filter(id => id !== args.clerkId);
        if (reactions[reactionIndex].clerkIds.length === 0) {
          reactions.splice(reactionIndex, 1);
        }
      } else {
        // Add user to reaction
        reactions[reactionIndex].clerkIds.push(args.clerkId);
      }
    } else {
      // Create new reaction
      reactions.push({ emoji: args.emoji, clerkIds: [args.clerkId] });
    }

    await ctx.db.patch(args.messageId, { reactions });
  },
});

export const votePoll = mutation({
  args: {
    messageId: v.id("messages"),
    optionId: v.string(),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message || !message.isPoll || !message.pollOptions) throw new Error("Poll not found");

    const pollOptions = message.pollOptions;
    
    // Remove user's vote from all options first (single vote policy)
    for (const opt of pollOptions) {
      opt.votes = opt.votes.filter(id => id !== args.clerkId);
    }
    
    // Add vote to selected option
    const option = pollOptions.find(o => o.id === args.optionId);
    if (option) {
      option.votes.push(args.clerkId);
    }

    await ctx.db.patch(args.messageId, { pollOptions });
  },
});
