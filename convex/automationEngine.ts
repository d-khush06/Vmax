import { internalMutation, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const executeTrigger = internalMutation({
  args: {
    teamId: v.id("teams"),
    triggerType: v.string(), // e.g., 'task_created', 'task_moved'
    payload: v.any(), // Context of the trigger
  },
  handler: async (ctx, args) => {
    // Find all enabled automations for this team
    const automations = await ctx.db
      .query("automations")
      .withIndex("by_teamId", (q) => q.eq("teamId", args.teamId))
      .filter((q) => q.eq(q.field("enabled"), true))
      .collect();

    for (const automation of automations) {
      // Find lever nodes (triggers) that match this triggerType
      const triggers = automation.nodes.filter(
        (n) => n.type === "lever" && n.config?.event === args.triggerType
      );

      if (triggers.length === 0) continue;

      // We have a matching trigger. We need to evaluate the graph.
      // For a simple DAG, we trace from triggers through wires to pistons (actions)
      
      const actionsToRun: any[] = [];
      const visited = new Set<string>();

      const traverse = (nodeId: string) => {
        if (visited.has(nodeId)) return;
        visited.add(nodeId);

        const node = automation.nodes.find((n) => n.id === nodeId);
        if (!node) return;

        if (node.type === "piston") {
          actionsToRun.push(node);
        } else if (node.type === "wire" || node.type === "lever") {
          // Check conditions for wires (e.g. AND/OR logic)
          // Simplified for now: just pass the signal along
          const outgoingEdges = automation.edges.filter((e) => e.source === nodeId);
          for (const edge of outgoingEdges) {
            traverse(edge.target);
          }
        }
      };

      for (const trigger of triggers) {
        // check if payload matches any filter config on the lever
        if (trigger.config?.filterField && trigger.config?.filterValue) {
           if (args.payload[trigger.config.filterField] !== trigger.config.filterValue) {
             continue; // Filter didn't match
           }
        }
        
        traverse(trigger.id);
      }

      // Execute actions
      for (const actionNode of actionsToRun) {
         await ctx.scheduler.runAfter(0, internal.automationEngine.runAction, {
            teamId: args.teamId,
            actionConfig: actionNode.config,
            payload: args.payload,
            automationId: automation._id
         });
      }
    }
  },
});

export const runAction = internalMutation({
  args: {
    teamId: v.id("teams"),
    actionConfig: v.any(),
    payload: v.any(),
    automationId: v.id("automations"),
  },
  handler: async (ctx, args) => {
    // Notify clients that this automation fired (for the power pulse animation)
    // We could write to an `automation_events` table or just send a message.
    // For simplicity, we can just insert a temporary event if needed, 
    // or rely on the state changes caused by the action.
    // Actually, "A visual pulse animates through the wires when it fires live" 
    // requires a client subscription. Let's create an `automation_events` table or just skip it for now if we don't want to change schema again without asking.
    // Wait, let's just do the action first.
    
    const { actionConfig, payload, teamId } = args;

    if (actionConfig.action === 'post_message') {
      await ctx.db.insert("messages", {
        teamId,
        content: actionConfig.message || `Automated message for ${payload?.title || 'event'}`,
        // Bot/System clerkId or just left empty to indicate system message
        clerkId: "system",
      });
    } else if (actionConfig.action === 'move_card') {
      if (payload.taskId && actionConfig.newStatus) {
         await ctx.db.patch(payload.taskId, { status: actionConfig.newStatus });
      }
    }
    // other actions like assign_task, create_event etc.
  }
});
