# Switch between Code/Test

A command that allows you to quickly switch between test and code.

Press `ctrl+shift+a` toggle between `test/file.spec.js` and `file.js`

Or use the command: `Switch between Code/Test`

## Default keybinding:

`ctrl+shift+a` (macOS: `cmd+shift+a`)

## Requirements

For now, this plugin is not configurable and assumes the directory structure in the above example.

## Resources

| Resource         | URL                                                                              |
| ---------------- | -------------------------------------------------------------------------------- |
| Repository       | https://github.com/bjornua/vscode-switch-code-test                               |
| Marketplace Page | https://marketplace.visualstudio.com/items?itemName=BjornArnholtz.switch-to-spec |

# Changelog

- `V0.0.8`: Refactor and fix inconsistencies
- `V0.0.7`: Add support for .ts and src folder ([@martinslota](https://github.com/martinslota))
- `V0.0.6`: /some/subdir/test folder location now supported ([@papaendrou](https://github.com/papandreou))
- `V0.0.5`: Ask before creating files
- `V0.0.4`: Add support for alternative "tests" folder
- `V0.0.3`: Create path if it does not exist
