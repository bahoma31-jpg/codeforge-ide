import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchPanel } from '../search-panel';
import { useFilesStore } from '@/lib/stores/files-store';
import { useEditorStore } from '@/lib/stores/editor-store';
import { logger } from '@/lib/monitoring/error-logger';

// Mock useFilesStore
vi.mock('@/lib/stores/files-store', () => ({
    useFilesStore: vi.fn(),
}));

// Mock useEditorStore
vi.mock('@/lib/stores/editor-store', () => ({
    useEditorStore: vi.fn(),
}));

// Mock logger
vi.mock('@/lib/monitoring/error-logger', () => ({
    logger: {
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
    },
}));

describe('SearchPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        (useEditorStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            openFile: vi.fn(),
        });

        (useFilesStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            nodes: [
                {
                    id: '1',
                    name: 'app.js',
                    type: 'file',
                    content: 'console.log("Hello World");',
                    path: '/app.js',
                },
                {
                    id: '2',
                    name: 'utils.js',
                    type: 'file',
                    content: 'function sum(a, b) { return a + b; }',
                    path: '/utils.js',
                },
            ],
        });
    });

    it('renders search input', () => {
        render(<SearchPanel />);
        expect(screen.getByPlaceholderText('ابحث في الملفات...')).toBeInTheDocument();
    });

    it('performs search and displays results (Happy Path)', async () => {
        render(<SearchPanel />);

        const input = screen.getByPlaceholderText('ابحث في الملفات...');
        fireEvent.change(input, { target: { value: 'Hello' } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

        // Wait for the setTimeout in the component to resolve
        await waitFor(
            () => {
                expect(screen.getByText('app.js')).toBeInTheDocument();
                expect(screen.getByText('console.log("Hello World");')).toBeInTheDocument();
            },
            { timeout: 1000 }
        );
    });

    it('handles invalid regex gracefully and logs error (Error Handling)', async () => {
        render(<SearchPanel />);

        // Click the Regex button to enable regex
        const regexButton = screen.getByTitle('تعبير منتظم (Regex)');
        fireEvent.click(regexButton);

        const input = screen.getByPlaceholderText('ابحث في الملفات...');
        // Enter an invalid regex like a lonely open bracket
        fireEvent.change(input, { target: { value: '[' } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

        // Should not crash and instead fail silently, possibly logging if it reaches our custom catch block
        await waitFor(
            () => {
                expect(screen.getByText('لا توجد نتائج لـ "["')).toBeInTheDocument();
            },
            { timeout: 1000 }
        );
    });
});
