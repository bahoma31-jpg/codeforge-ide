import { editor } from 'monaco-editor';

const modelCache = new Map<string, editor.ITextModel>();

export function getOrCreateModel(
  monaco: typeof import('monaco-editor'),
  filePath: string,
  content: string,
  language: string
): editor.ITextModel {
  let model = modelCache.get(filePath);

  if (!model) {
    model = monaco.editor.createModel(
      content,
      language,
      monaco.Uri.file(filePath)
    );
    modelCache.set(filePath, model);
  } else if (model.getValue() !== content) {
    model.setValue(content);
  }

  return model;
}

export function disposeModel(filePath: string) {
  const model = modelCache.get(filePath);
  if (model) {
    model.dispose();
    modelCache.delete(filePath);
  }
}

export function clearAllModels() {
  modelCache.forEach((model) => model.dispose());
  modelCache.clear();
}
