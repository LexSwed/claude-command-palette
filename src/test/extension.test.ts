import * as assert from "assert";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

function parseDescription(content: string): string | undefined {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return undefined;

  const frontmatter = match[1];

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

  return frontmatter.match(/^description:\s*(.+)$/m)?.[1]?.trim();
}

suite("Discovery Test Suite", () => {
  const testDir = path.join(os.tmpdir(), "claude-command-palette-test");
  const commandsDir = path.join(testDir, ".claude", "commands");

  suiteSetup(() => {
    fs.mkdirSync(commandsDir, { recursive: true });

    fs.writeFileSync(
      path.join(commandsDir, "test-command.md"),
      "This is a test command"
    );

    fs.writeFileSync(
      path.join(commandsDir, "described-command.md"),
      `---
description: A command with description
---

# Command
`
    );

    fs.writeFileSync(
      path.join(commandsDir, "multiline-command.md"),
      `---
description: |
  This is a multiline
  description that spans
  multiple lines
---

# Command
`
    );
  });

  suiteTeardown(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  test("Command file exists", () => {
    assert.strictEqual(
      fs.existsSync(path.join(commandsDir, "test-command.md")),
      true
    );
  });

  test("Parse single-line description", () => {
    const content = fs.readFileSync(
      path.join(commandsDir, "described-command.md"),
      "utf-8"
    );
    assert.strictEqual(parseDescription(content), "A command with description");
  });

  test("Parse multiline description", () => {
    const content = fs.readFileSync(
      path.join(commandsDir, "multiline-command.md"),
      "utf-8"
    );
    assert.strictEqual(
      parseDescription(content),
      "This is a multiline description that spans multiple lines"
    );
  });

  test("No frontmatter returns undefined", () => {
    const content = fs.readFileSync(
      path.join(commandsDir, "test-command.md"),
      "utf-8"
    );
    assert.strictEqual(parseDescription(content), undefined);
  });
});
