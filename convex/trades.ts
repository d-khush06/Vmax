import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getActiveTrade = query({
  args: { teamId: v.id("teams"), clerkId: v.string() },
  handler: async (ctx, args) => {
    // Look for any active/pending trade involving this user
    const trades = await ctx.db
      .query("trades")
      .withIndex("by_teamId", (q) => q.eq("teamId", args.teamId))
      .filter((q) =>
        q.or(
          q.eq(q.field("initiatorId"), args.clerkId),
          q.eq(q.field("receiverId"), args.clerkId)
        )
      )
      .collect();

    return trades.find(t => t.status === "pending" || t.status === "active") || null;
  }
});

export const initiateTrade = mutation({
  args: {
    teamId: v.id("teams"),
    initiatorId: v.string(),
    receiverId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if either is already in a trade
    const existing = await ctx.db
      .query("trades")
      .withIndex("by_teamId", (q) => q.eq("teamId", args.teamId))
      .filter((q) => q.or(q.eq(q.field("status"), "pending"), q.eq(q.field("status"), "active")))
      .collect();

    const inTrade = existing.find(
      t => t.initiatorId === args.initiatorId || t.receiverId === args.initiatorId ||
           t.initiatorId === args.receiverId || t.receiverId === args.receiverId
    );

    if (inTrade) {
      throw new Error("One of the users is already in an active trade session.");
    }

    return await ctx.db.insert("trades", {
      teamId: args.teamId,
      initiatorId: args.initiatorId,
      receiverId: args.receiverId,
      status: "active",
      initiatorItems: [],
      receiverItems: [],
      initiatorAccepted: false,
      receiverAccepted: false,
      createdAt: Date.now(),
    });
  }
});

export const updateTradeItems = mutation({
  args: {
    tradeId: v.id("trades"),
    clerkId: v.string(),
    items: v.array(v.any()), // Replaces current items
  },
  handler: async (ctx, args) => {
    const trade = await ctx.db.get(args.tradeId);
    if (!trade) throw new Error("Trade not found");

    if (trade.initiatorId === args.clerkId) {
      await ctx.db.patch(args.tradeId, { 
        initiatorItems: args.items, 
        initiatorAccepted: false, 
        receiverAccepted: false // Changing items un-accepts both
      });
    } else if (trade.receiverId === args.clerkId) {
      await ctx.db.patch(args.tradeId, { 
        receiverItems: args.items,
        initiatorAccepted: false, 
        receiverAccepted: false 
      });
    }
  }
});

export const toggleAccept = mutation({
  args: {
    tradeId: v.id("trades"),
    clerkId: v.string(),
    accepted: v.boolean(),
  },
  handler: async (ctx, args) => {
    const trade = await ctx.db.get(args.tradeId);
    if (!trade) throw new Error("Trade not found");

    const patch: any = {};
    if (trade.initiatorId === args.clerkId) {
      patch.initiatorAccepted = args.accepted;
    } else if (trade.receiverId === args.clerkId) {
      patch.receiverAccepted = args.accepted;
    }

    await ctx.db.patch(args.tradeId, patch);

    // Re-fetch to check if both accepted
    const updated = await ctx.db.get(args.tradeId);
    if (updated?.initiatorAccepted && updated?.receiverAccepted) {
      // Execute the trade (Transfer ownership of files in `files` table if real items were passed)
      // For this spec, we just complete it.
      await ctx.db.patch(args.tradeId, { status: "completed" });
    }
  }
});

export const cancelTrade = mutation({
  args: {
    tradeId: v.id("trades"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.tradeId, { status: "cancelled" });
  }
});
