import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

interface ClaudeCommand {
  name: string;
  type: "project" | "user";
  filePath: string;
  description?: string;
}

let registeredDisposables: vscode.Disposable[] = [];
let currentCommands: ClaudeCommand[] = [];

function getCommandDirs(): { project: string | null; user: string } {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  return {
    project: workspaceFolder
      ? path.join(workspaceFolder, ".claude", "commands")
      : null,
    user: path.join(os.homedir(), ".claude", "commands"),
  };
}

function parseDescription(content: string): string | undefined {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return undefined;

  const frontmatter = match[1];

  // Handle multiline: description: |
  const multilineMatch = frontmatter.match(
    /^description:\s*\|\s*\n((?:[ \t]+.+\n?)+)/m
  );
  if (multilineMatch) {
    return multilineMatch[1]
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .join(" ");
  }

  // Handle single line: description: text
  return frontmatter.match(/^description:\s*(.+)$/m)?.[1]?.trim();
}

async function discoverCommandsInDir(
  dir: string,
  type: "project" | "user"
): Promise<ClaudeCommand[]> {
  if (!fs.existsSync(dir)) return [];

  const commands: ClaudeCommand[] = [];
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue;

    const filePath = path.join(dir, entry.name);
    const name = path.basename(entry.name, ".md");

    try {
      const content = await fs.promises.readFile(filePath, "utf-8");
      commands.push({ name, type, filePath, description: parseDescription(content) });
    } catch {
      commands.push({ name, type, filePath });
    }
  }

  return commands;
}

async function discoverCommands(): Promise<ClaudeCommand[]> {
  const { project, user } = getCommandDirs();
  const [projectCommands, userCommands] = await Promise.all([
    project ? discoverCommandsInDir(project, "project") : [],
    discoverCommandsInDir(user, "user"),
  ]);
  return [...projectCommands, ...userCommands];
}

function createWatchers(onChanged: () => void): vscode.Disposable[] {
  const watchers: vscode.Disposable[] = [];

  const workspaceWatcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(
      vscode.workspace.workspaceFolders?.[0] || "",
      ".claude/commands/**/*.md"
    )
  );
  workspaceWatcher.onDidCreate(onChanged);
  workspaceWatcher.onDidDelete(onChanged);
  workspaceWatcher.onDidChange(onChanged);
  watchers.push(workspaceWatcher);

  const userWatcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(
      path.join(os.homedir(), ".claude"),
      "commands/**/*.md"
    )
  );
  userWatcher.onDidCreate(onChanged);
  userWatcher.onDidDelete(onChanged);
  userWatcher.onDidChange(onChanged);
  watchers.push(userWatcher);

  return watchers;
}

async function refreshCommands(context: vscode.ExtensionContext): Promise<void> {
  registeredDisposables.forEach((d) => d.dispose());
  registeredDisposables = [];

  currentCommands = await discoverCommands();

  for (const cmd of currentCommands) {
    const id = `claude-command-palette.run.${cmd.type}.${cmd.name}`;
    const disposable = vscode.commands.registerCommand(id, () => {
      const terminal = vscode.window.createTerminal("Claude");
      terminal.sendText(`claude /${cmd.name}`);
      vscode.window
        .showInformationMessage(`Running Claude: ${cmd.name}`, "Show Terminal")
        .then((selection) => {
          if (selection) terminal.show();
        });
    });
    registeredDisposables.push(disposable);
    context.subscriptions.push(disposable);
  }
}

export async function activate(context: vscode.ExtensionContext) {
  await refreshCommands(context);

  context.subscriptions.push(
    vscode.commands.registerCommand("claude-command-palette.refresh", () =>
      refreshCommands(context)
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "claude-command-palette.showCommands",
      async () => {
        if (currentCommands.length === 0) {
          vscode.window.showInformationMessage("No Claude commands found.");
          return;
        }

        const items = currentCommands.map((cmd) => ({
          label: `${cmd.type === "user" ? "$(home)" : "$(folder)"} ${cmd.name}`,
          description: cmd.type === "user" ? "User" : "Project",
          detail: cmd.description || undefined,
          command: cmd,
        }));

        const selected = await vscode.window.showQuickPick(items, {
          placeHolder: "Select a Claude command to run",
        });

        if (selected) {
          const id = `claude-command-palette.run.${selected.command.type}.${selected.command.name}`;
          vscode.commands.executeCommand(id);
        }
      }
    )
  );

  createWatchers(() => refreshCommands(context)).forEach((w) =>
    context.subscriptions.push(w)
  );
}

export function deactivate() {
  registeredDisposables.forEach((d) => d.dispose());
}
