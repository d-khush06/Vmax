import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: { 
    name: v.string(),
    clerkId: v.optional(v.string()),
    clerkName: v.optional(v.string()),
    clerkEmail: v.optional(v.string()),
    clerkAvatar: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    
    const subject = identity?.subject || args.clerkId;
    if (!subject) throw new Error("Unauthenticated: No JWT or clerkId provided");

    // Check if user exists, if not create them
    let user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", subject))
      .first();

    if (!user) {
      const userId = await ctx.db.insert("users", {
        tokenIdentifier: subject,
        name: identity?.name || args.clerkName || "Unknown User",
        email: identity?.email || args.clerkEmail || "",
        avatarUrl: identity?.pictureUrl || args.clerkAvatar || "",
      });
      user = await ctx.db.get(userId);
    }

    // Generate random code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let joinCode = 'VMAX-';
    for (let i = 0; i < 5; i++) {
      joinCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const teamId = await ctx.db.insert("teams", {
      name: args.name,
      joinCode,
      createdBy: user!._id,
    });

    await ctx.db.insert("teamMembers", {
      teamId,
      userId: user!._id,
      role: "owner",
    });

    return { teamId, joinCode };
  },
});

export const join = mutation({
  args: { 
    joinCode: v.string(),
    clerkId: v.optional(v.string()),
    clerkName: v.optional(v.string()),
    clerkEmail: v.optional(v.string()),
    clerkAvatar: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    
    const subject = identity?.subject || args.clerkId;
    if (!subject) throw new Error("Unauthenticated: No JWT or clerkId provided");

    let user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", subject))
      .first();

    if (!user) {
      const userId = await ctx.db.insert("users", {
        tokenIdentifier: subject,
        name: identity?.name || args.clerkName || "Unknown User",
        email: identity?.email || args.clerkEmail || "",
        avatarUrl: identity?.pictureUrl || args.clerkAvatar || "",
      });
      user = await ctx.db.get(userId);
    }

    const team = await ctx.db
      .query("teams")
      .withIndex("by_joinCode", (q) => q.eq("joinCode", args.joinCode))
      .first();

    if (!team) throw new Error("Invalid join code");

    const existingMember = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) => q.eq("teamId", team._id).eq("userId", user!._id))
      .first();

    if (existingMember) throw new Error("Already a member");

    await ctx.db.insert("teamMembers", {
      teamId: team._id,
      userId: user!._id,
      role: "member",
    });

    return team._id;
  },
});

export const getMyTeam = query({
  args: { clerkId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    
    const subject = identity?.subject || args.clerkId;
    if (!subject) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", subject))
      .first();

    if (!user) return null;

    const member = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!member) return null;

    const team = await ctx.db.get(member.teamId);
    return team;
  },
});

export const getTeammates = query({
  args: { teamId: v.optional(v.id("teams")) },
  handler: async (ctx, args) => {
    if (!args.teamId) return [];
    
    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId!))
      .collect();

    const teammates = await Promise.all(
      members.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        return {
          id: user!.tokenIdentifier, // Using clerk ID for presence matching
          full_name: user!.name,
          avatar_url: user!.avatarUrl,
          role: m.role
        };
      })
    );

    return teammates;
  }
});

export const getMyTeams = query({
  args: { clerkId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    
    const subject = identity?.subject || args.clerkId;
    if (!subject) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", subject))
      .first();

    if (!user) return [];

    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    if (members.length === 0) return [];

    const teams = await Promise.all(
      members.map(async (m) => await ctx.db.get(m.teamId))
    );
    
    return teams.filter(t => t !== null);
  },
});

export const leaveTeam = mutation({
  args: { 
    teamId: v.id("teams"),
    clerkId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const subject = identity?.subject || args.clerkId;
    if (!subject) throw new Error("Unauthenticated: No JWT or clerkId provided");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", subject))
      .first();

    if (!user) throw new Error("User not found");

    const member = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) => q.eq("teamId", args.teamId).eq("userId", user._id))
      .first();

    if (!member) throw new Error("Not a member of this team");

    // Remove the user from the team
    await ctx.db.delete(member._id);

    // Optional: If they were the last member, we could delete the team and its data
    // But for simplicity, we just let them leave.
    const remainingMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    if (remainingMembers.length === 0) {
      await ctx.db.delete(args.teamId);
    }
    
    return true;
  }
});
