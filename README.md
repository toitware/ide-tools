# IDE Tools
Tools for working with Toit in different IDEs

## VS Code
See [vscode/README.md](vscode/README.md).

## Vim
See [vim/README.md](start/vim/README.md).

# Language Server
Toit has a language server that can be used with any editor that supports the
Language Server Protocol (LSP).

If you are using [Jaguar](https://github.com/toitlang/jaguar), you can invoke
the language server by calling `jag toit lsp`. Make sure to have called
`jag setup` before.

If you are using the [SDK](https://github.com/toitlang/toit) directly, you can
use the following command to start the language server:

```
# PATH-TO-TOIT.COMPILE is the path to the toit.compile binary.
toit.lsp --toitc PATH-TO-TOIT.COMPILE
```

Typically this will be something like:

```
toit.lsp --toitc /usr/bin/toit.compile
```

## Development
To have automatic checks for copyright and MIT notices, run

```
$ git config core.hooksPath .githooks
```

If a file doesn't need a copyright/MIT notice, use the following to skip
the check:
```
git commit --no-verify
```
