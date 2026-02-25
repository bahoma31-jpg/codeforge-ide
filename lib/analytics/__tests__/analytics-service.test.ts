import { describe, it, expect, beforeEach } from 'vitest';
import { AnalyticsService } from '../analytics-service';
import type { AnalyticsCategory } from '../analytics-service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    AnalyticsService.resetInstance();
    service = AnalyticsService.getInstance();
  });

  it('should return a singleton instance', () => {
    const a = AnalyticsService.getInstance();
    const b = AnalyticsService.getInstance();
    expect(a).toBe(b);
  });

  it('should create a new instance after reset', () => {
    const a = AnalyticsService.getInstance();
    AnalyticsService.resetInstance();
    const b = AnalyticsService.getInstance();
    expect(a).not.toBe(b);
  });

  it('should track an event', () => {
    service.track({ category: 'editor', action: 'file_opened' });
    const events = service.getEvents();
    expect(events).toHaveLength(1);
    expect(events[0].category).toBe('editor');
    expect(events[0].action).toBe('file_opened');
  });

  it('should set timestamp automatically', () => {
    const before = Date.now();
    service.track({ category: 'editor', action: 'test' });
    const events = service.getEvents();
    expect(events[0].timestamp).toBeGreaterThanOrEqual(before);
  });

  it('should track event with label and value', () => {
    service.track({
      category: 'terminal',
      action: 'command_run',
      label: 'npm install',
      value: 1500,
    });

    const events = service.getEvents();
    expect(events[0].label).toBe('npm install');
    expect(events[0].value).toBe(1500);
  });

  it('should filter events by category', () => {
    service.track({ category: 'editor', action: 'open' });
    service.track({ category: 'terminal', action: 'run' });
    service.track({ category: 'editor', action: 'save' });

    const editorEvents = service.getEvents('editor');
    expect(editorEvents).toHaveLength(2);
    expect(editorEvents.every((e) => e.category === 'editor')).toBe(true);
  });

  it('should return all events when no category filter', () => {
    service.track({ category: 'editor', action: 'a' });
    service.track({ category: 'terminal', action: 'b' });

    expect(service.getEvents()).toHaveLength(2);
  });

  it('should return correct stats', () => {
    service.track({ category: 'editor', action: 'file_opened' });
    service.track({ category: 'editor', action: 'file_saved' });
    service.track({ category: 'terminal', action: 'command_run' });

    const stats = service.getStats();
    expect(stats.totalEvents).toBe(3);
    expect(stats.byCategory['editor']).toBe(2);
    expect(stats.byCategory['terminal']).toBe(1);
    expect(stats.byAction['file_opened']).toBe(1);
    expect(stats.byAction['command_run']).toBe(1);
  });

  it('should include first and last event timestamps in stats', () => {
    service.track({ category: 'editor', action: 'first' });
    service.track({ category: 'editor', action: 'last' });

    const stats = service.getStats();
    expect(stats.firstEvent).toBeDefined();
    expect(stats.lastEvent).toBeDefined();
    expect(stats.lastEvent!).toBeGreaterThanOrEqual(stats.firstEvent!);
  });

  it('should export events as JSON string', () => {
    service.track({ category: 'git', action: 'commit_created' });
    const json = service.exportEvents();
    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].action).toBe('commit_created');
  });

  it('should clear all events', () => {
    service.track({ category: 'editor', action: 'a' });
    service.track({ category: 'editor', action: 'b' });
    service.clearEvents();

    expect(service.getEvents()).toHaveLength(0);
    expect(service.getStats().totalEvents).toBe(0);
  });

  it('should enforce MAX_EVENTS limit (1000)', () => {
    for (let i = 0; i < 1050; i++) {
      service.track({ category: 'editor', action: `event_${i}` });
    }

    const events = service.getEvents();
    expect(events.length).toBeLessThanOrEqual(1000);
  });

  it('should keep most recent events when exceeding limit', () => {
    for (let i = 0; i < 1010; i++) {
      service.track({ category: 'editor', action: `event_${i}` });
    }

    const events = service.getEvents();
    // Last event should be the most recent
    expect(events[events.length - 1].action).toBe('event_1009');
  });

  it('should handle empty stats gracefully', () => {
    const stats = service.getStats();
    expect(stats.totalEvents).toBe(0);
    expect(stats.firstEvent).toBeUndefined();
    expect(stats.lastEvent).toBeUndefined();
  });

  it('should return a copy of events (immutable)', () => {
    service.track({ category: 'editor', action: 'test' });
    const events1 = service.getEvents();
    const events2 = service.getEvents();
    expect(events1).not.toBe(events2);
    expect(events1).toEqual(events2);
  });
});
