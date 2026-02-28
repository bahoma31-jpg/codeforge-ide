import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import {
  refreshFileTree,
  refreshOpenFile,
  closeDeletedFileTab,
  expandParentFolder,
  sendNotification,
  refreshGitState,
  openFileInEditor,
} from '../store-bridge';
import { logger } from '@/lib/monitoring/error-logger';

// Mock logger
vi.mock('@/lib/monitoring/error-logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock FilesStore
const mockLoadFileTree = vi.fn();
const mockExpandFolder = vi.fn();
const mockSetActiveFile = vi.fn();

vi.mock('@/lib/stores/files-store', () => ({
  useFilesStore: {
    getState: vi.fn(() => ({
      loadFileTree: mockLoadFileTree,
      expandFolder: mockExpandFolder,
      setActiveFile: mockSetActiveFile,
    })),
  },
}));

// Mock EditorStore
const mockUpdateTabContent = vi.fn();
const mockCloseTab = vi.fn();

vi.mock('@/lib/stores/editor-store', () => ({
  useEditorStore: {
    getState: vi.fn(() => ({
      tabs: [
        { id: 'tab-1', filePath: '/src/app.ts' },
        { id: 'tab-2', filePath: '/src/utils.ts' },
      ],
      updateTabContent: mockUpdateTabContent,
      closeTab: mockCloseTab,
    })),
  },
}));

// Mock NotificationStore
const mockAddNotification = vi.fn();
vi.mock('@/lib/stores/notification-store', () => ({
  useNotificationStore: {
    getState: vi.fn(() => ({
      addNotification: mockAddNotification,
    })),
  },
}));

// Mock GitStore
const mockRefreshGit = vi.fn();
vi.mock('@/lib/stores/git-store', () => ({
  useGitStore: {
    getState: vi.fn(() => ({
      refresh: mockRefreshGit,
    })),
  },
}));

describe('Store Bridge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('refreshFileTree', () => {
    it('should call loadFileTree successfully (Happy Path)', async () => {
      await refreshFileTree();
      expect(mockLoadFileTree).toHaveBeenCalled();
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should log an Arabic error if loadFileTree fails (Error Handling)', async () => {
      mockLoadFileTree.mockImplementationOnce(() => {
        throw new Error('Tree error');
      });
      await refreshFileTree();
      expect(logger.error).toHaveBeenCalledWith(
        '[StoreBridge] فشل تحديث شجرة الملفات',
        expect.any(Error),
        { source: 'refreshFileTree' }
      );
    });
  });

  describe('refreshOpenFile', () => {
    it('should update tab content if tab exists (Happy Path)', async () => {
      await refreshOpenFile('/src/app.ts', 'new code');
      expect(mockUpdateTabContent).toHaveBeenCalledWith('tab-1', 'new code');
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully and log in Arabic (Error Handling)', async () => {
      mockUpdateTabContent.mockImplementationOnce(() => {
        throw new Error('Update error');
      });
      await refreshOpenFile('/src/app.ts', 'error code');
      expect(logger.error).toHaveBeenCalledWith(
        '[StoreBridge] فشل تحديث الملف المفتوح',
        expect.any(Error),
        { source: 'refreshOpenFile' }
      );
    });
  });

  describe('closeDeletedFileTab', () => {
    it('should close tab if it exists (Happy Path)', async () => {
      await closeDeletedFileTab('/src/utils.ts');
      expect(mockCloseTab).toHaveBeenCalledWith('tab-2');
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should log an Arabic error if it fails (Error Handling)', async () => {
      mockCloseTab.mockImplementationOnce(() => {
        throw new Error('Close error');
      });
      await closeDeletedFileTab('/src/app.ts');
      expect(logger.error).toHaveBeenCalledWith(
        '[StoreBridge] فشل إغلاق تبويبة الملف المحذوف',
        expect.any(Error),
        { source: 'closeDeletedFileTab' }
      );
    });
  });

  describe('expandParentFolder', () => {
    it('should expand folder if parentId is provided (Happy Path)', async () => {
      await expandParentFolder('folder-1');
      expect(mockExpandFolder).toHaveBeenCalledWith('folder-1');
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should do nothing if parentId is null', async () => {
      await expandParentFolder(null);
      expect(mockExpandFolder).not.toHaveBeenCalled();
    });

    it('should log an Arabic error on failure (Error Handling)', async () => {
      mockExpandFolder.mockImplementationOnce(() => {
        throw new Error('Expand error');
      });
      await expandParentFolder('folder-err');
      expect(logger.error).toHaveBeenCalledWith(
        '[StoreBridge] فشل توسيع المجلد الأب',
        expect.any(Error),
        { source: 'expandParentFolder' }
      );
    });
  });

  describe('sendNotification', () => {
    it('should send a notification (Happy Path)', async () => {
      await sendNotification('Test message', 'success');
      expect(mockAddNotification).toHaveBeenCalledWith({
        title: 'Success',
        message: 'Test message',
        type: 'success',
      });
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('should log a warning in Arabic if store is unavailable (Error Handling)', async () => {
      mockAddNotification.mockImplementationOnce(() => {
        throw new Error('Notify error');
      });
      await sendNotification('Test', 'info');
      expect(logger.warn).toHaveBeenCalledWith(
        '[StoreBridge] مخزن الإشعارات غير متوفر:',
        expect.any(Error),
        { source: 'sendNotification' }
      );
    });
  });

  describe('refreshGitState', () => {
    it('should refresh git state (Happy Path)', async () => {
      await refreshGitState();
      expect(mockRefreshGit).toHaveBeenCalled();
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should log an Arabic error on failure (Error Handling)', async () => {
      mockRefreshGit.mockImplementationOnce(() => {
        throw new Error('Git error');
      });
      await refreshGitState();
      expect(logger.error).toHaveBeenCalledWith(
        '[StoreBridge] فشل تحديث حالة Git',
        expect.any(Error),
        { source: 'refreshGitState' }
      );
    });
  });

  describe('openFileInEditor', () => {
    it('should set active file (Happy Path)', async () => {
      await openFileInEditor('file-123');
      expect(mockSetActiveFile).toHaveBeenCalledWith('file-123');
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should log an Arabic error on failure (Error Handling)', async () => {
      mockSetActiveFile.mockImplementationOnce(() => {
        throw new Error('Open error');
      });
      await openFileInEditor('file-err');
      expect(logger.error).toHaveBeenCalledWith(
        '[StoreBridge] فشل فتح الملف في المحرر',
        expect.any(Error),
        { source: 'openFileInEditor' }
      );
    });
  });
});
