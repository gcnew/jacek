export type SimplePattern = Literal | Regexp | Any | Apply | Id | Template | Group | Variable

export type Any        = { kind: 'any',      start: number, end: number }
export type Id         = { kind: 'id',       start: number, end: number, text: string }
export type Literal    = { kind: 'literal',  start: number, end: number, text: string }
export type Regexp     = { kind: 'regexp',   start: number, end: number, text: string }
export type Text       = { kind: 'text',     start: number, end: number, text: string }
export type Variable   = { kind: 'variable', start: number, end: number, text: string }
export type Template   = { kind: 'template', start: number, end: number, text: string, func?: Id }

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

export type Rule        = { kind: 'rule',         id:  Id,               type?: Id, alternatives: Alternative[] }
                        | { kind: 'templateRule', id?: Id, template: Id, type?: Id, alternatives: Alternative[] }

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

function mkTemplate(start: number, end: number, func: Id | undefined, text: string): Template {
    return { kind: 'template', start, end, func, text };
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

function mkRule(id: Id, type: Id | undefined, alternatives: Alternative[]): Rule {
    return { kind: 'rule', id, type, alternatives };
}

function mkTemplateRule(id: Id | undefined, template: Id, type: Id | undefined, alternatives: Alternative[]): Rule {
    return { kind: 'templateRule', id, template, type, alternatives };
}

function mkPasta(text: Text): Pasta {
    return { kind: 'pasta', text };
}

function mkGrammar(pasta: Pasta[], rules: Rule[]): Grammar {
    return { kind: 'grammar', pasta, rules };
}

function notWsPreceeding(input: string, start: number): $Match<true> {
    if (start >= input.length || start < 1 || /\s/.test(input[start - 1])) {
        return $fail('<no space>', start);
    }

    return $success(true, start);
}

function lit_macro<S extends string>(lit: S, input: string, start: number) {
    
    let end = start;

    
    const $0 = lit;
    if (!input.startsWith($0, end)) {
        return { kind: 'left', value: { kind: 'no_match', expected: $0, idx: end } } as const;
    }

    end += $0.length;

    const $tmp$1 = ws(input, end);
    if ($tmp$1.kind === 'left') {
        return $tmp$1;
    }
    const [$end1, $1] = $tmp$1.value;
    end = $end1;

    const text = () => input.substring(start, end);
    const $mapped = { text: $0, start, end: start + $0.length };
    return { kind: 'right', value: [ end, $mapped ] } as const;
}


export function ws(input: string, start: number) {
    
    let end = start;

    
    const $tmp$0 = /^\s*/.exec(input.substring(end));

    if (!$tmp$0) {
        return { kind: 'left', value: { kind: 'no_match', expected: /\s*/, idx: end } } as const;
    }

    const $0 = $tmp$0[0];
    end += $0.length;

    const text = () => input.substring(start, end);
    const $mapped = $0;
    return { kind: 'right', value: [ end, $mapped ] } as const;
}


export function id(input: string, start: number) {
    
    let end = start;

    
    const $tmp$0 = /^[_a-zA-Z][_a-zA-Z0-9]*/.exec(input.substring(end));

    if (!$tmp$0) {
        return { kind: 'left', value: { kind: 'no_match', expected: /[_a-zA-Z][_a-zA-Z0-9]*/, idx: end } } as const;
    }

    const $0 = $tmp$0[0];
    end += $0.length;

    const $tmp$1 = ws(input, end);
    if ($tmp$1.kind === 'left') {
        return $tmp$1;
    }
    const [$end1, $1] = $tmp$1.value;
    end = $end1;

    const text = () => input.substring(start, end);
    const $mapped = mkId(start, start + $0.length, $0);
    return { kind: 'right', value: [ end, $mapped ] } as const;
}


export function literalPart(input: string, start: number) {
    
    let end = start;
    
    const $cc0 = (input: string, start: number) => {
        
        let end = start;

        
        const $0 = '\\\'';
        if (!input.startsWith($0, end)) {
            return { kind: 'left', value: { kind: 'no_match', expected: $0, idx: end } } as const;
        }

        end += $0.length;

        const text = () => input.substring(start, end);
        const $mapped = '\'';
        return { kind: 'right', value: [ end, $mapped ] } as const;
    };
    const $tmp$0 = $cc0(input, start);
    if ($tmp$0.kind === 'right') {
        return $tmp$0;
    }
    if ($tmp$0.kind === 'left' && !($tmp$0.value.kind === 'no_match' && $tmp$0.value.idx === end)) {
        return $tmp$0;
    }

    const $cc1 = (input: string, start: number) => {
        
        let end = start;

        
        const $cc0 = (input: string, start: number, end: number) => {
            
            const $0 = '\'';
            if (!input.startsWith($0, end)) {
                return { kind: 'left', value: { kind: 'no_match', expected: $0, idx: end } } as const;
            }

            end += $0.length;
            return { kind: 'right', value: $0 } as const;
        };
        if ($cc0(input, end, end).kind === 'right') {
            return { kind: 'left', value: { kind: 'no_match', expected: '<not>', idx: end } } as const;
        }
        if (input.length === end) {
            return { kind: 'left', value: { kind: 'no_match', expected: '<not>', idx: end } } as const;
        }
        const $0 = input[end];
        end++;

        const text = () => input.substring(start, end);
        const $mapped = $0;
        return { kind: 'right', value: [ end, $mapped ] } as const;
    };
    const $tmp$1 = $cc1(input, start);
    if ($tmp$1.kind === 'right') {
        return $tmp$1;
    }
    if ($tmp$1.kind === 'left' && !($tmp$1.value.kind === 'no_match' && $tmp$1.value.idx === end)) {
        return $tmp$1;
    }
    return $tmp$1;
}


export function literal(input: string, start: number) {
    
    let end = start;

    
    const $0 = '\'';
    if (!input.startsWith($0, end)) {
        return { kind: 'left', value: { kind: 'no_match', expected: $0, idx: end } } as const;
    }

    end += $0.length;

    
    const $cc1 = (input: string, start: number) => {
        
        const $tmp$1 = literalPart(input, end);
        if ($tmp$1.kind === 'left') {
            return $tmp$1;
        }
        const [$end1, $1] = $tmp$1.value;
        end = $end1;
        return { kind: 'right', value: $1 } as const;
    };
    let $1 = [];
    while (true) {
        const $tmp$1 = $cc1(input, end);
        if ($tmp$1.kind === 'left') {
            if (!($tmp$1.value.kind === 'no_match' && $tmp$1.value.idx === end)) {
                return $tmp$1;
            }
            break;
        }
        $1.push($tmp$1.value);
    }

    const $tmp$2 = lit_macro(`'`, input, end);
    if ($tmp$2.kind === 'left') {
        return $tmp$2;
    }
    const [$end2, $2] = $tmp$2.value;
    end = $end2;

    const text = () => input.substring(start, end);
    const $mapped = mkLiteral(start, $2.end, $1.join(''));
    return { kind: 'right', value: [ end, $mapped ] } as const;
}


export function templatePart(input: string, start: number) {
    
    let end = start;
    
    const $cc0 = (input: string, start: number) => {
        
        let end = start;

        
        const $0 = '\\`';
        if (!input.startsWith($0, end)) {
            return { kind: 'left', value: { kind: 'no_match', expected: $0, idx: end } } as const;
        }

        end += $0.length;

        const text = () => input.substring(start, end);
        const $mapped = '`';
        return { kind: 'right', value: [ end, $mapped ] } as const;
    };
    const $tmp$0 = $cc0(input, start);
    if ($tmp$0.kind === 'right') {
        return $tmp$0;
    }
    if ($tmp$0.kind === 'left' && !($tmp$0.value.kind === 'no_match' && $tmp$0.value.idx === end)) {
        return $tmp$0;
    }

    const $cc1 = (input: string, start: number) => {
        
        let end = start;

        
        const $cc0 = (input: string, start: number, end: number) => {
            
            const $0 = '`';
            if (!input.startsWith($0, end)) {
                return { kind: 'left', value: { kind: 'no_match', expected: $0, idx: end } } as const;
            }

            end += $0.length;
            return { kind: 'right', value: $0 } as const;
        };
        if ($cc0(input, end, end).kind === 'right') {
            return { kind: 'left', value: { kind: 'no_match', expected: '<not>', idx: end } } as const;
        }
        if (input.length === end) {
            return { kind: 'left', value: { kind: 'no_match', expected: '<not>', idx: end } } as const;
        }
        const $0 = input[end];
        end++;

        const text = () => input.substring(start, end);
        const $mapped = $0;
        return { kind: 'right', value: [ end, $mapped ] } as const;
    };
    const $tmp$1 = $cc1(input, start);
    if ($tmp$1.kind === 'right') {
        return $tmp$1;
    }
    if ($tmp$1.kind === 'left' && !($tmp$1.value.kind === 'no_match' && $tmp$1.value.idx === end)) {
        return $tmp$1;
    }
    return $tmp$1;
}


export function template(input: string, start: number) {
    
    let end = start;

    
    
    const $cc0 = (input: string, start: number) => {
        
        
        const $cc0 = (input: string, start: number) => {
            let end = start;
            
            const $tmp$0 = id(input, end);
            if ($tmp$0.kind === 'left') {
                return $tmp$0;
            }
            const [$end0, $0] = $tmp$0.value;
            end = $end0;

            const $tmp$1 = notWsPreceeding(input, end);
            if ($tmp$1.kind === 'left') {
                return $tmp$1;
            }
            const [$end1, $1] = $tmp$1.value;
            end = $end1;
            return { kind: 'right', value: [ end, $0 ] } as const;
        };
        
        const $tmp$0 = $cc0(input, end);
        if ($tmp$0.kind === 'left') {
            return $tmp$0;
        }
        const [$end0, $0] = $tmp$0.value;
        end = $end0;
        return { kind: 'right', value: $0 } as const;
    };
    let $0;
    const $tmp$0 = $cc0(input, end);
    if ($tmp$0.kind === 'left') {
        if (!($tmp$0.value.kind === 'no_match' && $tmp$0.value.idx === end)) {
            return $tmp$0;
        }
        $0 = undefined;
    } else {
        $0 = $tmp$0.value;
    }

    const $1 = '`';
    if (!input.startsWith($1, end)) {
        return { kind: 'left', value: { kind: 'no_match', expected: $1, idx: end } } as const;
    }

    end += $1.length;

    
    const $cc2 = (input: string, start: number) => {
        
        const $tmp$2 = templatePart(input, end);
        if ($tmp$2.kind === 'left') {
            return $tmp$2;
        }
        const [$end2, $2] = $tmp$2.value;
        end = $end2;
        return { kind: 'right', value: $2 } as const;
    };
    let $2 = [];
    while (true) {
        const $tmp$2 = $cc2(input, end);
        if ($tmp$2.kind === 'left') {
            if (!($tmp$2.value.kind === 'no_match' && $tmp$2.value.idx === end)) {
                return $tmp$2;
            }
            break;
        }
        $2.push($tmp$2.value);
    }

    const $tmp$3 = lit_macro(`\``, input, end);
    if ($tmp$3.kind === 'left') {
        return $tmp$3;
    }
    const [$end3, $3] = $tmp$3.value;
    end = $end3;

    const text = () => input.substring(start, end);
    const $mapped = mkTemplate(start, $3.end, $0, $2.join(''));
    return { kind: 'right', value: [ end, $mapped ] } as const;
}


export function rxPart(input: string, start: number) {
    
    let end = start;
    
    const $cc0 = (input: string, start: number) => {
        
        let end = start;

        
        const $0 = '\\/';
        if (!input.startsWith($0, end)) {
            return { kind: 'left', value: { kind: 'no_match', expected: $0, idx: end } } as const;
        }

        end += $0.length;

        const text = () => input.substring(start, end);
        const $mapped = $0;
        return { kind: 'right', value: [ end, $mapped ] } as const;
    };
    const $tmp$0 = $cc0(input, start);
    if ($tmp$0.kind === 'right') {
        return $tmp$0;
    }
    if ($tmp$0.kind === 'left' && !($tmp$0.value.kind === 'no_match' && $tmp$0.value.idx === end)) {
        return $tmp$0;
    }

    const $cc1 = (input: string, start: number) => {
        
        let end = start;

        
        const $cc0 = (input: string, start: number, end: number) => {
            
            const $0 = '/';
            if (!input.startsWith($0, end)) {
                return { kind: 'left', value: { kind: 'no_match', expected: $0, idx: end } } as const;
            }

            end += $0.length;
            return { kind: 'right', value: $0 } as const;
        };
        if ($cc0(input, end, end).kind === 'right') {
            return { kind: 'left', value: { kind: 'no_match', expected: '<not>', idx: end } } as const;
        }
        if (input.length === end) {
            return { kind: 'left', value: { kind: 'no_match', expected: '<not>', idx: end } } as const;
        }
        const $0 = input[end];
        end++;

        const text = () => input.substring(start, end);
        const $mapped = $0;
        return { kind: 'right', value: [ end, $mapped ] } as const;
    };
    const $tmp$1 = $cc1(input, start);
    if ($tmp$1.kind === 'right') {
        return $tmp$1;
    }
    if ($tmp$1.kind === 'left' && !($tmp$1.value.kind === 'no_match' && $tmp$1.value.idx === end)) {
        return $tmp$1;
    }
    return $tmp$1;
}


export function rxModifier(input: string, start: number) {
    
    let end = start;
    
    const $cc0 = (input: string, start: number) => {
        
        let end = start;

        
        const $0 = 'i';
        if (!input.startsWith($0, end)) {
            return { kind: 'left', value: { kind: 'no_match', expected: $0, idx: end } } as const;
        }

        end += $0.length;

        const text = () => input.substring(start, end);
        const $mapped = $0;
        return { kind: 'right', value: [ end, $mapped ] } as const;
    };
    const $tmp$0 = $cc0(input, start);
    if ($tmp$0.kind === 'right') {
        return $tmp$0;
    }
    if ($tmp$0.kind === 'left' && !($tmp$0.value.kind === 'no_match' && $tmp$0.value.idx === end)) {
        return $tmp$0;
    }

    const $cc1 = (input: string, start: number) => {
        
        let end = start;

        
        const $0 = 's';
        if (!input.startsWith($0, end)) {
            return { kind: 'left', value: { kind: 'no_match', expected: $0, idx: end } } as const;
        }

        end += $0.length;

        const text = () => input.substring(start, end);
        const $mapped = $0;
        return { kind: 'right', value: [ end, $mapped ] } as const;
    };
    const $tmp$1 = $cc1(input, start);
    if ($tmp$1.kind === 'right') {
        return $tmp$1;
    }
    if ($tmp$1.kind === 'left' && !($tmp$1.value.kind === 'no_match' && $tmp$1.value.idx === end)) {
        return $tmp$1;
    }
    return $tmp$1;
}


export function regex(input: string, start: number) {
    
    let end = start;

    
    const $0 = '/';
    if (!input.startsWith($0, end)) {
        return { kind: 'left', value: { kind: 'no_match', expected: $0, idx: end } } as const;
    }

    end += $0.length;

    
    const $cc1 = (input: string, start: number) => {
        
        const $tmp$1 = rxPart(input, end);
        if ($tmp$1.kind === 'left') {
            return $tmp$1;
        }
        const [$end1, $1] = $tmp$1.value;
        end = $end1;
        return { kind: 'right', value: $1 } as const;
    };
    let $1 = [];
    while (true) {
        const $tmp$1 = $cc1(input, end);
        if ($tmp$1.kind === 'left') {
            if (!($tmp$1.value.kind === 'no_match' && $tmp$1.value.idx === end)) {
                return $tmp$1;
            }
            break;
        }
        $1.push($tmp$1.value);
    }

    const $2 = '/';
    if (!input.startsWith($2, end)) {
        return { kind: 'left', value: { kind: 'no_match', expected: $2, idx: end } } as const;
    }

    end += $2.length;

    
    const $cc3 = (input: string, start: number) => {
        
        const $tmp$3 = rxModifier(input, end);
        if ($tmp$3.kind === 'left') {
            return $tmp$3;
        }
        const [$end3, $3] = $tmp$3.value;
        end = $end3;
        return { kind: 'right', value: $3 } as const;
    };
    let $3 = [];
    while (true) {
        const $tmp$3 = $cc3(input, end);
        if ($tmp$3.kind === 'left') {
            if (!($tmp$3.value.kind === 'no_match' && $tmp$3.value.idx === end)) {
                return $tmp$3;
            }
            break;
        }
        $3.push($tmp$3.value);
    }

    const $tmp$4 = ws(input, end);
    if ($tmp$4.kind === 'left') {
        return $tmp$4;
    }
    const [$end4, $4] = $tmp$4.value;
    end = $end4;

    const text = () => input.substring(start, end);
    const $mapped = mkRegexp(start, end - $4.length, text().slice(0, -$4.length));
    return { kind: 'right', value: [ end, $mapped ] } as const;
}


export function macroPattern(input: string, start: number) {
    
    let end = start;
    
    const $cc0 = (input: string, start: number) => {
        
        let end = start;

        
        const $tmp$0 = literal(input, end);
        if ($tmp$0.kind === 'left') {
            return $tmp$0;
        }
        const [$end0, $0] = $tmp$0.value;
        end = $end0;

        const text = () => input.substring(start, end);
        const $mapped = $0;
        return { kind: 'right', value: [ end, $mapped ] } as const;
    };
    const $tmp$0 = $cc0(input, start);
    if ($tmp$0.kind === 'right') {
        return $tmp$0;
    }
    if ($tmp$0.kind === 'left' && !($tmp$0.value.kind === 'no_match' && $tmp$0.value.idx === end)) {
        return $tmp$0;
    }

    const $cc1 = (input: string, start: number) => {
        
        let end = start;

        
        const $tmp$0 = regex(input, end);
        if ($tmp$0.kind === 'left') {
            return $tmp$0;
        }
        const [$end0, $0] = $tmp$0.value;
        end = $end0;

        const text = () => input.substring(start, end);
        const $mapped = $0;
        return { kind: 'right', value: [ end, $mapped ] } as const;
    };
    const $tmp$1 = $cc1(input, start);
    if ($tmp$1.kind === 'right') {
        return $tmp$1;
    }
    if ($tmp$1.kind === 'left' && !($tmp$1.value.kind === 'no_match' && $tmp$1.value.idx === end)) {
        return $tmp$1;
    }

    const $cc2 = (input: string, start: number) => {
        
        let end = start;

        
        const $tmp$0 = any(input, end);
        if ($tmp$0.kind === 'left') {
            return $tmp$0;
        }
        const [$end0, $0] = $tmp$0.value;
        end = $end0;

        const text = () => input.substring(start, end);
        const $mapped = $0;
        return { kind: 'right', value: [ end, $mapped ] } as const;
    };
    const $tmp$2 = $cc2(input, start);
    if ($tmp$2.kind === 'right') {
        return $tmp$2;
    }
    if ($tmp$2.kind === 'left' && !($tmp$2.value.kind === 'no_match' && $tmp$2.value.idx === end)) {
        return $tmp$2;
    }

    const $cc3 = (input: string, start: number) => {
        
        let end = start;

        
        const $cc0 = (input: string, start: number, end: number) => {
            
            const $tmp$0 = template(input, end);
            if ($tmp$0.kind === 'left') {
                return $tmp$0;
            }
            const [$end0, $0] = $tmp$0.value;
            end = $end0;
            return { kind: 'right', value: [ end, $0 ] } as const;
        };
        const $tmp$0 = $cc0(input, end, end);
        if ($tmp$0.kind === 'left') {
            return { kind: 'left', value: { kind: 'no_match', expected: '<try>', idx: end } } as const;
        }
        const [$end0, $0] = $tmp$0.value;
        end = $end0;

        const text = () => input.substring(start, end);
        const $mapped = $0;
        return { kind: 'right', value: [ end, $mapped ] } as const;
    };
    const $tmp$3 = $cc3(input, start);
    if ($tmp$3.kind === 'right') {
        return $tmp$3;
    }
    if ($tmp$3.kind === 'left' && !($tmp$3.value.kind === 'no_match' && $tmp$3.value.idx === end)) {
        return $tmp$3;
    }

    const $cc4 = (input: string, start: number) => {
        
        let end = start;

        
        const $tmp$0 = id(input, end);
        if ($tmp$0.kind === 'left') {
            return $tmp$0;
        }
        const [$end0, $0] = $tmp$0.value;
        end = $end0;

        const text = () => input.substring(start, end);
        const $mapped = $0;
        return { kind: 'right', value: [ end, $mapped ] } as const;
    };
    const $tmp$4 = $cc4(input, start);
    if ($tmp$4.kind === 'right') {
        return $tmp$4;
    }
    if ($tmp$4.kind === 'left' && !($tmp$4.value.kind === 'no_match' && $tmp$4.value.idx === end)) {
        return $tmp$4;
    }
    return $tmp$4;
}


export function invokation(input: string, start: number) {
    
    let end = start;

    
    const $tmp$0 = notWsPreceeding(input, end);
    if ($tmp$0.kind === 'left') {
        return $tmp$0;
    }
    const [$end0, $0] = $tmp$0.value;
    end = $end0;

    const $tmp$1 = lit_macro(`(`, input, end);
    if ($tmp$1.kind === 'left') {
        return $tmp$1;
    }
    const [$end1, $1] = $tmp$1.value;
    end = $end1;

    const $tmp$2 = macroPattern(input, end);
    if ($tmp$2.kind === 'left') {
        return $tmp$2;
    }
    const [$end2, $2] = $tmp$2.value;
    end = $end2;

    const $tmp$3 = lit_macro(`)`, input, end);
    if ($tmp$3.kind === 'left') {
        return $tmp$3;
    }
    const [$end3, $3] = $tmp$3.value;
    end = $end3;

    const text = () => input.substring(start, end);
    const $mapped = { pattern: $2, end: $3.end };
    return { kind: 'right', value: [ end, $mapped ] } as const;
}


export function any(input: string, start: number) {
    
    let end = start;

    
    const $tmp$0 = lit_macro(`.`, input, end);
    if ($tmp$0.kind === 'left') {
        return $tmp$0;
    }
    const [$end0, $0] = $tmp$0.value;
    end = $end0;

    const text = () => input.substring(start, end);
    const $mapped = mkAny($0.start, $0.end);
    return { kind: 'right', value: [ end, $mapped ] } as const;
}


export function variable(input: string, start: number) {
    
    let end = start;

    
    const $0 = '$';
    if (!input.startsWith($0, end)) {
        return { kind: 'left', value: { kind: 'no_match', expected: $0, idx: end } } as const;
    }

    end += $0.length;

    const $tmp$1 = /^\d+/.exec(input.substring(end));

    if (!$tmp$1) {
        return { kind: 'left', value: { kind: 'no_match', expected: /\d+/, idx: end } } as const;
    }

    const $1 = $tmp$1[0];
    end += $1.length;

    const $tmp$2 = ws(input, end);
    if ($tmp$2.kind === 'left') {
        return $tmp$2;
    }
    const [$end2, $2] = $tmp$2.value;
    end = $end2;

    const text = () => input.substring(start, end);
    const $mapped = mkVariable(start, start + $1.length + 1, $1);
    return { kind: 'right', value: [ end, $mapped ] } as const;
}


export function simplePattern(input: string, start: number): $Match<SimplePattern> {
    
    let end = start;
    
    const $cc0 = (input: string, start: number) => {
        
        let end = start;

        
        const $tmp$0 = literal(input, end);
        if ($tmp$0.kind === 'left') {
            return $tmp$0;
        }
        const [$end0, $0] = $tmp$0.value;
        end = $end0;

        const text = () => input.substring(start, end);
        const $mapped = $0;
        return { kind: 'right', value: [ end, $mapped ] } as const;
    };
    const $tmp$0 = $cc0(input, start);
    if ($tmp$0.kind === 'right') {
        return $tmp$0;
    }
    if ($tmp$0.kind === 'left' && !($tmp$0.value.kind === 'no_match' && $tmp$0.value.idx === end)) {
        return $tmp$0;
    }

    const $cc1 = (input: string, start: number) => {
        
        let end = start;

        
        const $tmp$0 = regex(input, end);
        if ($tmp$0.kind === 'left') {
            return $tmp$0;
        }
        const [$end0, $0] = $tmp$0.value;
        end = $end0;

        const text = () => input.substring(start, end);
        const $mapped = $0;
        return { kind: 'right', value: [ end, $mapped ] } as const;
    };
    const $tmp$1 = $cc1(input, start);
    if ($tmp$1.kind === 'right') {
        return $tmp$1;
    }
    if ($tmp$1.kind === 'left' && !($tmp$1.value.kind === 'no_match' && $tmp$1.value.idx === end)) {
        return $tmp$1;
    }

    const $cc2 = (input: string, start: number) => {
        
        let end = start;

        
        const $tmp$0 = any(input, end);
        if ($tmp$0.kind === 'left') {
            return $tmp$0;
        }
        const [$end0, $0] = $tmp$0.value;
        end = $end0;

        const text = () => input.substring(start, end);
        const $mapped = $0;
        return { kind: 'right', value: [ end, $mapped ] } as const;
    };
    const $tmp$2 = $cc2(input, start);
    if ($tmp$2.kind === 'right') {
        return $tmp$2;
    }
    if ($tmp$2.kind === 'left' && !($tmp$2.value.kind === 'no_match' && $tmp$2.value.idx === end)) {
        return $tmp$2;
    }

    const $cc3 = (input: string, start: number) => {
        
        let end = start;

        
        const $cc0 = (input: string, start: number, end: number) => {
            
            const $tmp$0 = template(input, end);
            if ($tmp$0.kind === 'left') {
                return $tmp$0;
            }
            const [$end0, $0] = $tmp$0.value;
            end = $end0;
            return { kind: 'right', value: [ end, $0 ] } as const;
        };
        const $tmp$0 = $cc0(input, end, end);
        if ($tmp$0.kind === 'left') {
            return { kind: 'left', value: { kind: 'no_match', expected: '<try>', idx: end } } as const;
        }
        const [$end0, $0] = $tmp$0.value;
        end = $end0;

        const text = () => input.substring(start, end);
        const $mapped = $0;
        return { kind: 'right', value: [ end, $mapped ] } as const;
    };
    const $tmp$3 = $cc3(input, start);
    if ($tmp$3.kind === 'right') {
        return $tmp$3;
    }
    if ($tmp$3.kind === 'left' && !($tmp$3.value.kind === 'no_match' && $tmp$3.value.idx === end)) {
        return $tmp$3;
    }

    const $cc4 = (input: string, start: number) => {
        
        let end = start;

        
        const $tmp$0 = variable(input, end);
        if ($tmp$0.kind === 'left') {
            return $tmp$0;
        }
        const [$end0, $0] = $tmp$0.value;
        end = $end0;

        const text = () => input.substring(start, end);
        const $mapped = $0;
        return { kind: 'right', value: [ end, $mapped ] } as const;
    };
    const $tmp$4 = $cc4(input, start);
    if ($tmp$4.kind === 'right') {
        return $tmp$4;
    }
    if ($tmp$4.kind === 'left' && !($tmp$4.value.kind === 'no_match' && $tmp$4.value.idx === end)) {
        return $tmp$4;
    }

    const $cc5 = (input: string, start: number) => {
        
        let end = start;

        
        const $tmp$0 = lit_macro(`(`, input, end);
        if ($tmp$0.kind === 'left') {
            return $tmp$0;
        }
        const [$end0, $0] = $tmp$0.value;
        end = $end0;

        
        const $cc1 = (input: string, start: number) => {
            
            
            const $cc1 = (input: string, start: number) => {
                let end = start;
                
                
                const $cc0 = (input: string, start: number) => {
                    
                    const $0 = '!';
                    if (!input.startsWith($0, end)) {
                        return { kind: 'left', value: { kind: 'no_match', expected: $0, idx: end } } as const;
                    }

                    end += $0.length;
                    return { kind: 'right', value: $0 } as const;
                };
                let $0;
                const $tmp$0 = $cc0(input, end);
                if ($tmp$0.kind === 'left') {
                    if (!($tmp$0.value.kind === 'no_match' && $tmp$0.value.idx === end)) {
                        return $tmp$0;
                    }
                    $0 = undefined;
                } else {
                    $0 = $tmp$0.value;
                }

                const $tmp$1 = rep(input, end);
                if ($tmp$1.kind === 'left') {
                    return $tmp$1;
                }
                const [$end1, $1] = $tmp$1.value;
                end = $end1;
                return { kind: 'right', value: [ end, [ $0, $1 ] ] } as const;
            };
            
            const $tmp$1 = $cc1(input, end);
            if ($tmp$1.kind === 'left') {
                return $tmp$1;
            }
            const [$end1, $1] = $tmp$1.value;
            end = $end1;
            return { kind: 'right', value: $1 } as const;
        };
        const $tmp$1_1 = $cc1(input, end);
        if ($tmp$1_1.kind === 'left') {
            return $tmp$1_1;
        }
        let $1 = [ $tmp$1_1.value ];
        while (true) {
            const $tmp$1 = $cc1(input, end);
            if ($tmp$1.kind === 'left') {
                if (!($tmp$1.value.kind === 'no_match' && $tmp$1.value.idx === end)) {
                    return $tmp$1;
                }
                break;
            }
            $1.push($tmp$1.value);
        }

        const $tmp$2 = lit_macro(`)`, input, end);
        if ($tmp$2.kind === 'left') {
            return $tmp$2;
        }
        const [$end2, $2] = $tmp$2.value;
        end = $end2;

        const text = () => input.substring(start, end);
        const $mapped = mkGroup($0.start, $2.end, $1.map(([imp, pattern]) => ({ important: !!imp, pattern })));
        return { kind: 'right', value: [ end, $mapped ] } as const;
    };
    const $tmp$5 = $cc5(input, start);
    if ($tmp$5.kind === 'right') {
        return $tmp$5;
    }
    if ($tmp$5.kind === 'left' && !($tmp$5.value.kind === 'no_match' && $tmp$5.value.idx === end)) {
        return $tmp$5;
    }

    const $cc6 = (input: string, start: number) => {
        
        let end = start;

        
        const $tmp$0 = id(input, end);
        if ($tmp$0.kind === 'left') {
            return $tmp$0;
        }
        const [$end0, $0] = $tmp$0.value;
        end = $end0;

        
        const $cc1 = (input: string, start: number) => {
            
            const $tmp$1 = invokation(input, end);
            if ($tmp$1.kind === 'left') {
                return $tmp$1;
            }
            const [$end1, $1] = $tmp$1.value;
            end = $end1;
            return { kind: 'right', value: $1 } as const;
        };
        let $1;
        const $tmp$1 = $cc1(input, end);
        if ($tmp$1.kind === 'left') {
            if (!($tmp$1.value.kind === 'no_match' && $tmp$1.value.idx === end)) {
                return $tmp$1;
            }
            $1 = undefined;
        } else {
            $1 = $tmp$1.value;
        }

        const text = () => input.substring(start, end);
        const $mapped = $1 ? mkApply($1.end, $0, $1.pattern) : $0;
        return { kind: 'right', value: [ end, $mapped ] } as const;
    };
    const $tmp$6 = $cc6(input, start);
    if ($tmp$6.kind === 'right') {
        return $tmp$6;
    }
    if ($tmp$6.kind === 'left' && !($tmp$6.value.kind === 'no_match' && $tmp$6.value.idx === end)) {
        return $tmp$6;
    }
    return $tmp$6;
}


export function repModifier(input: string, start: number) {
    
    let end = start;
    
    const $cc0 = (input: string, start: number) => {
        
        let end = start;

        
        const $tmp$0 = lit_macro(`?`, input, end);
        if ($tmp$0.kind === 'left') {
            return $tmp$0;
        }
        const [$end0, $0] = $tmp$0.value;
        end = $end0;

        const text = () => input.substring(start, end);
        const $mapped = $0;
        return { kind: 'right', value: [ end, $mapped ] } as const;
    };
    const $tmp$0 = $cc0(input, start);
    if ($tmp$0.kind === 'right') {
        return $tmp$0;
    }
    if ($tmp$0.kind === 'left' && !($tmp$0.value.kind === 'no_match' && $tmp$0.value.idx === end)) {
        return $tmp$0;
    }

    const $cc1 = (input: string, start: number) => {
        
        let end = start;

        
        const $tmp$0 = lit_macro(`*`, input, end);
        if ($tmp$0.kind === 'left') {
            return $tmp$0;
        }
        const [$end0, $0] = $tmp$0.value;
        end = $end0;

        const text = () => input.substring(start, end);
        const $mapped = $0;
        return { kind: 'right', value: [ end, $mapped ] } as const;
    };
    const $tmp$1 = $cc1(input, start);
    if ($tmp$1.kind === 'right') {
        return $tmp$1;
    }
    if ($tmp$1.kind === 'left' && !($tmp$1.value.kind === 'no_match' && $tmp$1.value.idx === end)) {
        return $tmp$1;
    }

    const $cc2 = (input: string, start: number) => {
        
        let end = start;

        
        const $tmp$0 = lit_macro(`+`, input, end);
        if ($tmp$0.kind === 'left') {
            return $tmp$0;
        }
        const [$end0, $0] = $tmp$0.value;
        end = $end0;

        const text = () => input.substring(start, end);
        const $mapped = $0;
        return { kind: 'right', value: [ end, $mapped ] } as const;
    };
    const $tmp$2 = $cc2(input, start);
    if ($tmp$2.kind === 'right') {
        return $tmp$2;
    }
    if ($tmp$2.kind === 'left' && !($tmp$2.value.kind === 'no_match' && $tmp$2.value.idx === end)) {
        return $tmp$2;
    }
    return $tmp$2;
}


export function rep(input: string, start: number) {
    
    let end = start;

    
    const $tmp$0 = simplePattern(input, end);
    if ($tmp$0.kind === 'left') {
        return $tmp$0;
    }
    const [$end0, $0] = $tmp$0.value;
    end = $end0;

    
    const $cc1 = (input: string, start: number) => {
        
        const $tmp$1 = repModifier(input, end);
        if ($tmp$1.kind === 'left') {
            return $tmp$1;
        }
        const [$end1, $1] = $tmp$1.value;
        end = $end1;
        return { kind: 'right', value: $1 } as const;
    };
    let $1;
    const $tmp$1 = $cc1(input, end);
    if ($tmp$1.kind === 'left') {
        if (!($tmp$1.value.kind === 'no_match' && $tmp$1.value.idx === end)) {
            return $tmp$1;
        }
        $1 = undefined;
    } else {
        $1 = $tmp$1.value;
    }

    const text = () => input.substring(start, end);
    const $mapped = mkRep($0, $1);
    return { kind: 'right', value: [ end, $mapped ] } as const;
}


export function mapperText(input: string, start: number) {
    
    let end = start;

    
    
    const $cc0 = (input: string, start: number) => {
        
        const $cc0 = (input: string, start: number, end: number) => {
            
            const $0 = '\n';
            if (!input.startsWith($0, end)) {
                return { kind: 'left', value: { kind: 'no_match', expected: $0, idx: end } } as const;
            }

            end += $0.length;
            return { kind: 'right', value: $0 } as const;
        };
        if ($cc0(input, end, end).kind === 'right') {
            return { kind: 'left', value: { kind: 'no_match', expected: '<not>', idx: end } } as const;
        }
        if (input.length === end) {
            return { kind: 'left', value: { kind: 'no_match', expected: '<not>', idx: end } } as const;
        }
        const $0 = input[end];
        end++;
        return { kind: 'right', value: $0 } as const;
    };
    let $0 = [];
    while (true) {
        const $tmp$0 = $cc0(input, end);
        if ($tmp$0.kind === 'left') {
            if (!($tmp$0.value.kind === 'no_match' && $tmp$0.value.idx === end)) {
                return $tmp$0;
            }
            break;
        }
        $0.push($tmp$0.value);
    }

    const text = () => input.substring(start, end);
    const $mapped = mkText(start, end, text().trim());
    return { kind: 'right', value: [ end, $mapped ] } as const;
}


export function mapper(input: string, start: number) {
    
    let end = start;

    
    
    const $cc0 = (input: string, start: number) => {
        
        
        const $cc0 = (input: string, start: number) => {
            let end = start;
            
            const $0 = '\%\%';
            if (!input.startsWith($0, end)) {
                return { kind: 'left', value: { kind: 'no_match', expected: $0, idx: end } } as const;
            }

            end += $0.length;

            const $tmp$1 = mapperText(input, end);
            if ($tmp$1.kind === 'left') {
                return $tmp$1;
            }
            const [$end1, $1] = $tmp$1.value;
            end = $end1;

            const $tmp$2 = ws(input, end);
            if ($tmp$2.kind === 'left') {
                return $tmp$2;
            }
            const [$end2, $2] = $tmp$2.value;
            end = $end2;
            return { kind: 'right', value: [ end, $1 ] } as const;
        };
        
        const $tmp$0 = $cc0(input, end);
        if ($tmp$0.kind === 'left') {
            return $tmp$0;
        }
        const [$end0, $0] = $tmp$0.value;
        end = $end0;
        return { kind: 'right', value: $0 } as const;
    };
    let $0 = [];
    while (true) {
        const $tmp$0 = $cc0(input, end);
        if ($tmp$0.kind === 'left') {
            if (!($tmp$0.value.kind === 'no_match' && $tmp$0.value.idx === end)) {
                return $tmp$0;
            }
            break;
        }
        $0.push($tmp$0.value);
    }

    const text = () => input.substring(start, end);
    const $mapped = $0.length
     ? $0.reduce((acc, x) => mkText(acc.start, x.end, acc.text + '\n' + x.text))
     : undefined;
    return { kind: 'right', value: [ end, $mapped ] } as const;
}


export function alternative(input: string, start: number) {
    
    let end = start;

    
    
    const $cc0 = (input: string, start: number) => {
        
        const $tmp$0 = rep(input, end);
        if ($tmp$0.kind === 'left') {
            return $tmp$0;
        }
        const [$end0, $0] = $tmp$0.value;
        end = $end0;
        return { kind: 'right', value: $0 } as const;
    };
    const $tmp$0_1 = $cc0(input, end);
    if ($tmp$0_1.kind === 'left') {
        return $tmp$0_1;
    }
    let $0 = [ $tmp$0_1.value ];
    while (true) {
        const $tmp$0 = $cc0(input, end);
        if ($tmp$0.kind === 'left') {
            if (!($tmp$0.value.kind === 'no_match' && $tmp$0.value.idx === end)) {
                return $tmp$0;
            }
            break;
        }
        $0.push($tmp$0.value);
    }

    
    const $cc1 = (input: string, start: number) => {
        
        const $tmp$1 = mapper(input, end);
        if ($tmp$1.kind === 'left') {
            return $tmp$1;
        }
        const [$end1, $1] = $tmp$1.value;
        end = $end1;
        return { kind: 'right', value: $1 } as const;
    };
    let $1;
    const $tmp$1 = $cc1(input, end);
    if ($tmp$1.kind === 'left') {
        if (!($tmp$1.value.kind === 'no_match' && $tmp$1.value.idx === end)) {
            return $tmp$1;
        }
        $1 = undefined;
    } else {
        $1 = $tmp$1.value;
    }

    const $tmp$2 = ws(input, end);
    if ($tmp$2.kind === 'left') {
        return $tmp$2;
    }
    const [$end2, $2] = $tmp$2.value;
    end = $end2;

    const text = () => input.substring(start, end);
    const $mapped = mkAlternative($0, $1);
    return { kind: 'right', value: [ end, $mapped ] } as const;
}


export function alternatives(input: string, start: number) {
    
    let end = start;

    
    const $tmp$0 = alternative(input, end);
    if ($tmp$0.kind === 'left') {
        return $tmp$0;
    }
    const [$end0, $0] = $tmp$0.value;
    end = $end0;

    
    const $cc1 = (input: string, start: number) => {
        
        
        const $cc1 = (input: string, start: number) => {
            let end = start;
            
            const $tmp$0 = lit_macro(`|`, input, end);
            if ($tmp$0.kind === 'left') {
                return $tmp$0;
            }
            const [$end0, $0] = $tmp$0.value;
            end = $end0;

            const $tmp$1 = alternative(input, end);
            if ($tmp$1.kind === 'left') {
                return $tmp$1;
            }
            const [$end1, $1] = $tmp$1.value;
            end = $end1;
            return { kind: 'right', value: [ end, $1 ] } as const;
        };
        
        const $tmp$1 = $cc1(input, end);
        if ($tmp$1.kind === 'left') {
            return $tmp$1;
        }
        const [$end1, $1] = $tmp$1.value;
        end = $end1;
        return { kind: 'right', value: $1 } as const;
    };
    let $1 = [];
    while (true) {
        const $tmp$1 = $cc1(input, end);
        if ($tmp$1.kind === 'left') {
            if (!($tmp$1.value.kind === 'no_match' && $tmp$1.value.idx === end)) {
                return $tmp$1;
            }
            break;
        }
        $1.push($tmp$1.value);
    }

    const text = () => input.substring(start, end);
    const $mapped = [ $0, ...$1 ];
    return { kind: 'right', value: [ end, $mapped ] } as const;
}


export function type(input: string, start: number) {
    
    let end = start;

    
    const $tmp$0 = lit_macro(`:`, input, end);
    if ($tmp$0.kind === 'left') {
        return $tmp$0;
    }
    const [$end0, $0] = $tmp$0.value;
    end = $end0;

    const $tmp$1 = id(input, end);
    if ($tmp$1.kind === 'left') {
        return $tmp$1;
    }
    const [$end1, $1] = $tmp$1.value;
    end = $end1;

    const text = () => input.substring(start, end);
    const $mapped = $1;
    return { kind: 'right', value: [ end, $mapped ] } as const;
}


export function templateDef(input: string, start: number) {
    
    let end = start;

    
    
    const $cc0 = (input: string, start: number) => {
        
        const $tmp$0 = id(input, end);
        if ($tmp$0.kind === 'left') {
            return $tmp$0;
        }
        const [$end0, $0] = $tmp$0.value;
        end = $end0;
        return { kind: 'right', value: $0 } as const;
    };
    let $0;
    const $tmp$0 = $cc0(input, end);
    if ($tmp$0.kind === 'left') {
        if (!($tmp$0.value.kind === 'no_match' && $tmp$0.value.idx === end)) {
            return $tmp$0;
        }
        $0 = undefined;
    } else {
        $0 = $tmp$0.value;
    }

    const $1 = '`';
    if (!input.startsWith($1, end)) {
        return { kind: 'left', value: { kind: 'no_match', expected: $1, idx: end } } as const;
    }

    end += $1.length;

    const $tmp$2 = id(input, end);
    if ($tmp$2.kind === 'left') {
        return $tmp$2;
    }
    const [$end2, $2] = $tmp$2.value;
    end = $end2;

    const $3 = '`';
    if (!input.startsWith($3, end)) {
        return { kind: 'left', value: { kind: 'no_match', expected: $3, idx: end } } as const;
    }

    end += $3.length;

    const $tmp$4 = ws(input, end);
    if ($tmp$4.kind === 'left') {
        return $tmp$4;
    }
    const [$end4, $4] = $tmp$4.value;
    end = $end4;

    const text = () => input.substring(start, end);
    const $mapped = ({ id: $0, template: $2 });
    return { kind: 'right', value: [ end, $mapped ] } as const;
}


export function rule(input: string, start: number) {
    
    let end = start;
    
    const $cc0 = (input: string, start: number) => {
        
        let end = start;

        
        const $cc0 = (input: string, start: number, end: number) => {
            
            const $tmp$0 = templateDef(input, end);
            if ($tmp$0.kind === 'left') {
                return $tmp$0;
            }
            const [$end0, $0] = $tmp$0.value;
            end = $end0;
            return { kind: 'right', value: [ end, $0 ] } as const;
        };
        const $tmp$0 = $cc0(input, end, end);
        if ($tmp$0.kind === 'left') {
            return { kind: 'left', value: { kind: 'no_match', expected: '<try>', idx: end } } as const;
        }
        const [$end0, $0] = $tmp$0.value;
        end = $end0;

        
        const $cc1 = (input: string, start: number) => {
            
            const $tmp$1 = type(input, end);
            if ($tmp$1.kind === 'left') {
                return $tmp$1;
            }
            const [$end1, $1] = $tmp$1.value;
            end = $end1;
            return { kind: 'right', value: $1 } as const;
        };
        let $1;
        const $tmp$1 = $cc1(input, end);
        if ($tmp$1.kind === 'left') {
            if (!($tmp$1.value.kind === 'no_match' && $tmp$1.value.idx === end)) {
                return $tmp$1;
            }
            $1 = undefined;
        } else {
            $1 = $tmp$1.value;
        }

        const $tmp$2 = lit_macro(`=`, input, end);
        if ($tmp$2.kind === 'left') {
            return $tmp$2;
        }
        const [$end2, $2] = $tmp$2.value;
        end = $end2;

        const $tmp$3 = alternatives(input, end);
        if ($tmp$3.kind === 'left') {
            return $tmp$3;
        }
        const [$end3, $3] = $tmp$3.value;
        end = $end3;

        const $tmp$4 = lit_macro(`;`, input, end);
        if ($tmp$4.kind === 'left') {
            return $tmp$4;
        }
        const [$end4, $4] = $tmp$4.value;
        end = $end4;

        const text = () => input.substring(start, end);
        const $mapped = mkTemplateRule($0.id, $0.template, $1, $3);
        return { kind: 'right', value: [ end, $mapped ] } as const;
    };
    const $tmp$0 = $cc0(input, start);
    if ($tmp$0.kind === 'right') {
        return $tmp$0;
    }
    if ($tmp$0.kind === 'left' && !($tmp$0.value.kind === 'no_match' && $tmp$0.value.idx === end)) {
        return $tmp$0;
    }

    const $cc1 = (input: string, start: number) => {
        
        let end = start;

        
        const $tmp$0 = id(input, end);
        if ($tmp$0.kind === 'left') {
            return $tmp$0;
        }
        const [$end0, $0] = $tmp$0.value;
        end = $end0;

        
        const $cc1 = (input: string, start: number) => {
            
            const $tmp$1 = type(input, end);
            if ($tmp$1.kind === 'left') {
                return $tmp$1;
            }
            const [$end1, $1] = $tmp$1.value;
            end = $end1;
            return { kind: 'right', value: $1 } as const;
        };
        let $1;
        const $tmp$1 = $cc1(input, end);
        if ($tmp$1.kind === 'left') {
            if (!($tmp$1.value.kind === 'no_match' && $tmp$1.value.idx === end)) {
                return $tmp$1;
            }
            $1 = undefined;
        } else {
            $1 = $tmp$1.value;
        }

        const $tmp$2 = lit_macro(`=`, input, end);
        if ($tmp$2.kind === 'left') {
            return $tmp$2;
        }
        const [$end2, $2] = $tmp$2.value;
        end = $end2;

        const $tmp$3 = alternatives(input, end);
        if ($tmp$3.kind === 'left') {
            return $tmp$3;
        }
        const [$end3, $3] = $tmp$3.value;
        end = $end3;

        const $tmp$4 = lit_macro(`;`, input, end);
        if ($tmp$4.kind === 'left') {
            return $tmp$4;
        }
        const [$end4, $4] = $tmp$4.value;
        end = $end4;

        const text = () => input.substring(start, end);
        const $mapped = mkRule($0, $1, $3);
        return { kind: 'right', value: [ end, $mapped ] } as const;
    };
    const $tmp$1 = $cc1(input, start);
    if ($tmp$1.kind === 'right') {
        return $tmp$1;
    }
    if ($tmp$1.kind === 'left' && !($tmp$1.value.kind === 'no_match' && $tmp$1.value.idx === end)) {
        return $tmp$1;
    }
    return $tmp$1;
}


export function pastaText(input: string, start: number) {
    
    let end = start;

    
    const $tmp$0 = /^.+?(?=}%)/s.exec(input.substring(end));

    if (!$tmp$0) {
        return { kind: 'left', value: { kind: 'no_match', expected: /.+?(?=}%)/s, idx: end } } as const;
    }

    const $0 = $tmp$0[0];
    end += $0.length;

    const text = () => input.substring(start, end);
    const $mapped = mkText(start, end, text());
    return { kind: 'right', value: [ end, $mapped ] } as const;
}


export function pasta(input: string, start: number) {
    
    let end = start;

    
    const $0 = '%\{';
    if (!input.startsWith($0, end)) {
        return { kind: 'left', value: { kind: 'no_match', expected: $0, idx: end } } as const;
    }

    end += $0.length;

    const $tmp$1 = pastaText(input, end);
    if ($tmp$1.kind === 'left') {
        return $tmp$1;
    }
    const [$end1, $1] = $tmp$1.value;
    end = $end1;

    const $2 = '}%';
    if (!input.startsWith($2, end)) {
        return { kind: 'left', value: { kind: 'no_match', expected: $2, idx: end } } as const;
    }

    end += $2.length;

    const $tmp$3 = ws(input, end);
    if ($tmp$3.kind === 'left') {
        return $tmp$3;
    }
    const [$end3, $3] = $tmp$3.value;
    end = $end3;

    const text = () => input.substring(start, end);
    const $mapped = mkPasta($1);
    return { kind: 'right', value: [ end, $mapped ] } as const;
}


export function eof(input: string, start: number) {
    
    let end = start;

    
    const $tmp$0 = /^$/.exec(input.substring(end));

    if (!$tmp$0) {
        return { kind: 'left', value: { kind: 'no_match', expected: /$/, idx: end } } as const;
    }

    const $0 = $tmp$0[0];
    end += $0.length;

    const text = () => input.substring(start, end);
    const $mapped = $0;
    return { kind: 'right', value: [ end, $mapped ] } as const;
}


export function grammar(input: string, start: number) {
    
    let end = start;

    
    const $tmp$0 = ws(input, end);
    if ($tmp$0.kind === 'left') {
        return $tmp$0;
    }
    const [$end0, $0] = $tmp$0.value;
    end = $end0;

    
    const $cc1 = (input: string, start: number) => {
        
        const $tmp$1 = pasta(input, end);
        if ($tmp$1.kind === 'left') {
            return $tmp$1;
        }
        const [$end1, $1] = $tmp$1.value;
        end = $end1;
        return { kind: 'right', value: $1 } as const;
    };
    let $1 = [];
    while (true) {
        const $tmp$1 = $cc1(input, end);
        if ($tmp$1.kind === 'left') {
            if (!($tmp$1.value.kind === 'no_match' && $tmp$1.value.idx === end)) {
                return $tmp$1;
            }
            break;
        }
        $1.push($tmp$1.value);
    }

    
    const $cc2 = (input: string, start: number) => {
        
        const $tmp$2 = rule(input, end);
        if ($tmp$2.kind === 'left') {
            return $tmp$2;
        }
        const [$end2, $2] = $tmp$2.value;
        end = $end2;
        return { kind: 'right', value: $2 } as const;
    };
    let $2 = [];
    while (true) {
        const $tmp$2 = $cc2(input, end);
        if ($tmp$2.kind === 'left') {
            if (!($tmp$2.value.kind === 'no_match' && $tmp$2.value.idx === end)) {
                return $tmp$2;
            }
            break;
        }
        $2.push($tmp$2.value);
    }

    const $tmp$3 = ws(input, end);
    if ($tmp$3.kind === 'left') {
        return $tmp$3;
    }
    const [$end3, $3] = $tmp$3.value;
    end = $end3;

    const $tmp$4 = eof(input, end);
    if ($tmp$4.kind === 'left') {
        return $tmp$4;
    }
    const [$end4, $4] = $tmp$4.value;
    end = $end4;

    const text = () => input.substring(start, end);
    const $mapped = mkGrammar($1, $2);
    return { kind: 'right', value: [ end, $mapped ] } as const;
}


type $Either<L, R> = { readonly kind: 'left',  readonly value: L }
                   | { readonly kind: 'right', readonly value: R }

type $NoMatch<T> = { readonly kind: 'no_match', readonly expected: T, readonly idx: number }

type $Match<T> = $Either<$NoMatch<string | RegExp>, readonly [number, T]>

export function $fail(expected: string, idx: number): $Match<never> {
    return { kind: 'left', value: { kind: 'no_match', expected, idx } } as const;
}

export function $success<T>(value: T, idx: number): $Match<T> {
    return { kind: 'right', value: [idx, value] } as const;
}

export function getLineCol(offset: number, lineOffsetTable: [number, string][]): [number, number]|null {
    let idx = binarySearch(lineOffsetTable, x => x[0] < offset ? -1 :
                                                 x[0] > offset ?  1 : 0);

    if (idx === false) {
        return null;
    }
    if (idx < 0) {
        idx = -idx - 1;
    }

    return [idx, offset - lineOffsetTable[idx][0]];
}

export function parseLineOffsets(source: string): [number, string][] {
    const lines = source.split('\n');

    let acc = [];
    let offset = 0;
    for (const l of lines) {
        acc.push([ offset, l ] as [number, string]);
        offset += l.length + 1;
    }

    return acc;
}

function binarySearch<T>(arr: T[], compare: (x: T) => -1|0|1): false|number {
    let low = 0;
    let high = arr.length - 1;

    if (!arr.length) {
        return false;
    }

    while (low <= high) {
        const m = low + ((high - low) >> 1);
        const cmp = compare(arr[m]);

        if (cmp < 0) {
            low = m + 1;
            continue;
        }
        if (cmp > 0) {
            high = m - 1;
            continue;
        }

        return m;
    }

    return -low;
}

export function formatSimpleError(error: $NoMatch<string|RegExp>, lineOffsets: [number, string][], fileName?: string) {
    const [ lineNo, col ] = getLineCol(error.idx, lineOffsets)!;
    const line = lineOffsets[lineNo][1];

    return [
        line,
        ' '.repeat(col) + '^',
        `${fileName ? fileName + ': ' : ''}${lineNo+1}:${col+1}: Expected ${error.expected}`
    ].join('\n');
}

export function parse<T>(grammar: (input: string, start: number) => $Match<T>, source: string, fileName?: string): $Either<string, T> {
    const result = grammar(source, 0);
    if (result.kind === 'left') {
        const lineOffsets = parseLineOffsets(source);
        const error = formatSimpleError(result.value, lineOffsets, fileName);

        return { kind: 'left', value: error };
    }

    return { kind: 'right', value: result.value[1] };
}

