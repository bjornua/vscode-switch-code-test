import * as vscode from "vscode";
import * as pathlib from "path";
import * as fs from "fs";

type TestAndSourceFolders = Readonly<{
  containingFolder: string;
  testFolderName: string;
  hasSourceFolder: boolean;
}>;

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "extension.switchToSpec",
    switchToCorrespondingFile
  );
  context.subscriptions.push(disposable);
}

export function deactivate() {}

async function switchToCorrespondingFile() {
  const config = {
    testFolderNames: ["tests", "test"],
    sourceFolderName: "src",
    specExtensions: [".spec.ts", ".spec.js"],
  };

  const current = getCurrentRelPath();
  if (current === null) {
    return;
  }

  const folders = locateTestAndSourceDirectories(
    current.root,
    pathlib.dirname(current.path),
    config.testFolderNames,
    config.sourceFolderName
  );
  if (folders === null) {
    return;
  }

  const isTest = isTestFile(current.path, config.specExtensions);
  if (isTest) {
    await handleTestFile(current, folders, config.sourceFolderName);
  } else {
    await handleSourceFile(current, folders, config.sourceFolderName);
  }
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

function isTestFile(filePath: string, specExtensions: string[]): boolean {
  return specExtensions.some((ext) => filePath.endsWith(ext));
}

async function handleTestFile(
  current: { root: string; path: string },
  testAndSourceFolders: TestAndSourceFolders,
  sourceFolderName: string
) {
  const correspondingFilePath = getCorrespondingSourceFile(
    current.path,
    testAndSourceFolders,
    sourceFolderName
  );
  await openOrCreateByPath(current.root, correspondingFilePath);
}

async function handleSourceFile(
  current: { root: string; path: string },
  testAndSourceFolders: TestAndSourceFolders,
  sourceFolderName: string
) {
  const correspondingFilePath = getCorrespondingTestFile(
    current.path,
    testAndSourceFolders,
    sourceFolderName
  );
  await openOrCreateByPath(current.root, correspondingFilePath);
}

async function openOrCreateByPath(root: string, relPath: string) {
  const absPath = pathlib.join(root, relPath);
  if (!fs.existsSync(absPath)) {
    if (!(await promptForFileCreation(relPath))) {
      return;
    }
    await createFile(absPath);
  }

  const doc = await vscode.workspace.openTextDocument(absPath);
  await vscode.window.showTextDocument(doc);
}

function getCorrespondingSourceFile(
  filePath: string,
  { containingFolder, hasSourceFolder, testFolderName }: TestAndSourceFolders,
  sourceFolderName: string
) {
  const p = pathlib.parse(filePath);
  const subdirs = pathlib.relative(
    pathlib.join(containingFolder, testFolderName),
    p.dir
  );
  return pathlib.format({
    dir: pathlib.join(
      containingFolder,
      ...(hasSourceFolder ? [sourceFolderName] : []),
      subdirs
    ),
    base: `${p.name.replace(".spec", "")}${p.ext}`,
  });
}

function getCorrespondingTestFile(
  filePath: string,
  { containingFolder, testFolderName, hasSourceFolder }: TestAndSourceFolders,
  sourceFolderName: string
) {
  const p = pathlib.parse(filePath);
  const subdirs = hasSourceFolder
    ? pathlib.relative(pathlib.join(containingFolder, sourceFolderName), p.dir)
    : pathlib.relative(containingFolder, p.dir);
  return pathlib.format({
    dir: pathlib.join(containingFolder, testFolderName, subdirs),
    base: `${p.name}.spec${p.ext}`,
  });
}

function locateTestAndSourceDirectories(
  rootFolder: string,
  rootRelativeDirname: string,
  testFolderNames: string[],
  sourceFolderName: string
): TestAndSourceFolders | null {
  const relativeFragments =
    rootRelativeDirname.length > 0
      ? rootRelativeDirname.split(pathlib.sep)
      : [];
  for (let i = relativeFragments.length; i >= 0; i -= 1) {
    for (const testFolderName of testFolderNames) {
      const containingFolder = relativeFragments.slice(0, i).join(pathlib.sep);
      if (
        fs.existsSync(
          pathlib.join(
            rootFolder,
            pathlib.join(containingFolder, testFolderName)
          )
        )
      ) {
        return {
          containingFolder,
          testFolderName,
          hasSourceFolder: fs.existsSync(
            pathlib.join(
              rootFolder,
              pathlib.join(containingFolder, sourceFolderName)
            )
          ),
        };
      }
    }
  }
  return null;
}

async function promptForFileCreation(path: string) {
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
