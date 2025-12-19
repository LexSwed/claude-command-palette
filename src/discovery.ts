import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

export interface ClaudeCommand {
  name: string;
  type: 'project' | 'user';
  kind: 'command' | 'skill';
  filePath: string;
  description?: string;
}

function getCommandDirs(): { project: string | null; user: string } {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const projectDir = workspaceFolder ? path.join(workspaceFolder, '.claude', 'commands') : null;
  const userDir = path.join(os.homedir(), '.claude', 'commands');
  return { project: projectDir, user: userDir };
}

function getSkillDirs(): { project: string | null; user: string } {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const projectDir = workspaceFolder ? path.join(workspaceFolder, '.claude', 'skills') : null;
  const userDir = path.join(os.homedir(), '.claude', 'skills');
  return { project: projectDir, user: userDir };
}

function parseSkillFrontmatter(content: string): { name?: string; description?: string } {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) {
    return {};
  }

  const frontmatter = match[1];
  const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
  const descMatch = frontmatter.match(/^description:\s*(.+)$/m);

  return {
    name: nameMatch?.[1]?.trim(),
    description: descMatch?.[1]?.trim(),
  };
}

async function findFilesInDir(dir: string, pattern: string): Promise<string[]> {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const files: string[] = [];
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isFile() && entry.name.match(new RegExp(pattern))) {
      files.push(fullPath);
    }
  }
  return files;
}

async function findSkillDirsIn(dir: string): Promise<string[]> {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const skillPaths: string[] = [];
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const skillFile = path.join(dir, entry.name, 'SKILL.md');
      if (fs.existsSync(skillFile)) {
        skillPaths.push(skillFile);
      }
    }
  }
  return skillPaths;
}

export async function discoverCommands(): Promise<ClaudeCommand[]> {
  const commands: ClaudeCommand[] = [];
  const commandDirs = getCommandDirs();
  const skillDirs = getSkillDirs();

  // Find project slash commands
  if (commandDirs.project) {
    const projectCommands = await findFilesInDir(commandDirs.project, '\\.md$');
    for (const filePath of projectCommands) {
      const name = path.basename(filePath, '.md');
      commands.push({ name, type: 'project', kind: 'command', filePath });
    }
  }

  // Find user slash commands
  const userCommands = await findFilesInDir(commandDirs.user, '\\.md$');
  for (const filePath of userCommands) {
    const name = path.basename(filePath, '.md');
    commands.push({ name, type: 'user', kind: 'command', filePath });
  }

  // Find project skills
  if (skillDirs.project) {
    const projectSkills = await findSkillDirsIn(skillDirs.project);
    for (const filePath of projectSkills) {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      const { name, description } = parseSkillFrontmatter(content);
      const dirName = path.basename(path.dirname(filePath));
      commands.push({
        name: name || dirName,
        type: 'project',
        kind: 'skill',
        filePath,
        description,
      });
    }
  }

  // Find user skills
  const userSkills = await findSkillDirsIn(skillDirs.user);
  for (const filePath of userSkills) {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    const { name, description } = parseSkillFrontmatter(content);
    const dirName = path.basename(path.dirname(filePath));
    commands.push({
      name: name || dirName,
      type: 'user',
      kind: 'skill',
      filePath,
      description,
    });
  }

  return commands;
}

export function getWatchPaths(): string[] {
  const paths: string[] = [];
  const commandDirs = getCommandDirs();
  const skillDirs = getSkillDirs();

  if (commandDirs.project) {
    paths.push(commandDirs.project);
  }
  paths.push(commandDirs.user);
  if (skillDirs.project) {
    paths.push(skillDirs.project);
  }
  paths.push(skillDirs.user);

  return paths.filter(p => fs.existsSync(p));
}
