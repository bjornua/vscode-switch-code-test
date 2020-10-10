// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as pathlib from "path";
import * as fs from "fs";

function findTestFolder(
  rootFolder: string,
  folders: Array<string>
): string | null {
  for (const f of folders) {
    if (fs.existsSync(pathlib.join(rootFolder, f))) {
      return f;
    }
  }
  return null;
}

async function promptCreateFile(path: string) {
  const showMsg = vscode.window.showInformationMessage;
  const msg = `File doesn't exist ${path}`;
  return (await showMsg(msg, "Create file")) === "Create file";
}

async function createFile(path: string) {
  await fs.promises.mkdir(pathlib.dirname(path), {
    recursive: true,
  });
  const fd = await fs.promises.open(path, "a+");
  await fd.close();
  return true;
}

function getAltFile(testFolderName: string, filePath: string): string | null {
  const p = pathlib.parse(filePath);

  if (p.dir.startsWith(testFolderName) && p.base.endsWith(".spec.js")) {
    return pathlib.format({
      dir: pathlib.relative(testFolderName, p.dir),
      base: `${p.base.slice(0, -8)}.js`,
    });
  }

  if (!p.dir.startsWith(testFolderName) && p.base.endsWith(".js")) {
    return pathlib.format({
      dir: pathlib.join(testFolderName, p.dir),
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
    path: pathlib.relative(rootURI.fsPath, absFileURI.fsPath),
  };
}

async function command() {
  const current = getCurrentRelPath();
  if (current === null) {
    return;
  }

  const testFolder = findTestFolder(current.root, ["tests", "test"]);

  if (testFolder === null) {
    return null;
  }

  const altFilePath = getAltFile(testFolder, current.path);

  if (altFilePath === null) {
    return;
  }

  const absAltFilePath = pathlib.join(current.root, altFilePath);
  if (!fs.existsSync(absAltFilePath)) {
    if (!(await promptCreateFile(altFilePath))) {
      return;
    }

    await createFile(absAltFilePath);
  }

  const doc = await vscode.workspace.openTextDocument(absAltFilePath);

  await vscode.window.showTextDocument(doc);
}

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "extension.switchToSpec",
    command
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
