/**
 * CodeForge IDE — Approval Manager
 * Manages pending approvals for dangerous operations.
 * Provides a queue-based system for user confirmations.
 */

import { v4 as uuidv4 } from 'uuid';
import type { PendingApproval, ToolCall, ToolDefinition, FileDiff, AuditLogEntry, ToolCallResult } from '../types';
import { classifyRisk, getRiskDescription } from './risk-classifier';

/**
 * Approval callback type
 */
type ApprovalCallback = (approved: boolean) => void;

/**
 * Approval Manager
 */
export class ApprovalManager {
  private pendingApprovals: Map<string, PendingApproval> = new Map();
  private approvalCallbacks: Map<string, ApprovalCallback> = new Map();
  private auditLog: AuditLogEntry[] = [];
  private onApprovalRequest?: (approval: PendingApproval) => void;

  /**
   * Set the callback for when an approval is requested
   */
  setApprovalRequestHandler(handler: (approval: PendingApproval) => void): void {
    this.onApprovalRequest = handler;
  }

  /**
   * Request approval for a tool call
   * Returns a promise that resolves when the user responds
   */
  async requestApproval(
    toolCall: ToolCall,
    toolDef: ToolDefinition,
    diff?: FileDiff
  ): Promise<boolean> {
    const riskLevel = classifyRisk(toolCall, toolDef);

    // Auto-approve safe operations
    if (riskLevel === 'auto') {
      this.logAction(toolCall.toolName, toolCall.args, { success: true }, 'auto');
      return true;
    }

    // Notify-level: approve but show notification
    if (riskLevel === 'notify') {
      this.logAction(toolCall.toolName, toolCall.args, { success: true }, 'auto');
      return true;
    }

    // Confirm-level: wait for user approval
    const approval: PendingApproval = {
      id: uuidv4(),
      toolCall,
      description: getRiskDescription(toolCall, riskLevel),
      riskLevel,
      affectedFiles: this.extractAffectedFiles(toolCall),
      diff,
      status: 'pending',
      createdAt: Date.now(),
    };

    this.pendingApprovals.set(approval.id, approval);

    // Notify the UI
    this.onApprovalRequest?.(approval);

    // Wait for user response
    return new Promise<boolean>((resolve) => {
      this.approvalCallbacks.set(approval.id, (approved) => {
        approval.status = approved ? 'approved' : 'rejected';
        this.pendingApprovals.delete(approval.id);
        this.approvalCallbacks.delete(approval.id);

        this.logAction(
          toolCall.toolName,
          toolCall.args,
          { success: approved, error: approved ? undefined : 'Rejected by user' },
          'user'
        );

        resolve(approved);
      });
    });
  }

  /**
   * Approve a pending approval
   */
  approve(approvalId: string): void {
    const callback = this.approvalCallbacks.get(approvalId);
    if (callback) {
      callback(true);
    }
  }

  /**
   * Reject a pending approval
   */
  reject(approvalId: string): void {
    const callback = this.approvalCallbacks.get(approvalId);
    if (callback) {
      callback(false);
    }
  }

  /**
   * Get all pending approvals
   */
  getPendingApprovals(): PendingApproval[] {
    return Array.from(this.pendingApprovals.values());
  }

  /**
   * Get audit log
   */
  getAuditLog(): AuditLogEntry[] {
    return [...this.auditLog];
  }

  /**
   * Extract affected file paths
   */
  private extractAffectedFiles(toolCall: ToolCall): string[] {
    const files: string[] = [];
    const args = toolCall.args;

    if (typeof args.path === 'string') files.push(args.path);
    if (typeof args.filePath === 'string') files.push(args.filePath);
    if (typeof args.nodeId === 'string') files.push(args.nodeId);
    if (Array.isArray(args.paths)) files.push(...(args.paths as string[]));

    return files;
  }

  /**
   * Log action to audit trail
   */
  private logAction(
    toolName: string,
    args: Record<string, unknown>,
    result: ToolCallResult,
    approvedBy: 'auto' | 'user'
  ): void {
    this.auditLog.push({
      id: uuidv4(),
      toolName,
      args,
      result,
      approvedBy,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear all pending approvals
   */
  clearPending(): void {
    // Reject all pending
    for (const [id] of this.approvalCallbacks) {
      this.reject(id);
    }
    this.pendingApprovals.clear();
    this.approvalCallbacks.clear();
  }
}
