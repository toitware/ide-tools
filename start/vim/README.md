Toit
====

Plugin to add syntax coloring for the Toit language.

Vim 8 or later
==============

If you are using Vim 8, or later, you can use the builtin
package support:

```shell
mkdir -p $HOME/.vim/pack/
cd $HOME/.vim/pack/
git clone https://github.com/toitware/ide-tools.git toit-ide-tools
```

NeoVim
======

Checkout this repository in your `~/.local/share/nvim/site/pack` directory:

```shell
mkdir -p $HOME/.local/share/nvim/site/pack
cd $HOME/.local/share/nvim/site/pack
git clone https://github.com/toitware/ide-tools.git toit-ide-tools
```

If you're using [lazy.nvim](https://github.com/folke/lazy.nvim)(a popular
plugin manager for Neovim), this is an example of a plugin spec you could add
to your configuration:

```lua
{
    "toitware/ide-tools",
    ft = { "toit" },
    config = function(plugin)
        vim.opt.rtp:append(plugin.dir .. "/start/vim")
    end,
    init = function(plugin)
        require("lazy.core.loader").ftdetect(plugin.dir .. "/start/vim")
    end,
}
```

# Vim 7 or earlier

If you are using an older vim, you can use Pathogen to manage your vim plugins.
In that case, it's enough to recursively copy this directory to a
$HOME/.vim/bundle/toit directory, so that this file appears as
$HOME/.vim/bundle/toit/README.md

If you are not using Pathogen, you can create a folder called `syntax` in the
location of your vim/neovim installation, copy `syntax/toit.vim` to that folder
and add the following to your `.vimrc` or `init.vim` file:

```
au! BufNewFile,BufReadPost *.{toit} set filetype=toit
```

This will enable syntax highlighting in vim/neovim.

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
