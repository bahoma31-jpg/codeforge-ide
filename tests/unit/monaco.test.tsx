import { describe, it, expect, vi } from "vitest";
import { detectLanguage, supportedLanguages } from "@/lib/monaco/monaco-config";
import { getOrCreateModel, disposeModel, clearAllModels } from "@/lib/monaco/model-cache";

describe("Monaco Config", () => {
  it("detects language from file extension", () => {
    expect(detectLanguage("test.ts")).toBe("typescript");
    expect(detectLanguage("test.js")).toBe("javascript");
    expect(detectLanguage("index.html")).toBe("html");
    expect(detectLanguage("styles.css")).toBe("css");
    expect(detectLanguage("data.json")).toBe("json");
    expect(detectLanguage("README.md")).toBe("markdown");
    expect(detectLanguage("unknown.xyz")).toBe("plaintext");
  });

  it("supports 10+ languages", () => {
    expect(supportedLanguages.length).toBeGreaterThanOrEqual(10);
  });
});

describe("Monaco Model Cache", () => {
  it("creates and retrieves models", () => {
    const mockMonaco = {
      editor: {
        createModel: vi.fn(() => ({
          getValue: () => 'const x = 1;',
          setValue: vi.fn(),
          dispose: vi.fn(),
        })),
      },
      Uri: {
        file: vi.fn((path: string) => path),
      },
    };

    const model = getOrCreateModel(
      mockMonaco as any,
      "test.ts",
      'const x = 1;',
      "typescript"
    );
    expect(model).toBeDefined();
    expect(mockMonaco.editor.createModel).toHaveBeenCalledWith(
      'const x = 1;',
      "typescript",
      "test.ts"
    );
  });
});

describe("Mock Data", () => {
  it("provides 3 sample tabs", async () => {
    const { mockTabs } = await import("@/lib/utils/mock-files");
    expect(mockTabs).toHaveLength(3);
    expect(mockTabs[0].language).toBe("typescript");
    expect(mockTabs[2].language).toBe("markdown");
  });
});
