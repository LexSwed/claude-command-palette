import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';

export function createWatchers(
  onCommandsChanged: () => void
): vscode.Disposable[] {
  const watchers: vscode.Disposable[] = [];

  // Watch workspace .claude directory
  const workspaceWatcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(
      vscode.workspace.workspaceFolders?.[0] || '',
      '.claude/{commands,skills}/**/*.md'
    )
  );

  workspaceWatcher.onDidCreate(onCommandsChanged);
  workspaceWatcher.onDidDelete(onCommandsChanged);
  workspaceWatcher.onDidChange(onCommandsChanged);
  watchers.push(workspaceWatcher);

  // Watch user .claude directory
  const userClaudeDir = path.join(os.homedir(), '.claude');
  const userCommandsPattern = new vscode.RelativePattern(
    userClaudeDir,
    '{commands,skills}/**/*.md'
  );
  const userWatcher = vscode.workspace.createFileSystemWatcher(userCommandsPattern);

  userWatcher.onDidCreate(onCommandsChanged);
  userWatcher.onDidDelete(onCommandsChanged);
  userWatcher.onDidChange(onCommandsChanged);
  watchers.push(userWatcher);

  return watchers;
}
