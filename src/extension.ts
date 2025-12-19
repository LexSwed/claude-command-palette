import * as vscode from "vscode";
import { discoverCommands, ClaudeCommand } from "./discovery";
import {
  registerClaudeCommands,
  unregisterCommands,
  getCommandId,
  getCommandTitle,
} from "./commands";
import { createWatchers } from "./watcher";

let registeredDisposables: vscode.Disposable[] = [];
let currentCommands: ClaudeCommand[] = [];

async function refreshCommands(
  context: vscode.ExtensionContext
): Promise<void> {
  // Unregister old commands
  unregisterCommands(registeredDisposables);
  registeredDisposables = [];

  // Discover new commands
  currentCommands = await discoverCommands();

  // Register VS Code commands
  registeredDisposables = registerClaudeCommands(context, currentCommands);

  // Update command palette items
  await updateCommandPalette(currentCommands);
}

async function updateCommandPalette(_commands: ClaudeCommand[]): Promise<void> {
  // VS Code doesn't support dynamic contributes.commands, so we use a QuickPick
}

export async function activate(context: vscode.ExtensionContext) {
  console.log("Claude Command Palette is now active");

  // Initial discovery
  await refreshCommands(context);

  // Register refresh command
  const refreshDisposable = vscode.commands.registerCommand(
    "claude-command-palette.refresh",
    () => refreshCommands(context)
  );
  context.subscriptions.push(refreshDisposable);

  // Register command picker
  const pickerDisposable = vscode.commands.registerCommand(
    "claude-command-palette.showCommands",
    async () => {
      if (currentCommands.length === 0) {
        vscode.window.showInformationMessage(
          "No Claude commands or skills found."
        );
        return;
      }

      const items = currentCommands.map((cmd) => ({
        label: getCommandTitle(cmd),
        description: cmd.description || "",
        command: cmd,
      }));

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: "Select a Claude command to run",
      });

      if (selected) {
        vscode.commands.executeCommand(getCommandId(selected.command));
      }
    }
  );
  context.subscriptions.push(pickerDisposable);

  // Set up file watchers
  const watchers = createWatchers(() => refreshCommands(context));
  watchers.forEach((w) => context.subscriptions.push(w));
}

export function deactivate() {
  unregisterCommands(registeredDisposables);
}
