import * as assert from "assert";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

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

Instructions here.
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

  test("Parse frontmatter description", () => {
    const content = fs.readFileSync(
      path.join(commandsDir, "described-command.md"),
      "utf-8"
    );
    const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
    assert.ok(match);
    assert.strictEqual(
      match![1].match(/^description:\s*(.+)$/m)?.[1]?.trim(),
      "A command with description"
    );
  });

  test("No frontmatter returns null", () => {
    const content = fs.readFileSync(
      path.join(commandsDir, "test-command.md"),
      "utf-8"
    );
    assert.strictEqual(content.match(/^---\s*\n([\s\S]*?)\n---/), null);
  });
});
