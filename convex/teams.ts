import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function generateJoinCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export const create = mutation({
  args: { name: v.string(), clerkId: v.string() },
  handler: async (ctx, args) => {
    const joinCode = generateJoinCode();
    const teamId = await ctx.db.insert("teams", {
      name: args.name,
      joinCode,
      createdBy: args.clerkId,
    });

    await ctx.db.insert("teamMembers", {
      teamId,
      clerkId: args.clerkId,
      role: "owner",
    });

    return { _id: teamId, joinCode };
  },
});

export const join = mutation({
  args: { joinCode: v.string(), clerkId: v.string() },
  handler: async (ctx, args) => {
    const team = await ctx.db
      .query("teams")
      .withIndex("by_joinCode", (q) => q.eq("joinCode", args.joinCode))
      .first();

    if (!team) throw new Error("Invalid join code");

    const existingMember = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) => q.eq("teamId", team._id).eq("clerkId", args.clerkId))
      .first();

    if (existingMember) return team._id;

    await ctx.db.insert("teamMembers", {
      teamId: team._id,
      clerkId: args.clerkId,
      role: "member",
    });

    return team._id;
  },
});

export const leaveTeam = mutation({
  args: { teamId: v.id("teams"), clerkId: v.string() },
  handler: async (ctx, args) => {
    const member = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) => q.eq("teamId", args.teamId).eq("clerkId", args.clerkId))
      .first();
    
    if (member) {
      await ctx.db.delete(member._id);
    }
  }
});

export const getMyTeams = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .collect();
      
    const teams = await Promise.all(
      memberships.map(async (m) => {
        return await ctx.db.get(m.teamId);
      })
    );
    return teams.filter(t => t !== null);
  }
});

export const getTeammates = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_teamId", (q) => q.eq("teamId", args.teamId))
      .collect();
      
    const users = await Promise.all(
      memberships.map(async (m) => {
        return await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", m.clerkId))
          .first();
      })
    );
    return users.filter(u => u !== null);
  }
});
