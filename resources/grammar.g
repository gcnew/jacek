
%{

export type SimplePattern = Literal | Regexp | Any | Not | Id

export type Any     = { kind: 'any',     start: number, end: number }
export type Id      = { kind: 'id',      start: number, end: number, text: string }
export type Literal = { kind: 'literal', start: number, end: number, text: string }
export type Regexp  = { kind: 'regexp',  start: number, end: number, text: string }
export type Text    = { kind: 'text',    start: number, end: number, text: string }
export type Not     = { kind: 'not',     start: number, end: number, pattern: SimplePattern }

export type Rep     = { kind: 'rep',     pattern: SimplePattern, modifier?: '*' | '+' | '?' }

export type Pattern = { kind: 'pattern', seq: Rep[], mapper?: Text }

export type Rule    = { kind: 'rule',    id: Id,  alternatives: Pattern[], type?: Id }

export type Pasta   = { kind: 'pasta',   text: Text }
export type Grammar = { kind: 'grammar', pasta: Pasta[], rules: Rule[] }

function mkAny(start: number, end: number): Any {
    return { kind: 'any', start, end };
}

function mkId(start: number, end: number, text: string): Id {
    return { kind: 'id', start, end, text };
}

function mkLiteral(start: number, end: number, text: string): Literal {
    return { kind: 'literal', start, end, text };
}

function mkRegexp(start: number, end: number, text: string): Regexp {
    return { kind: 'regexp', start, end, text };
}

function mkText(start: number, end: number, text: string): Text {
    return { kind: 'text', start, end, text };
}

function mkNot(start: number, end: number, pattern: SimplePattern): Not {
    return { kind: 'not', start, end, pattern };
}

function mkRep(pattern: SimplePattern, modifier: '*' | '+' | '?' | undefined): Rep {
    return { kind: 'rep', pattern, modifier };
}

function mkPattern(seq: Rep[], mapper: Text | undefined): Pattern {
    return { kind: 'pattern', seq, mapper };
}

function mkRule(id: Id, type: Id | undefined, alternatives: Pattern[]): Rule {
    return { kind: 'rule', id, type, alternatives };
}

function mkPasta(text: Text): Pasta {
    return { kind: 'pasta', text };
}

function mkGrammar(pasta: Pasta[], rules: Rule[]): Grammar {
    return { kind: 'grammar', pasta, rules };
}


}%

`lit` = lit ws                              %% { text: $0, start, end: start + $0.length }
      ;

ws = /\s*/
   ;

id = /[_a-zA-Z][_a-zA-Z0-9]*/ ws            %% mkId(start, start + $0.length, $0)
   ;

literalPart = '\\\''                        %% '\''
            | not('\'')
            ;

literal = '\'' literalPart* `\'`            %% mkLiteral(start, $2.end, $1.join(''))
        ;

rxPart = '\\/'
       | not('/')
       ;

rxModifier = 'i'
           | 's'
           ;

regex = '/' rxPart* '/' rxModifier* ws      %% mkRegexp(start, end - $4.length, text().slice(0, -$4.length))
       ;

macroPattern = literal
             | regex
             | any
             | id
             ;

not = `not` `(` macroPattern `)`            %% mkNot(start, $3.end, $2)
    ;

look = `look` `(` macroPattern `)`          %% mkLook(start, $3.end, $2)
     ;

any = `.`                                   %% mkAny(start, $1.end)
    ;

simplePattern = literal
              | regex
              | any
              | not
              | id
              ;

repModifier = `?`
            | `*`
            | `+`
            ;

rep = simplePattern repModifier?                    %% mkRep($0, $1)
    ;

seq = rep ws                                        %% $0
    ;

mapperText = not('\n')*                             %% mkText(start, end, text().trim())
           ;

lookMapper = '\%\%' mapperText                      %% $1
           ;

pattern = seq+ lookMapper? ws                       %% mkPattern($0, $1)
        ;

alternatives = pattern (`|` !pattern)*              %% [ $0, ...$1 ]
            ;

type = `:` id                                       %% $1
     ;

rule = id type? `=` alternatives `;`                %% mkRule($0, $1, $3)
     ;

pastaText = not('}%')*                              %% mkText(start, end, text())
          ;

pasta = '%\{' pastaText '}%' ws                     %% mkPasta($1)
      ;

eof = /$/
    ;

grammar = ws pasta* rule* ws eof                    %% mkGrammar($1, $2)
        ;
