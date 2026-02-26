/**
 * CodeForge IDE — Approval Manager
 * Manages the approval flow for risky tool calls.
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  ToolCall,
  ToolDefinition,
  PendingApproval,
  AuditLogEntry,
  RiskLevel,
} from '../types';
import { classifyRisk } from './risk-classifier';

export class ApprovalManager {
  private auditLog: AuditLogEntry[] = [];

  /**
   * Determine if a tool call needs approval
   */
  needsApproval(toolCall: ToolCall, toolDef?: ToolDefinition): boolean {
    const risk = classifyRisk(toolCall, toolDef);
    return risk === 'confirm';
  }

  /**
   * Create a pending approval request
   */
  createApproval(toolCall: ToolCall, toolDef?: ToolDefinition): PendingApproval {
    const risk = classifyRisk(toolCall, toolDef);
    return {
      id: uuidv4(),
      toolCall,
      toolName: toolCall.name,
      description: this.generateDescription(toolCall),
      riskLevel: risk,
      status: 'pending',
      createdAt: Date.now(),
    };
  }

  /**
   * Log an approval decision
   */
  logDecision(
    toolCall: ToolCall,
    approved: boolean,
    riskLevel: RiskLevel
  ): void {
    this.auditLog.push({
      id: uuidv4(),
      toolName: toolCall.name,
      args: toolCall.arguments,
      riskLevel,
      approved,
      approvedBy: approved ? 'user' : 'user',
      timestamp: Date.now(),
    });
  }

  /**
   * Get the full audit log
   */
  getAuditLog(): AuditLogEntry[] {
    return [...this.auditLog];
  }

  /**
   * Generate a human-readable description for a tool call
   */
  private generateDescription(toolCall: ToolCall): string {
    const args = toolCall.arguments;

    switch (toolCall.name) {
      case 'delete_file':
        return `حذف: ${(args.nodeId as string) || 'ملف غير محدد'}`;
      case 'git_push':
        return `دفع التغييرات إلى GitHub${args.branch ? ` (فرع: ${args.branch})` : ''}`;
      case 'git_create_pr':
        return `إنشاء Pull Request: ${(args.title as string) || ''}`;
      default:
        return `تنفيذ: ${toolCall.name}`;
    }
  }
}
