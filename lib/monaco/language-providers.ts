/**
 * CodeForge IDE — Monaco Language Providers
 * Configures TypeScript, HTML, CSS, JSON IntelliSense.
 *
 * IMPORTANT: All functions receive the monaco instance from onMount.
 * Do NOT import 'monaco-editor' directly — it creates a separate
 * instance without workers, breaking the editor.
 */

type Monaco = typeof import('monaco-editor');

// TypeScript/JavaScript IntelliSense
export function configureTypeScriptDefaults(monaco: Monaco) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tsLang = (monaco.languages as any).typescript as any;

  tsLang.typescriptDefaults.setCompilerOptions({
    target: tsLang.ScriptTarget.ES2020,
    allowNonTsExtensions: true,
    moduleResolution: tsLang.ModuleResolutionKind.NodeJs,
    module: tsLang.ModuleKind.ES2015,
    noEmit: true,
    esModuleInterop: true,
    jsx: tsLang.JsxEmit.React,
    reactNamespace: 'React',
    allowJs: true,
    typeRoots: ['node_modules/@types'],
  });

  tsLang.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
  });

  // JavaScript
  tsLang.javascriptDefaults.setCompilerOptions({
    target: tsLang.ScriptTarget.ES2020,
    allowNonTsExtensions: true,
    allowJs: true,
  });

  tsLang.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
  });
}

// HTML IntelliSense
export function configureHTMLDefaults(monaco: Monaco) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const htmlLang = (monaco.languages as any).html as any;

  htmlLang.htmlDefaults.setOptions({
    format: {
      tabSize: 2,
      insertSpaces: true,
      wrapLineLength: 120,
      unformatted: 'wbr',
      contentUnformatted: 'pre,code,textarea',
      indentInnerHtml: false,
      preserveNewLines: true,
      maxPreserveNewLines: null,
      indentHandlebars: false,
      endWithNewline: false,
      extraLiners: 'head, body, /html',
      wrapAttributes: 'auto',
    },
    suggest: { html5: true, angular1: false, ionic: false },
  });
}

// CSS IntelliSense
export function configureCSSDefaults(monaco: Monaco) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cssLang = (monaco.languages as any).css as any;

  cssLang.cssDefaults.setOptions({
    validate: true,
    lint: {
      compatibleVendorPrefixes: 'warning',
      vendorPrefix: 'warning',
      duplicateProperties: 'warning',
      emptyRules: 'warning',
      importStatement: 'ignore',
      boxModel: 'ignore',
      universalSelector: 'ignore',
      zeroUnits: 'ignore',
      fontFaceProperties: 'warning',
      hexColorLength: 'error',
      argumentsInColorFunction: 'error',
      unknownProperties: 'warning',
      ieHack: 'ignore',
      unknownVendorSpecificProperties: 'ignore',
      propertyIgnoredDueToDisplay: 'warning',
      important: 'ignore',
      float: 'ignore',
      idSelector: 'ignore',
    },
  });
}

// JSON Schema Validation
export function configureJSONDefaults(monaco: Monaco) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const jsonLang = (monaco.languages as any).json as any;

  jsonLang.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    allowComments: true,
    schemas: [
      {
        uri: 'http://myserver/package-schema.json',
        fileMatch: ['package.json'],
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Package name' },
            version: { type: 'string', description: 'Version number' },
            dependencies: { type: 'object' },
            devDependencies: { type: 'object' },
          },
        },
      },
    ],
  });
}

// Extra Libraries (Type Definitions)
export function addExtraLibraries(monaco: Monaco) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tsLang = (monaco.languages as any).typescript as any;

  const reactTypes = `
    declare module "react" {
      export function useState<T>(initialState: T): [T, (newState: T) => void];
      export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
    }
  `;
  tsLang.typescriptDefaults.addExtraLib(
    reactTypes,
    'file:///node_modules/@types/react/index.d.ts'
  );
}

// Custom Snippets
export function registerCustomSnippets(monaco: Monaco) {
  monaco.languages.registerCompletionItemProvider('typescript', {
    provideCompletionItems: () => {
      const suggestions = [
        {
          label: 'rfc',
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
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'React Functional Component',
        },
      ];
      return { suggestions: suggestions as import('monaco-editor').languages.CompletionItem[] };
    },
  });
}
