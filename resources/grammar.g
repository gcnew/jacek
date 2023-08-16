
%{

export type SimplePattern = Literal | Regexp | Any | Apply | Id | Template | Group | Variable

export type Any        = { kind: 'any',      start: number, end: number }
export type Id         = { kind: 'id',       start: number, end: number, text: string }
export type Template   = { kind: 'template', start: number, end: number, text: string }
export type Literal    = { kind: 'literal',  start: number, end: number, text: string }
export type Regexp     = { kind: 'regexp',   start: number, end: number, text: string }
export type Text       = { kind: 'text',     start: number, end: number, text: string }
export type Variable   = { kind: 'variable', start: number, end: number, text: string }

export type Group = {
    kind: 'group',
    start: number,
    end: number,
    patterns: {
        important: boolean,
        pattern: Rep
    }[]
}

export type Lit<S>     = { start: number, end: number, text: S }

export type Apply = {
    kind: 'apply',
    start: number,
    end: number,
    func: Id,
    pattern: SimplePattern
}

export type Rep         = { kind: 'rep', pattern:  SimplePattern, modifier?: Lit<'*' | '+' | '?'> }

export type Alternative = { kind: 'alt', patterns: Rep[],         mapper?: Text }

export type Rule        = { kind: 'rule',         id: Id, template?: Id, type?: Id, alternatives: Alternative[] }
                        | { kind: 'templateRule',         template:  Id, type?: Id, alternatives: Alternative[] }

export type Pasta    = { kind: 'pasta',   text: Text }
export type Grammar  = { kind: 'grammar', pasta: Pasta[], rules: Rule[] }

function mkAny(start: number, end: number): Any {
    return { kind: 'any', start, end };
}

function mkId(start: number, end: number, text: string): Id {
    return { kind: 'id', start, end, text };
}

function mkLiteral(start: number, end: number, text: string): Literal {
    return { kind: 'literal', start, end, text };
}

function mkTemplate(start: number, end: number, text: string): Template {
    return { kind: 'template', start, end, text };
}

function mkRegexp(start: number, end: number, text: string): Regexp {
    return { kind: 'regexp', start, end, text };
}

function mkText(start: number, end: number, text: string): Text {
    return { kind: 'text', start, end, text };
}

function mkVariable(start: number, end: number, text: string): Variable {
    return { kind: 'variable', start, end, text };
}

function mkGroup(start: number, end: number, patterns: Group['patterns']): Group {
    return { kind: 'group', start, end, patterns };
}

function mkApply(end: number, func: Id, pattern: SimplePattern): Apply {
    return { kind: 'apply', start: func.start, end, func, pattern };
}

function mkRep(pattern: SimplePattern, modifier: Lit<'*' | '+' | '?'> | undefined): Rep {
    return { kind: 'rep', pattern, modifier };
}

function mkAlternative(patterns: Rep[], mapper: Text | undefined): Alternative {
    return { kind: 'alt', patterns, mapper };
}

function mkRule(id: Id, template: Id | undefined, type: Id | undefined, alternatives: Alternative[]): Rule {
    return { kind: 'rule', id, template, type, alternatives };
}

function mkTemplateRule(template: Id, type: Id | undefined, alternatives: Alternative[]): Rule {
    return { kind: 'templateRule', template, type, alternatives };
}

function mkPasta(text: Text): Pasta {
    return { kind: 'pasta', text };
}

function mkGrammar(pasta: Pasta[], rules: Rule[]): Grammar {
    return { kind: 'grammar', pasta, rules };
}

function notWsPreceeding(input: string, start: number): $Match<true> {
    if (start >= input.length || start < 1 || /\s/.test(input[start - 1])) {
        return { kind: 'left', value: { kind: 'no_match', expected: '<space>', idx: start } } as const;
    }

    return { kind: 'right', value: [start, true] };
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

literal = '\'' literalPart* `'`             %% mkLiteral(start, $2.end, $1.join(''))
        ;

templatePart = '\\`'                        %% '`'
             | not('`')
             ;

template = '`' templatePart* `\``           %% mkTemplate(start, $2.end, $1.join(''))
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
             | template
             ;

invokation = notWsPreceeding `(` macroPattern `)`   %% { pattern: $2, end: $3.end }
           ;

any = `.`                                           %% mkAny($0.start, $0.end)
    ;

simplePattern: SimplePattern
              = literal
              | regex
              | any
              | template
              | `(` ('!'? rep)+ `)`                 %% mkGroup($0.start, $2.end, $1.map(([imp, pattern]) => ({ important: !imp, pattern })))
              | '$' /\d+/ ws                        %% mkVariable(start, start + $1.length + 1, $1)
              | id invokation?                      %% $1 ? mkApply($1.end, $0, $1.pattern) : $0
              ;

repModifier = `?`
            | `*`
            | `+`
            ;

rep = simplePattern repModifier?                    %% mkRep($0, $1)
    ;

mapperText = not('\n')*                             %% mkText(start, end, text().trim())
           ;

alternative = rep+ ('\%\%' !mapperText)? ws         %% mkAlternative($0, $1)
            ;

alternatives = alternative (`|` !alternative)*      %% [ $0, ...$1 ]
            ;

type = `:` id                                       %% $1
     ;

templateId = '`' id '`' ws                          %% $1
           ;

rule = id templateId? type? `=` alternatives `;`    %% mkRule($0, $1, $2, $4)
     |    templateId  type? `=` alternatives `;`    %% mkTemplateRule($0, $1, $3)
     ;

pastaText = not('}%')*                              %% mkText(start, end, text())
          ;

pasta = '%\{' pastaText '}%' ws                     %% mkPasta($1)
      ;

eof = /$/
    ;

grammar = ws pasta* rule* ws eof                    %% mkGrammar($1, $2)
        ;
