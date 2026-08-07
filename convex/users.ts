import { query } from "./_generated/server";

export const debug = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users;
  }
});
