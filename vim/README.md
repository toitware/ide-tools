Toit
====

Plugin to add syntax coloring for the Toit language.

If you are using Pathogen to manage your vim plugins, it's enough to
recursively copy this directory to a $HOME/.vim/bundle/toit directory, so
that this file appears as $HOME/.vim/bundle/toit/README.md

Language Server
===============

There are many LSP clients for VIM. The following instructions are for
`vim-lsc`, but they should be easy to adapt for other clients.


As described in the [readme](https://github.com/natebosch/vim-lsc) the preferred
way to install the plugin is with a plugin manager.

Here, we use `vim-plug`:

```
Plug 'natebosch/vim-lsc'
```

Don't forget to run `:PlugInstall`.

Then add the following section to your `.vimrc`:
```
let g:lsc_server_commands = {
  \ 'toit': {
  \    'name': 'toit-language-server',
  \    'command': 'toit tool lsp'
  \  }
  \}
```
