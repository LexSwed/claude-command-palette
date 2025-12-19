import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

suite('Discovery Test Suite', () => {
  const testDir = path.join(os.tmpdir(), 'claude-command-palette-test');
  const commandsDir = path.join(testDir, '.claude', 'commands');
  const skillsDir = path.join(testDir, '.claude', 'skills', 'test-skill');

  suiteSetup(() => {
    // Create test directories
    fs.mkdirSync(commandsDir, { recursive: true });
    fs.mkdirSync(skillsDir, { recursive: true });

    // Create test command
    fs.writeFileSync(
      path.join(commandsDir, 'test-command.md'),
      'This is a test command'
    );

    // Create test skill
    fs.writeFileSync(
      path.join(skillsDir, 'SKILL.md'),
      `---
name: test-skill
description: A test skill for testing
---

# Test Skill

Instructions here.
`
    );
  });

  suiteTeardown(() => {
    // Clean up test directories
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  test('Test command file exists', () => {
    const commandFile = path.join(commandsDir, 'test-command.md');
    assert.strictEqual(fs.existsSync(commandFile), true);
  });

  test('Test skill file exists', () => {
    const skillFile = path.join(skillsDir, 'SKILL.md');
    assert.strictEqual(fs.existsSync(skillFile), true);
  });

  test('Parse skill frontmatter', () => {
    const content = fs.readFileSync(path.join(skillsDir, 'SKILL.md'), 'utf-8');
    const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
    assert.ok(match, 'Frontmatter should be found');

    const frontmatter = match![1];
    const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
    const descMatch = frontmatter.match(/^description:\s*(.+)$/m);

    assert.strictEqual(nameMatch?.[1]?.trim(), 'test-skill');
    assert.strictEqual(descMatch?.[1]?.trim(), 'A test skill for testing');
  });
});

suite('Command Title Test Suite', () => {
  function getTitle(cmd: { name: string; type: string; kind: string }): string {
    return cmd.kind === 'skill'
      ? `Run Claude Code skill: ${cmd.name}`
      : `Run Claude Code ${cmd.type}: ${cmd.name}`;
  }

  test('Project command title format', () => {
    const cmd = { name: 'my-cmd', type: 'project', kind: 'command', filePath: '/test' };
    assert.strictEqual(getTitle(cmd), 'Run Claude Code project: my-cmd');
  });

  test('User command title format', () => {
    const cmd = { name: 'my-cmd', type: 'user', kind: 'command', filePath: '/test' };
    assert.strictEqual(getTitle(cmd), 'Run Claude Code user: my-cmd');
  });

  test('Skill title format', () => {
    const cmd = { name: 'my-skill', type: 'project', kind: 'skill', filePath: '/test' };
    assert.strictEqual(getTitle(cmd), 'Run Claude Code skill: my-skill');
  });
});
