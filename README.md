
jacek
=====

*jacek* is yet another compiler compiler for javascript. The produced code is a simple recursive descent parser.


## Installation

```bash
npm intsall --save-dev gcnew/jacek
```

## Why yet another lexer / parser generator?

*jacek* was created because I wanted a simple, easy to use and set-up parser generator. .. and beause it was easy to write one.


## The grammar

The syntax is EBNF inspired.

#### Blocks

Blocks are literal text in between `%{` and `}%` copy-pasted in the output. Useful for `import`s, `export`s, function and type definitions.
There can be any number of blocks and can be placed anywhere inside the grammar file, but their contents is concatanated and printed before
any generated code. By convention, blocks should be placed before the first rule.

```
%{
export type Id      = { kind: 'id',      start: number, end: number, text: string }

function mkId(start: number, end: number, text: string): Id {
    return { kind: 'id', start, end, text };
}
}%
```

#### Rules
Rules are a means for grouping patterns and giving them a name.

In it's simplest form, the syntax is as follows

```<rule name> = <pattern>
               ;
```

All elements are required. E.g
```
matchHelloWorld = 'Hello World!'
                ;
```

Rules are compiled to parser functions that can be imported and used to parse text.


#### Basic Patterns

 - literals
   Literals are any quoted text. An exact, case-sensitive match is performed. 
   ```
   literal = 'literals are any quoted text'
           ;
   ```

 - RegExps
   The usual Perl / JS syntax is used. The behaviour can be altered by using flags - `i` for case-insensitive and `s` for dot-all. 
   ```
   regExp = /\w+/
          ;

   caseInsensitive = /aaa/i
                   ;

   dotAll = /the dot . matches any char including new lines/s
          ;
   ```

  - any
    Matches any single character. Might be removed in the future, as it's just a shortcut for `/./s`.
    ```
    matchesAnyCharacter = .
                        ;
    ```

  - not
    Matches a single character if the pattern inside the `not` is not met. The possible patterns are: literal, regexp, any and rule.
    ```
    notPattern = not('can be any simple pattern')
               ;

    ```

  - rule reference
    Rules can be invoked by referencing their name.
    ```
    statement = expression ';'
              ;
    ```

#### Repetition patterns

Just like in regular expressions, the modifiers `*`, `+` and `?` are used to match a pettern many, one-or-more or maybe-one times.

  - repetition
    To match a pattern many times (zero or more), use `*`.

    ```
    many = somePattern*
         ;
    ```

  - one or more
    To match a pattern one or more times use `+`.

    ```
    oneOrMore = somePattern+
              ;
    ```

  - maybe match
    To match an optional pattern use `?`.

    ```
    maybePresent = somePattern?
                 ;
    ```

#### Rules - mapping

Oftentimes, the aim for parsing is generating an AST (abstract syntax tree). In the same fashions as Yacc, `jacek` uses mapping
expressions (actions in Yacc). Mapping expressions are simple code that modifies the parsing result, by running an arbitrary
JavaScript expression. This expression has access to the parsed results (e.g. `$0` - the result of the first pattern, `$1` - the
result of the second one, etc) and the computed value becomes the result of the rule.

```

```


## Example

A simple Lambda Calculus parser

```
%{
type Id          = { kind: 'id', value: string, start: number, end: number }
type Lambda      = { kind: 'fn', arg: Id, body: Expr, start: number }
type Application = { kind: 'ap', fn: Expr, arg: Expr }

type Expr        = Lambda
                 | Application
}%


id = /\w+/                   %% { kind: 'id', value: text(), start, end } as Id
   ;

lambda = 'λ' id '.' expr     %% { kind: 'fn', arg: $1, body: $3, start } as Lambda
       ;

application = expr ' ' expr  %% { kind: 'ap', fn: $1, arg: $3 } as Application
            ;

expr = lambda
     | application
     ;
```
