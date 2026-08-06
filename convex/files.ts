import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveFile = mutation({
  args: {
    teamId: v.id("teams"),
    storageId: v.id("_storage"),
    name: v.string(),
    size: v.number(),
    type: v.string(),
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

    await ctx.db.insert("files", {
      teamId: args.teamId,
      userId: user._id,
      storageId: args.storageId,
      name: args.name,
      size: args.size,
      type: args.type,
    });
  },
});

export const listFiles = query({
  args: { teamId: v.optional(v.id("teams")) },
  handler: async (ctx, args) => {
    if (!args.teamId) return [];

    const files = await ctx.db
      .query("files")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId!))
      .order("desc")
      .collect();

    return await Promise.all(
      files.map(async (f) => {
        const user = await ctx.db.get(f.userId);
        const url = await ctx.storage.getUrl(f.storageId);
        return {
          ...f,
          url,
          users: {
            full_name: user?.name,
            avatar_url: user?.avatarUrl,
          },
          created_at: f._creationTime,
        };
      })
    );
  },
});
