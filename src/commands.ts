import * as vscode from "vscode";
import { ClaudeCommand } from "./discovery";

export function getCommandId(cmd: ClaudeCommand): string {
  return `claude-command-palette.run.${cmd.kind}.${cmd.type}.${cmd.name}`;
}

export function getCommandTitle(cmd: ClaudeCommand): string {
  const icon = cmd.kind === "skill" ? "$(sparkle)" : "$(terminal)";
  return `${icon} ${cmd.name}`;
}

function createTerminal(): vscode.Terminal {
  return vscode.window.createTerminal("Claude");
}

function executeCommand(cmd: ClaudeCommand): void {
  const terminal = createTerminal();

  if (cmd.kind === "command") {
    terminal.sendText(`claude /${cmd.type}:${cmd.name}`);
  } else {
    // Skills are invoked by name
    terminal.sendText(`claude "use ${cmd.name} skill"`);
  }

  vscode.window
    .showInformationMessage(`Running Claude: ${cmd.name}`, "Show Terminal")
    .then((selection) => {
      if (selection) {
        terminal.show();
      }
    });
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
