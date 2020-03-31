// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as path from "path";

function getAltFile(filePath: string): string | null {
  const p = path.parse(filePath);

  if (p.dir.startsWith("test") && p.base.endsWith(".spec.js")) {
    return path.format({
      dir: path.relative("test", p.dir),
      base: `${p.base.slice(0, -8)}.js`
    });
  }
  if (!p.dir.startsWith("test") && p.base.endsWith(".js")) {
    return path.format({
      dir: path.join("test", p.dir),
      base: `${p.base.slice(0, -3)}.spec.js`
    });
  }
  return null;
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "extension.switchToSpec",
    async () => {
      // The code you place here will be executed every time your command is executed

      const absFileURI = vscode.window.activeTextEditor?.document.uri;
      if (absFileURI === undefined) {
        return;
      }

      const rootURI = vscode.workspace.getWorkspaceFolder(absFileURI)?.uri;
      if (rootURI === undefined) {
        return;
      }

      const filePath = path.relative(rootURI.fsPath, absFileURI.fsPath);

      const altFilePath = getAltFile(filePath);

      if (altFilePath === null) {
        return;
      }

      const absAltFilePath = path.join(rootURI.fsPath, altFilePath);

      const doc = await vscode.workspace.openTextDocument(absAltFilePath);
      vscode.window.showTextDocument(doc);
    }
  );

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
