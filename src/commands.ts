import * as vscode from 'vscode';
import { ClaudeCommand } from './discovery';

export function getCommandId(cmd: ClaudeCommand): string {
  return `claude-command-palette.run.${cmd.kind}.${cmd.type}.${cmd.name}`;
}

export function getCommandTitle(cmd: ClaudeCommand): string {
  if (cmd.kind === 'skill') {
    return `Run Claude Code skill: ${cmd.name}`;
  }
  return `Run Claude Code ${cmd.type}: ${cmd.name}`;
}

function getTerminal(): vscode.Terminal {
  const existing = vscode.window.terminals.find(t => t.name === 'Claude');
  if (existing) {
    return existing;
  }
  return vscode.window.createTerminal('Claude');
}

function executeCommand(cmd: ClaudeCommand): void {
  const terminal = getTerminal();
  terminal.show();

  if (cmd.kind === 'command') {
    terminal.sendText(`claude /${cmd.type}:${cmd.name}`);
  } else {
    // Skills are invoked by name
    terminal.sendText(`claude "use ${cmd.name} skill"`);
  }
}

export function registerClaudeCommands(
  context: vscode.ExtensionContext,
  commands: ClaudeCommand[]
): vscode.Disposable[] {
  const disposables: vscode.Disposable[] = [];

  for (const cmd of commands) {
    const commandId = getCommandId(cmd);
    const disposable = vscode.commands.registerCommand(commandId, () => {
      executeCommand(cmd);
    });
    disposables.push(disposable);
    context.subscriptions.push(disposable);
  }

  return disposables;
}

export function unregisterCommands(disposables: vscode.Disposable[]): void {
  for (const d of disposables) {
    d.dispose();
  }
}
