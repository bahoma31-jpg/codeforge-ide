/**
 * CodeForge IDE — OODA Tools
 * New tools that expose the OODA Controller to the agent.
 * These allow the agent to start, monitor, and manage self-improvement tasks.
 *
 * Phase 2: OODA Loop Implementation.
 */

import type { ToolDefinition, ToolCallResult } from '../types';
import { getOODAController, type OODAEvent } from './ooda-controller';
import { getLearningMemory } from './learning-memory';
import type { ToolBridge } from './fix-executor';
import type { IssueCategory, SelfImprovementTask } from './types';

// ─── Tool Definitions ─────────────────────────────────────────

export const oodaToolDefinitions: ToolDefinition[] = [
  {
    name: 'self_start_improvement',
    description:
      'Start a self-improvement task using the OODA loop. ' +
      'The agent will automatically: Observe (gather evidence), Orient (analyze root cause), ' +
      'Decide (create fix plan), Act (execute changes), and Verify (validate results). ' +
      'Use this when the user reports a bug, UI issue, or requests an improvement to the CodeForge IDE itself.',
    category: 'self-improve',
    parameters: {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          description: 'Detailed description of the issue or improvement request',
        },
        category: {
          type: 'string',
          enum: ['ui_bug', 'logic_error', 'performance', 'style', 'accessibility', 'feature_enhancement'],
          description: 'Category of the issue (optional — auto-detected if not provided)',
        },
        trigger: {
          type: 'string',
          enum: ['user_report', 'self_detected'],
          description: 'What triggered this improvement (default: user_report)',
        },
      },
      required: ['description'],
    },
  },
  {
    name: 'self_get_task_status',
    description:
      'Get the status and details of a self-improvement task. ' +
      'Shows the current OODA phase, progress, changes made, and verification results.',
    category: 'self-improve',
    parameters: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'The ID of the task to check. If not provided, returns all active tasks.',
        },
      },
      required: [],
    },
  },
  {
    name: 'self_cancel_task',
    description:
      'Cancel an active self-improvement task. Use this if the task is taking too long or going in the wrong direction.',
    category: 'self-improve',
    parameters: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'The ID of the task to cancel',
        },
      },
      required: ['taskId'],
    },
  },
  {
    name: 'self_get_suggestions',
    description:
      'Get fix suggestions from learning memory based on a problem description. ' +
      'Returns previously successful fix patterns that match the described issue.',
    category: 'self-improve',
    parameters: {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          description: 'Description of the problem to find suggestions for',
        },
        category: {
          type: 'string',
          enum: ['ui_bug', 'logic_error', 'performance', 'style', 'accessibility', 'feature_enhancement'],
          description: 'Filter suggestions by category (optional)',
        },
      },
      required: ['description'],
    },
  },
  {
    name: 'self_get_stats',
    description:
      'Get statistics about self-improvement activity. ' +
      'Shows total tasks, success rate, most modified files, and common issue categories.',
    category: 'self-improve',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
];

// ─── Tool Executors ───────────────────────────────────────────

/**
 * Create OODA tool executors.
 * Requires a ToolBridge and a function to get all project files.
 */
export function createOODAToolExecutors(
  toolBridge: ToolBridge,
  getAllFiles: () => Promise<Map<string, string>>
): Record<string, (args: Record<string, unknown>) => Promise<ToolCallResult>> {
  const controller = getOODAController(toolBridge);
  const memory = getLearningMemory();

  // Collect events for status reporting
  const eventLog: Map<string, OODAEvent[]> = new Map();
  controller.onEvent((event) => {
    const events = eventLog.get(event.taskId) || [];
    events.push(event);
    eventLog.set(event.taskId, events);
  });

  return {
    // ─── self_start_improvement ───────────────────────────
    self_start_improvement: async (args): Promise<ToolCallResult> => {
      const description = args.description as string;
      const category = args.category as IssueCategory | undefined;
      const trigger = (args.trigger as 'user_report' | 'self_detected') || 'user_report';

      if (!description) {
        return { success: false, error: 'Description is required' };
      }

      try {
        // Check for similar past patterns
        const suggestions = memory.findSimilar(description, 3);

        // Get all project files
        const allFiles = await getAllFiles();

        // Start the OODA loop
        const task = await controller.startImprovement(
          trigger,
          description,
          allFiles,
          { category }
        );

        // Record result in learning memory
        if (task.status === 'completed') {
          memory.recordSuccess(task);
        } else if (task.status === 'failed') {
          memory.recordFailure(task);
        }

        return {
          success: task.status === 'completed',
          data: formatTaskResult(task, suggestions, eventLog.get(task.id)),
        };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    },

    // ─── self_get_task_status ─────────────────────────────
    self_get_task_status: async (args): Promise<ToolCallResult> => {
      const taskId = args.taskId as string | undefined;

      if (taskId) {
        const task = controller.getTask(taskId);
        if (!task) {
          return { success: false, error: `Task not found: ${taskId}` };
        }
        return {
          success: true,
          data: formatTaskStatus(task, eventLog.get(taskId)),
        };
      }

      // Return all active tasks
      const activeTasks = controller.getActiveTasks();
      const history = controller.getHistory().slice(-5);

      return {
        success: true,
        data: {
          activeTasks: activeTasks.map(t => formatTaskBrief(t)),
          recentHistory: history.map(t => formatTaskBrief(t)),
        },
      };
    },

    // ─── self_cancel_task ─────────────────────────────────
    self_cancel_task: async (args): Promise<ToolCallResult> => {
      const taskId = args.taskId as string;
      if (!taskId) {
        return { success: false, error: 'taskId is required' };
      }

      const cancelled = controller.cancelTask(taskId);
      return {
        success: cancelled,
        data: cancelled
          ? { message: `Task ${taskId} cancelled` }
          : { message: `Task ${taskId} not found or already completed` },
      };
    },

    // ─── self_get_suggestions ─────────────────────────────
    self_get_suggestions: async (args): Promise<ToolCallResult> => {
      const description = args.description as string;
      const category = args.category as IssueCategory | undefined;

      if (!description) {
        return { success: false, error: 'Description is required' };
      }

      let results;
      if (category) {
        const categoryPatterns = memory.findByCategory(category);
        results = categoryPatterns.map(p => ({
          pattern: p,
          similarity: 0.5, // Category match but no keyword comparison
        }));
      } else {
        results = memory.findSimilar(description, 10);
      }

      return {
        success: true,
        data: {
          suggestions: results.map(r => ({
            id: r.pattern.id,
            category: r.pattern.category,
            problem: r.pattern.problemSignature,
            solution: r.pattern.solution,
            files: r.pattern.filesInvolved,
            successRate: `${Math.round(r.pattern.successRate * 100)}%`,
            timesUsed: r.pattern.timesUsed,
            similarity: `${Math.round(r.similarity * 100)}%`,
          })),
          totalPatterns: memory.getAllPatterns().length,
        },
      };
    },

    // ─── self_get_stats ───────────────────────────────────
    self_get_stats: async (): Promise<ToolCallResult> => {
      const stats = memory.getStats();
      const activeTasks = controller.getActiveTasks();
      const history = controller.getHistory();

      return {
        success: true,
        data: {
          ...stats,
          activeTasksCount: activeTasks.length,
          historyCount: history.length,
          patternsStored: memory.getAllPatterns().length,
        },
      };
    },
  };
}

// ─── Formatting Helpers ───────────────────────────────────────

function formatTaskResult(
  task: SelfImprovementTask,
  suggestions: Array<{ pattern: { problemSignature: string; solution: string }; similarity: number }>,
  events?: OODAEvent[]
): Record<string, unknown> {
  return {
    taskId: task.id,
    status: task.status,
    category: task.category,
    description: task.description,
    observation: {
      affectedArea: task.observation.affectedArea,
      filesFound: task.observation.detectedFiles.length,
      evidence: task.observation.evidence.slice(0, 5),
    },
    orientation: {
      rootCause: task.orientation.rootCause,
      scope: task.orientation.scope.length,
      skills: task.orientation.skills,
    },
    decision: {
      planSteps: task.decision.plan.length,
      riskLevel: task.decision.riskLevel,
      requiresApproval: task.decision.requiresApproval,
    },
    execution: {
      changesCount: task.execution.changes.length,
      iterations: task.execution.iterations,
      verified: task.execution.verificationResult?.passed ?? null,
      errors: task.execution.errors,
    },
    pastSuggestions: suggestions.map(s => ({
      problem: s.pattern.problemSignature.substring(0, 80),
      solution: s.pattern.solution.substring(0, 80),
      similarity: `${Math.round(s.similarity * 100)}%`,
    })),
    timeline: events?.map(e => ({
      phase: e.phase,
      status: e.status,
      message: e.message,
      time: new Date(e.timestamp).toISOString(),
    })),
  };
}

function formatTaskStatus(
  task: SelfImprovementTask,
  events?: OODAEvent[]
): Record<string, unknown> {
  return {
    taskId: task.id,
    status: task.status,
    category: task.category,
    createdAt: new Date(task.createdAt).toISOString(),
    updatedAt: new Date(task.updatedAt).toISOString(),
    currentPhase: task.status,
    observation: task.observation,
    orientation: {
      rootCause: task.orientation.rootCause,
      scope: task.orientation.scope,
      skills: task.orientation.skills,
    },
    decision: task.decision,
    execution: {
      status: task.execution.status,
      changesCount: task.execution.changes.length,
      changes: task.execution.changes.map(c => ({
        file: c.filePath,
        type: c.changeType,
      })),
      iterations: `${task.execution.iterations}/${task.execution.maxIterations}`,
      verification: task.execution.verificationResult,
      errors: task.execution.errors,
    },
    timeline: events?.map(e => ({
      phase: e.phase,
      status: e.status,
      message: e.message,
    })),
  };
}

function formatTaskBrief(task: SelfImprovementTask): Record<string, unknown> {
  return {
    id: task.id,
    status: task.status,
    category: task.category,
    description: task.description.substring(0, 80),
    changes: task.execution.changes.length,
    iterations: task.execution.iterations,
  };
}
