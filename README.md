# Claude Code Command Palette

Run [Claude Code](https://docs.anthropic.com/en/docs/claude-code) custom slash commands directly from VS Code's Command Palette.

## Features

- **Discover commands automatically** from both project (`.claude/commands/`) and user (`~/.claude/commands/`) directories
- **Quick access** via Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
- **Live reload** - automatically detects new or modified commands

## Usage

1. Open Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
2. Type "Run Claude Code Command"
3. Select a command from the list
4. The command runs in a dedicated "Claude" terminal

### Commands

| Command                          | Description                                   |
| -------------------------------- | --------------------------------------------- |
| `Run Claude Code Command`        | Shows a picker with all available commands    |
| `Claude Code: Refresh Commands`  | Manually refresh the command list             |

### Recommended Keybinding

For quick access, add a custom keybinding in VS Code:

1. Open Keyboard Shortcuts (`Cmd+K Cmd+S` / `Ctrl+K Ctrl+S`)
2. Search for "Run Claude Code Command"
3. Add your preferred keybinding (e.g., `Cmd+Option+C` / `Ctrl+Alt+C`)

Or add to `keybindings.json`:

```json
{
  "key": "cmd+alt+c",
  "command": "claude-command-palette.showCommands"
}
```

## Command Locations

The extension discovers commands from:

| Type     | Project-level              | User-level                 |
| -------- | -------------------------- | -------------------------- |
| Commands | `.claude/commands/*.md`    | `~/.claude/commands/*.md`  |

## Requirements

- VS Code 1.107.0 or later
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed

## Installation

### From VS Code Marketplace

1. Open VS Code
2. Go to Extensions (`Cmd+Shift+X` / `Ctrl+Shift+X`)
3. Search for "Claude Code Command Palette"
4. Click Install

### From VSIX

```bash
code --install-extension claude-code-command-palette-0.1.0.vsix
```

## License

MIT
