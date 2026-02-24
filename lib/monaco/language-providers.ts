import * as monaco from "monaco-editor";

// TypeScript/JavaScript IntelliSense
export function configureTypeScriptDefaults() {
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ES2020,
    allowNonTsExtensions: true,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    module: monaco.languages.typescript.ModuleKind.ES2015,
    noEmit: true,
    esModuleInterop: true,
    jsx: monaco.languages.typescript.JsxEmit.React,
    reactNamespace: "React",
    allowJs: true,
    typeRoots: ["node_modules/@types"],
  });

  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
  });

  // JavaScript
  monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ES2020,
    allowNonTsExtensions: true,
    allowJs: true,
  });

  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
  });
}

// HTML IntelliSense
export function configureHTMLDefaults() {
  monaco.languages.html.htmlDefaults.setOptions({
    format: {
      tabSize: 2,
      insertSpaces: true,
      wrapLineLength: 120,
      unformatted: "wbr",
      contentUnformatted: "pre,code,textarea",
      indentInnerHtml: false,
      preserveNewLines: true,
      maxPreserveNewLines: null,
      indentHandlebars: false,
      endWithNewline: false,
      extraLiners: "head, body, /html",
      wrapAttributes: "auto",
    },
    suggest: { html5: true, angular1: false, ionic: false },
  });
}

// CSS IntelliSense
export function configureCSSDefaults() {
  monaco.languages.css.cssDefaults.setOptions({
    validate: true,
    lint: {
      compatibleVendorPrefixes: "warning",
      vendorPrefix: "warning",
      duplicateProperties: "warning",
      emptyRules: "warning",
      importStatement: "ignore",
      boxModel: "ignore",
      universalSelector: "ignore",
      zeroUnits: "ignore",
      fontFaceProperties: "warning",
      hexColorLength: "error",
      argumentsInColorFunction: "error",
      unknownProperties: "warning",
      ieHack: "ignore",
      unknownVendorSpecificProperties: "ignore",
      propertyIgnoredDueToDisplay: "warning",
      important: "ignore",
      float: "ignore",
      idSelector: "ignore",
    },
  });
}

// JSON Schema Validation
export function configureJSONDefaults() {
  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    allowComments: true,
    schemas: [
      {
        uri: "http://myserver/package-schema.json",
        fileMatch: ["package.json"],
        schema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Package name" },
            version: { type: "string", description: "Version number" },
            dependencies: { type: "object" },
            devDependencies: { type: "object" },
          },
        },
      },
    ],
  });
}

// Extra Libraries (Type Definitions)
export function addExtraLibraries() {
  const reactTypes = `
    declare module "react" {
      export function useState<T>(initialState: T): [T, (newState: T) => void];
      export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
    }
  `;
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    reactTypes,
    "file:///node_modules/@types/react/index.d.ts"
  );
}

// Custom Snippets
export function registerCustomSnippets() {
  monaco.languages.registerCompletionItemProvider("typescript", {
    provideCompletionItems: () => {
      const suggestions: monaco.languages.CompletionItem[] = [
        {
          label: "rfc",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: [
            'export default function ${1:ComponentName}() {',
            '  return (',
            '    <div>',
            '      $0',
            '    </div>',
            '  );',
            '}',
          ].join('\n'),
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "React Functional Component",
        },
      ];
      return { suggestions };
    },
  });
}
