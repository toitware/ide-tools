" Copyright (C) 2021 Toitware ApS. All rights reserved.
" Use of this source code is governed by an MIT-style license that can be
" found in the LICENSE file.

" The VIM syntax documentation:
"   http://vimdoc.sourceforge.net/htmldoc/syntax.html#syntax
" The Pattern format:
"   http://vimdoc.sourceforge.net/htmldoc/pattern.html
"
" Use HiLinkTrace to debug: http://www.drchip.org/astronaut/vim/index.html#HILINKS
"   Download the vba, then unzip it, and open it in VIM. VIM should give
"   instructions on how to install it.
" Once installed, invoke `:HLT!` to enable tracing in the status line.

if exists("b:current_syntax")
    finish
endif

" Toit syntax is extremely context sensitive.
" Look at least 500 lines back.
syn sync minlines=500

syntax keyword toitKeyword it super extends implements as return abstract static unreachable break continue
highlight link toitKeyword Keyword

syntax keyword toitNull null
highlight link toitNull Constant

syntax keyword toitInclude import
highlight link toitInclude Include

syntax keyword toitRepeat for while
highlight link toitRepeat Repeat

syntax keyword toitConditional if else
highlight link toitConditional Conditional

syntax keyword toitExceptional throw
highlight link toitExceptional Exception

syntax keyword toitBool true false
highlight link toitbool Boolean

syntax keyword toitAssert assert
highlight link toitAssert Conditional

syntax match toitIdentifier "\v<[a-zA-Z_][a-zA-Z0-9_-]*>"

syntax match toitConstantIdentifier "\v<([A-Z][A-Z0-9_-]*)>"
highlight link toitConstantIdentifier Constant

syntax match toitClassIdentifier "\v<[A-Z][0-9]*(\?|>)"
syntax match toitClassIdentifier "\v<[A-Z][a-zA-Z0-9_-]*[a-z][a-zA-Z0-9_-]*[?]?"
highlight link toitClassIdentifier Type

syntax match toitNoneType "\v<none>"
highlight link toitNoneType Type

syntax match toitShortType "\v<int>[?]?"
syntax match toitShortType "\v<bool>[?]?"
syntax match toitShortType "\v<float>[?]?"
syntax match toitShortType "\v<string>[?]?"
highlight link toitShortType Type

syntax match toitAnyType "\v<any>"
highlight link toitAnyType Type

" One-character operators
syntax match toitOperator "\v-"
syntax match toitOperator "\v\+"
syntax match toitOperator "\v\*"
syntax match toitOperator "\v/"
syntax match toitOperator "\v\|"
syntax match toitOperator "\v\&"
syntax match toitOperator "\v\="
syntax match toitOperator "\v\^"
syntax match toitOperator "\v\<"
syntax match toitOperator "\v\>"
syntax match toitOperator "\v\%"
syntax match toitOperator "\v\~"
syntax match toitOperator "\v([A-Za-z_0-9])@<!\?"  " Use negative lookbehind to exclude foo? form (nullable type).
syntax match toitOperator "\v:"
syntax match toitOperator "\v;"
syntax match toitError "\v!"

" Two-character operators.
syntax match toitOperator "\v\^\="
syntax match toitOperator "\v-\="
syntax match toitOperator "\v\+\="
syntax match toitOperator "\v\*\="
syntax match toitOperator "\v/\="
syntax match toitOperator "\v:\="
syntax match toitOperator "\v\<\="
syntax match toitOperator "\v\=\="
syntax match toitOperator "\v\>\="
syntax match toitOperator "\v!\="
syntax match toitOperator "\v\.\."  " Unfortunately this also matches for imports, but that's hard to avoid
syntax match toitError "\v\|\|"
syntax match toitError "\v\&\&"

" Three-character operators.
syntax match toitOperator "\v<<\="
syntax match toitOperator "\v>>\="

" Four-character operators.
syntax match toitOperator "\v>>>\="

" Spelled out operators.
syntax keyword toitOperator not
syntax keyword toitOperator and
syntax keyword toitOperator or

highlight link toitOperator Operator
highlight link toitError Error

syntax match toitCharacter "'.'"
syntax match toitCharacter "'\\[0abfnrtv$\\"']'"
syntax match toitCharacter "'\\x[a-fA-F0-9][a-fA-F0-9]'"
syntax match toitCharacter "'\\u[a-fA-F0-9][a-fA-F0-9][a-fA-F0-9][a-fA-F0-9]'"
highlight link toitCharacter Character

syntax match toitNamedArgument "--i"
syntax match toitNamedArgument "\v--(no-)?[a-zA-Z_][a-zA-Z0-9_-]*>"
" Couldn't find a good color, so just made it uncolored.
"highlight link toitNamedArgument Identifier

syntax match toitNumber "\v-?\.([0-9](_[0-9]@=)?)+([eE][+-]?([0-9](_[0-9]@=)?)+)?"
syntax match toitNumber "\v-?([0-9](_[0-9]@=)?)+(\.([0-9](_[0-9]@=)?)+)?([eE][+-]?([0-9](_[0-9]@=)?)+)?"
" hexadecimal integers
syntax match toitNumber "\v-?0[xX]([0-9a-fA-F](_[0-9a-fA-F]@=)?)+"
" hexadecimal floats
syntax match toitNumber "\v-?0[xX]\.([0-9a-fA-F](_[0-9a-fA-F]@=)?)+[pP][+-]?([0-9](_[0-9]@=)?)+"
syntax match toitNumber "\v-?0[xX]([0-9a-fA-F](_[0-9a-fA-F]@=)?)+(\.([0-9a-fA-F](_[0-9a-fA-F]@=)?)+)?[pP][+-]?([0-9](_[0-9]@=)?)+"
" binary integers
syntax match toitNumber "\v-?0[bB]([0-1](_[0-1]@=)?)+"
highlight link toitNumber Number

syntax match toitComment "\v//.*$"
highlight link toitComment Comment

syntax region toitMultiComment start=/\/\*/ end=/\*\// contains=toitMultiComment
highlight link toitMultiComment Comment

" So that string-interpolation can correctly keep track of nested parenthesis.
syntax region toitParenthesized start="(" end=")" contains=TOP

" Match the empty string first (using negative look-ahead so it doesn't match
" multi-line strings.
syntax match toitString /"""\@!/
" Match all other single quote strings.
syntax region toitString start=/""\@!/ skip=/\\./ end=/"\|\n/
" Now match multi-line strings.
syntax region toitString start=/"""/ skip=/\\./ end=/"""/
syntax match toitInterpolatedIdentifier "\v\$[a-zA-Z_][a-zA-Z0-9_-]*" contained containedin=toitString nextgroup=toitInterpolatedDot,toitInterpolatedIndex
syntax match toitInterpolatedDot "\.[a-zA-Z_][a-zA-Z0-9_-]*" contained nextgroup=toitInterpolatedDot,toitInterpolatedIndex
syntax region toitInterpolatedIndex matchgroup=toitInterpolatedWrapperDelimiters start="\[" end="\]" contained contains=TOP nextgroup=toitInterpolatedDot,toitInterpolatedIndex
syntax region toitInterpolatedWrapper matchgroup=toitInterpolatedWrapperDelimiters start=/\v\$\((\%[-^]?[0-9.]*[a-zA-Z] )?/ end=")" contained containedin=toitString contains=TOP
highlight link toitString String
highlight link toitInterpolatedIdentifier Identifier
highlight link toitInterpolatedDot Identifier
highlight link toitInterpolatedWrapperDelimiters Operator

syntax match toitDeclaration "\zs\v[a-zA-Z_][a-zA-Z0-9_-]*[=]?\ze(\s*(/|->)[a-zA-Z_][a-zA-Z0-9_-]*(\.[a-zA-Z_][a-zA-Z0-9_-]*)*)?(\s*::?\=)@="
highlight link toitDeclaration Identifier

syntax match toitToplevelDeclaration "\v^[a-zA-Z_][a-zA-Z0-9_-]*"
highlight link toitToplevelDeclaration Identifier

syntax region toitClass matchgroup=toitStructure start=/\v(^|^abstract[ ]+)@<=(class|interface)>/ end=/\v^[^ ]@=/ contains=toitComment,toitMultiComment,toitMemberDeclaration,toitKeyword
highlight link toitStructure Structure

syntax region toitMemberBody start="" end=/\v(^ ? ?[a-zA-Z0-9_-])@=/ contained contains=TOP

"TODO(florian): currently the signature goes immediately into body mode once
"it has found the member name. We could try to be more intelligent and have a
"different coloring for the signature, as we did in VSCode.
syntax match toitMemberName "\v[a-zA-Z_][a-zA-Z0-9_-]*[=]?" contained nextgroup=toitMemberBody
highlight link toitMemberName Identifier
syntax match toitConstructorName "\vconstructor" contained nextgroup=toitMemberBody
highlight link toitConstructorName Keyword
syntax match toitOperatorMemberName /\v\=\=|\<\<|\>\>\>|\>\>|\<\=|\>\=|\<|\>|\+|-|\*|\/[*/]@!|\%|\^|\&|\||\[\]\=|\[\]|\[\.\.\]/ contained nextgroup=toitMemberBody
highlight link toitOperatorMemberName Identifier

syntax match toitOperatorKeyword "operator" contained
highlight link toitOperatorKeyword Keyword

syntax region toitMemberDeclaration start=/\v^  [^ ]@=/ end=/\v(^ ? ?[a-zA-Z0-9_-])@=/ contained contains=toitComment,toitMultiComment,toitKeyword,toitOperatorKeyword,toitConstructorName,toitMemberName,toitOperatorMemberName

"syntax match toitTodo "TODO|FIXME" containedin=toitComment
syntax match toitTodo /\v\_.<(TODO|FIXME).*/hs=s+1 containedin=toitComment
highlight link toitTodo Todo

let b:current_syntax = "toit"
