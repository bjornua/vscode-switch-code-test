// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as pathlib from "path";
import * as fs from "fs";

function findTestFolder(
  rootFolder: string,
  rootRelativeDirname: string,
  folders: Array<string>
): { pathToTestFolder: string, testFolderName: string } | null {
  // Traverse outwards and try to find the first test folder in a parent directory:
  const relativeFragments = rootRelativeDirname.length > 0 ? rootRelativeDirname.split(pathlib.sep) : [];
  for (let i = relativeFragments.length ; i >= 0 ; i -= 1) {
    for (const testFolderName of folders) {
      const pathToTestFolder = relativeFragments.slice(0, i).join(pathlib.sep);
      if (fs.existsSync(pathlib.join(rootFolder, pathlib.join(pathToTestFolder, testFolderName)))) {
        return {
          pathToTestFolder,
          testFolderName
        };
      }
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

function getAltFile(pathToTestFolder: string, testFolderName: string, filePath: string): string | null {
  const p = pathlib.parse(filePath);
  const isInsideTestFolder = p.dir.startsWith(pathlib.join(pathToTestFolder, testFolderName));

  if (isInsideTestFolder && p.base.endsWith(".spec.js")) {
    return pathlib.format({
      dir: pathlib.join(pathToTestFolder, pathlib.relative(pathlib.join(pathToTestFolder, testFolderName), p.dir)),
      base: `${p.base.slice(0, -8)}.js`,
    });
  }

  if (!isInsideTestFolder && p.base.endsWith(".js")) {
    return pathlib.format({
      dir: pathlib.join(pathToTestFolder, testFolderName, pathlib.relative(pathToTestFolder, p.dir)),
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

  const testFolder = findTestFolder(current.root, pathlib.dirname(current.path), ["tests", "test"]);

  if (testFolder === null) {
    return null;
  }

  const altFilePath = getAltFile(testFolder.pathToTestFolder, testFolder.testFolderName, current.path);

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
