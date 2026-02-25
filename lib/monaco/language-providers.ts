import * as monaco from 'monaco-editor';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tsLanguages = (monaco.languages as any).typescript as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const htmlLanguages = (monaco.languages as any).html as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cssLanguages = (monaco.languages as any).css as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const jsonLanguages = (monaco.languages as any).json as any;

// TypeScript/JavaScript IntelliSense
export function configureTypeScriptDefaults() {
  tsLanguages.typescriptDefaults.setCompilerOptions({
    target: tsLanguages.ScriptTarget.ES2020,
    allowNonTsExtensions: true,
    moduleResolution: tsLanguages.ModuleResolutionKind.NodeJs,
    module: tsLanguages.ModuleKind.ES2015,
    noEmit: true,
    esModuleInterop: true,
    jsx: tsLanguages.JsxEmit.React,
    reactNamespace: 'React',
    allowJs: true,
    typeRoots: ['node_modules/@types'],
  });

  tsLanguages.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
  });

  // JavaScript
  tsLanguages.javascriptDefaults.setCompilerOptions({
    target: tsLanguages.ScriptTarget.ES2020,
    allowNonTsExtensions: true,
    allowJs: true,
  });

  tsLanguages.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
  });
}

// HTML IntelliSense
export function configureHTMLDefaults() {
  htmlLanguages.htmlDefaults.setOptions({
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
export function configureCSSDefaults() {
  cssLanguages.cssDefaults.setOptions({
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
export function configureJSONDefaults() {
  jsonLanguages.jsonDefaults.setDiagnosticsOptions({
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
export function addExtraLibraries() {
  const reactTypes = `
    declare module "react" {
      export function useState<T>(initialState: T): [T, (newState: T) => void];
      export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
    }
  `;
  tsLanguages.typescriptDefaults.addExtraLib(
    reactTypes,
    'file:///node_modules/@types/react/index.d.ts'
  );
}

// Custom Snippets
export function registerCustomSnippets() {
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
      return { suggestions: suggestions as monaco.languages.CompletionItem[] };
    },
  });
}
