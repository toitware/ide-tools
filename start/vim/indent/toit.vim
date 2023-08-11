" Copyright Neovim contributors. All rights reserved.
" This file is from Neovim, adapted from indent/python.vim and autoload/python.vim
" See NEOVIM_LICENSE.txt in this directory.
"
" Vim indent file
" Language:		Toit
" Maintainer:		Erik Corry <erik@toit.io>
" Original Authors:	David Bustos <bustos@caltech.edu>, Bram Moolenaar <Bram@vim.org>
" Last Change:		2023 Aug 11

" Only load this indent file when no other was loaded.
if exists("b:did_indent")
  finish
endif
let b:did_indent = 1

" Some preliminary settings
setlocal nolisp		" Make sure lisp indenting doesn't supersede us
setlocal autoindent	" indentexpr isn't much help otherwise

setlocal indentexpr=ToitGetIndent(v:lnum)
setlocal indentkeys+=<:>,=<\|>

if exists("*ToitGetIndent")
 finish
endif

" Toit settings:
"
" Indentation is two spaces.
let s:normal_indent = 2
" let s:normal_indent=shiftwidth()  " Not recommended for Toit, we always indent 2 spaces.
" Indentation in a list, byte array, set or map.
let s:open_paren = 4
let s:nested_paren = 4
" Continued lines.
let s:continue = 4
" The close paren aligns with the line where it was opened, not with the items in the list.
let s:closed_paren_align_last_line = v:false
let s:searchpair_timeout = 500
let s:disable_parentheses_indenting = 0



let b:undo_indent = "setl ai< inde< indk< lisp<"

" Support for Toit indenting.

let s:maxoff = 50       " maximum number of lines to look backwards for ()

function s:SearchBracket(fromlnum, flags)
  return searchpairpos('[[({]', '', '[])}]', a:flags,
          \ {-> synstack('.', col('.'))
          \ ->indexof({_, id -> synIDattr(id, 'name') =~ '\%(Comment\|Todo\|String\)$'}) >= 0},
          \ [0, a:fromlnum - s:maxoff]->max(), s:searchpair_timeout)
endfunction

" See if the specified line is already user-dedented from the expected value.
function s:Dedented(lnum, expected)
  return indent(a:lnum) <= a:expected - s:normal_indent
endfunction

function ToitGetIndent(lnum)
  " If this line is explicitly joined: If the previous line was also joined,
  " line it up with that one, otherwise add two 'shiftwidth'
  if getline(a:lnum - 1) =~ '\\$'
    if a:lnum > 1 && getline(a:lnum - 2) =~ '\\$'
      return indent(a:lnum - 1)
    endif
    return indent(a:lnum - 1) + s:continue
  endif

  " If the start of the line is in a string don't change the indent.
  if has('syntax_items')
	\ && synIDattr(synID(a:lnum, 1, 1), "name") =~ "String$"
    return -1
  endif

  " Search backwards for the previous non-empty line.
  let plnum = prevnonblank(v:lnum - 1)

  if plnum == 0
    " This is the first non-empty line, use zero indent.
    return 0
  endif

  if s:disable_parentheses_indenting == 1
    let plindent = indent(plnum)
    let plnumstart = plnum
  else
    " Indent inside parens.
    " Align with the open paren unless it is at the end of the line.
    " E.g.
    "     open_paren_not_at_EOL(100,
    "                           (200,
    "                            300),
    "                           400)
    "     open_paren_at_EOL(
    "         100, 200, 300, 400)
    call cursor(a:lnum, 1)
    let [parlnum, parcol] = s:SearchBracket(a:lnum, 'nbW')
    if parlnum > 0
      if parcol != col([parlnum, '$']) - 1
        return parcol
      elseif getline(a:lnum) =~ '^\s*[])}]' && !s:closed_paren_align_last_line
        return indent(parlnum)
      endif
    endif

    call cursor(plnum, 1)

    " If the previous line is inside parenthesis, use the indent of the starting
    " line.
    let [parlnum, _] = s:SearchBracket(plnum, 'nbW')
    if parlnum > 0
      let plindent = indent(parlnum)
      let plnumstart = parlnum
    else
      let plindent = indent(plnum)
      let plnumstart = plnum
    endif

    " When inside parenthesis: If at the first line below the parenthesis add
    " two 'shiftwidth', otherwise same as previous line.
    " i = (a
    "       + b
    "       + c)
    call cursor(a:lnum, 1)
    let [p, _] = s:SearchBracket(a:lnum, 'bW')
    if p > 0
      if p == plnum
	" When the start is inside parenthesis, only indent one 'shiftwidth'.
	let [pp, _] = s:SearchBracket(a:lnum, 'bW')
	if pp > 0
	  return indent(plnum) + s:nested_paren
	endif
	return indent(plnum) + s:open_paren
      endif
      if plnumstart == p
	return indent(plnum)
      endif
      return plindent
    endif
  endif


  " Get the line and remove a trailing comment.
  " Use syntax highlighting attributes when possible.
  let pline = getline(plnum)
  let pline_len = strlen(pline)
  if has('syntax_items')
    " If the last character in the line is a comment, do a binary search for
    " the start of the comment.  synID() is slow, a linear search would take
    " too long on a long line.
    if synstack(plnum, pline_len)
    \ ->indexof({_, id -> synIDattr(id, 'name') =~ '\%(Comment\|Todo\)$'}) >= 0
      let min = 1
      let max = pline_len
      while min < max
	let col = (min + max) / 2
        if synstack(plnum, col)
        \ ->indexof({_, id -> synIDattr(id, 'name') =~ '\%(Comment\|Todo\)$'}) >= 0
	  let max = col
	else
	  let min = col + 1
	endif
      endwhile
      let pline = strpart(pline, 0, min - 1)
    endif
  else
    let col = 0
    while col < pline_len
      if pline[col] == '#'
	let pline = strpart(pline, 0, col)
	break
      endif
      let col = col + 1
    endwhile
  endif

  " If the previous line ended with a colon or a block argument pipe, indent this line
  if pline =~ '[:|]\s*$'
    return plindent + s:normal_indent
  endif

  " If the previous line was a stop-execution statement...
  if getline(plnum) =~ '^\s*\(break\|continue\|throw\|return\)\>'
    " See if the user has already dedented
    if s:Dedented(a:lnum, indent(plnum))
      " If so, trust the user
      return -1
    endif
    " If not, recommend one dedent
    return indent(plnum) - s:normal_indent
  endif

  " If the current line begins with a header keyword, dedent
  if getline(a:lnum) =~ '^\s*\(else\|finally\)\>'

    " Unless the user has already dedented
    if s:Dedented(a:lnum, plindent)
      return -1
    endif

    return plindent - s:normal_indent
  endif

  " When after a () construct we probably want to go back to the start line.
  " a = (b
  "       + c)
  " here
  if parlnum > 0
    " ...unless the user has already dedented
    if s:Dedented(a:lnum, plindent)
        return -1
    else
        return plindent
    endif
  endif

  return -1
endfunction
