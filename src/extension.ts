// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

function getAltFile(filePath: string): string | null {
  const p = path.parse(filePath);

  if (p.dir.startsWith("test") && p.base.endsWith(".spec.js")) {
    return path.format({
      dir: path.relative("test", p.dir),
      base: `${p.base.slice(0, -8)}.js`,
    });
  }

  if (!p.dir.startsWith("test") && p.base.endsWith(".js")) {
    return path.format({
      dir: path.join("test", p.dir),
      base: `${p.base.slice(0, -3)}.spec.js`,
    });
  }
  return null;
}

function getCurrentRelPath() {
  const absFileURI = vscode.window.activeTextEditor?.document.uri;
  if (absFileURI === undefined) {
    return null;
  }

  const rootURI = vscode.workspace.getWorkspaceFolder(absFileURI)?.uri;
  if (rootURI === undefined) {
    return null;
  }

  return {
    root: rootURI.fsPath,
    path: path.relative(rootURI.fsPath, absFileURI.fsPath),
  };
}

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "extension.switchToSpec",
    async () => {
      const current = getCurrentRelPath();
      if (current === null) {
        return;
      }

      const altFilePath = getAltFile(current.path);

      if (altFilePath === null) {
        return;
      }

      const absAltFilePath = path.join(current.root, altFilePath);

      if (!fs.existsSync(absAltFilePath)) {
        await fs.promises.mkdir(path.dirname(absAltFilePath), {
          recursive: true,
        });
        const fd = await fs.promises.open(absAltFilePath, "a+");
        await fd.close();
      }

      const doc = await vscode.workspace.openTextDocument(absAltFilePath);

      await vscode.window.showTextDocument(doc);
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
