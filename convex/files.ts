import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const files = await ctx.db
      .query("files")
      .withIndex("by_teamId", (q) => q.eq("teamId", args.teamId))
      .collect();
      
    return await Promise.all(
      files.map(async (file) => ({
        ...file,
        url: await ctx.storage.getUrl(file.storageId),
      }))
    );
  }
});

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const saveFile = mutation({
  args: {
    teamId: v.id("teams"),
    storageId: v.id("_storage"),
    name: v.string(),
    size: v.number(),
    type: v.string(),
    uploaderId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("files", {
      teamId: args.teamId,
      storageId: args.storageId,
      name: args.name,
      size: args.size,
      type: args.type,
      uploaderId: args.uploaderId,
    });
  },
});

export const deleteFile = mutation({
  args: {
    fileId: v.id("files"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await ctx.storage.delete(args.storageId);
    await ctx.db.delete(args.fileId);
  },
});

export const renameFile = mutation({
  args: {
    fileId: v.id("files"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.fileId, { name: args.name });
  }
});
