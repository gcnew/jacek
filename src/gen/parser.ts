
type $StripReadonly<T> = {
    -readonly [P in keyof T]: T[P];
}

type $Either<L, R> = { kind: 'left',  value: L }
                   | { kind: 'right', value: R }

type $NoMatch<T> = { kind: 'no_match', expected: T, idx: number }

type $Match<T> = $Either<$NoMatch<string | RegExp>, readonly [number, T]>

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

export function ws(input: string, start: number) {
    
    let end = start;

    
    const $tmp$0 = /^\s*/.exec(input.substring(end));

    if (!$tmp$0) {
        return { kind: 'left', value: { kind: 'no_match', expected: /\s*/, idx: end } } as const;
    }

    const $0 = $tmp$0[0];
    end += $0.length;

    const text = () => input.substring(start, end);
    return { kind: 'right', value: [ end, $0 ] } as const;
}


export function ws1(input: string, start: number) {
    
    let end = start;

    
    const $tmp$0 = /^\s+/.exec(input.substring(end));

    if (!$tmp$0) {
        return { kind: 'left', value: { kind: 'no_match', expected: /\s+/, idx: end } } as const;
    }

    const $0 = $tmp$0[0];
    end += $0.length;

    const text = () => input.substring(start, end);
    return { kind: 'right', value: [ end, $0 ] } as const;
}


export function id(input: string, start: number) {
    
    let end = start;

    
    const $tmp$0 = /^[a-zA-Z][a-zA-Z0-9]*/.exec(input.substring(end));

    if (!$tmp$0) {
        return { kind: 'left', value: { kind: 'no_match', expected: /[a-zA-Z][a-zA-Z0-9]*/, idx: end } } as const;
    }

    const $0 = $tmp$0[0];
    end += $0.length;

    const text = () => input.substring(start, end);
    return { kind: 'right', value: [ end, mkId(start, end, $0) ] } as const;
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
        return { kind: 'right', value: [ end, '\'' ] } as const;
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
        return { kind: 'right', value: [ end, $0 ] } as const;
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

    const $2 = '\'';
    if (!input.startsWith($2, end)) {
        return { kind: 'left', value: { kind: 'no_match', expected: $2, idx: end } } as const;
    }

    end += $2.length;

    const text = () => input.substring(start, end);
    return { kind: 'right', value: [ end, mkLiteral(start, end, $1.join('')) ] } as const;
}


export function regexPart(input: string, start: number) {
    
    let end = start;
    
    const $cc0 = (input: string, start: number) => {
        
        let end = start;

        
        const $0 = '\\/';
        if (!input.startsWith($0, end)) {
            return { kind: 'left', value: { kind: 'no_match', expected: $0, idx: end } } as const;
        }

        end += $0.length;

        const text = () => input.substring(start, end);
        return { kind: 'right', value: [ end, $0 ] } as const;
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
        return { kind: 'right', value: [ end, $0 ] } as const;
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
        
        const $tmp$1 = regexPart(input, end);
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
        
        const $3 = 'i';
        if (!input.startsWith($3, end)) {
            return { kind: 'left', value: { kind: 'no_match', expected: $3, idx: end } } as const;
        }

        end += $3.length;
        return { kind: 'right', value: $3 } as const;
    };
    let $3;
    const $tmp$3 = $cc3(input, end);
    if ($tmp$3.kind === 'left') {
        if (!($tmp$3.value.kind === 'no_match' && $tmp$3.value.idx === end)) {
            return $tmp$3;
        }
        $3 = undefined;
    } else {
        $3 = $tmp$3.value;
    }

    
    const $cc4 = (input: string, start: number) => {
        
        const $4 = 's';
        if (!input.startsWith($4, end)) {
            return { kind: 'left', value: { kind: 'no_match', expected: $4, idx: end } } as const;
        }

        end += $4.length;
        return { kind: 'right', value: $4 } as const;
    };
    let $4;
    const $tmp$4 = $cc4(input, end);
    if ($tmp$4.kind === 'left') {
        if (!($tmp$4.value.kind === 'no_match' && $tmp$4.value.idx === end)) {
            return $tmp$4;
        }
        $4 = undefined;
    } else {
        $4 = $tmp$4.value;
    }

    const text = () => input.substring(start, end);
    return { kind: 'right', value: [ end, mkRegexp(start, end, text()) ] } as const;
}


export function not(input: string, start: number) {
    
    let end = start;

    
    const $0 = 'not(';
    if (!input.startsWith($0, end)) {
        return { kind: 'left', value: { kind: 'no_match', expected: $0, idx: end } } as const;
    }

    end += $0.length;

    const $tmp$1 = simplePattern(input, end);
    if ($tmp$1.kind === 'left') {
        return $tmp$1;
    }
    const [$end1, $1] = $tmp$1.value;
    end = $end1;

    const $2 = ')';
    if (!input.startsWith($2, end)) {
        return { kind: 'left', value: { kind: 'no_match', expected: $2, idx: end } } as const;
    }

    end += $2.length;

    const text = () => input.substring(start, end);
    return { kind: 'right', value: [ end, mkNot(start, end, $1) ] } as const;
}


export function any(input: string, start: number) {
    
    let end = start;

    
    const $0 = '.';
    if (!input.startsWith($0, end)) {
        return { kind: 'left', value: { kind: 'no_match', expected: $0, idx: end } } as const;
    }

    end += $0.length;

    const text = () => input.substring(start, end);
    return { kind: 'right', value: [ end, mkAny(start, end) ] } as const;
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
        return { kind: 'right', value: [ end, $0 ] } as const;
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
        return { kind: 'right', value: [ end, $0 ] } as const;
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
        return { kind: 'right', value: [ end, $0 ] } as const;
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

        
        const $tmp$0 = not(input, end);
        if ($tmp$0.kind === 'left') {
            return $tmp$0;
        }
        const [$end0, $0] = $tmp$0.value;
        end = $end0;

        const text = () => input.substring(start, end);
        return { kind: 'right', value: [ end, $0 ] } as const;
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
        return { kind: 'right', value: [ end, $0 ] } as const;
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


export function repModifier(input: string, start: number) {
    
    let end = start;
    
    const $cc0 = (input: string, start: number) => {
        
        let end = start;

        
        const $0 = '?';
        if (!input.startsWith($0, end)) {
            return { kind: 'left', value: { kind: 'no_match', expected: $0, idx: end } } as const;
        }

        end += $0.length;

        const text = () => input.substring(start, end);
        return { kind: 'right', value: [ end, $0 ] } as const;
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

        
        const $0 = '*';
        if (!input.startsWith($0, end)) {
            return { kind: 'left', value: { kind: 'no_match', expected: $0, idx: end } } as const;
        }

        end += $0.length;

        const text = () => input.substring(start, end);
        return { kind: 'right', value: [ end, $0 ] } as const;
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

        
        const $0 = '+';
        if (!input.startsWith($0, end)) {
            return { kind: 'left', value: { kind: 'no_match', expected: $0, idx: end } } as const;
        }

        end += $0.length;

        const text = () => input.substring(start, end);
        return { kind: 'right', value: [ end, $0 ] } as const;
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
    return { kind: 'right', value: [ end, mkRep($0, $1) ] } as const;
}


export function seq(input: string, start: number) {
    
    let end = start;

    
    const $tmp$0 = rep(input, end);
    if ($tmp$0.kind === 'left') {
        return $tmp$0;
    }
    const [$end0, $0] = $tmp$0.value;
    end = $end0;

    const $tmp$1 = ws(input, end);
    if ($tmp$1.kind === 'left') {
        return $tmp$1;
    }
    const [$end1, $1] = $tmp$1.value;
    end = $end1;

    const text = () => input.substring(start, end);
    return { kind: 'right', value: [ end, $0 ] } as const;
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
    return { kind: 'right', value: [ end, mkText(start, end, text().trim()) ] } as const;
}


export function lookMapper(input: string, start: number) {
    
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

    const text = () => input.substring(start, end);
    return { kind: 'right', value: [ end, $1 ] } as const;
}


export function pattern(input: string, start: number) {
    
    let end = start;

    
    
    const $cc0 = (input: string, start: number) => {
        
        const $tmp$0 = seq(input, end);
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
        
        const $tmp$1 = lookMapper(input, end);
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
    return { kind: 'right', value: [ end, mkPattern($0, $1) ] } as const;
}


export function alternationLook(input: string, start: number) {
    
    let end = start;

    
    const $0 = '|';
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

    const $tmp$2 = pattern(input, end);
    if ($tmp$2.kind === 'left') {
        return $tmp$2;
    }
    const [$end2, $2] = $tmp$2.value;
    end = $end2;

    const text = () => input.substring(start, end);
    return { kind: 'right', value: [ end, $2 ] } as const;
}


export function alternatives(input: string, start: number) {
    
    let end = start;

    
    const $tmp$0 = pattern(input, end);
    if ($tmp$0.kind === 'left') {
        return $tmp$0;
    }
    const [$end0, $0] = $tmp$0.value;
    end = $end0;

    
    const $cc1 = (input: string, start: number) => {
        
        const $tmp$1 = alternationLook(input, end);
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
    return { kind: 'right', value: [ end, [ $0, ...$1 ] ] } as const;
}


export function type(input: string, start: number) {
    
    let end = start;

    
    const $0 = ':';
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

    const $tmp$2 = id(input, end);
    if ($tmp$2.kind === 'left') {
        return $tmp$2;
    }
    const [$end2, $2] = $tmp$2.value;
    end = $end2;

    const text = () => input.substring(start, end);
    return { kind: 'right', value: [ end, $2 ] } as const;
}


export function rule(input: string, start: number) {
    
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

    const $tmp$2 = ws(input, end);
    if ($tmp$2.kind === 'left') {
        return $tmp$2;
    }
    const [$end2, $2] = $tmp$2.value;
    end = $end2;

    const $3 = '=';
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

    const $tmp$5 = alternatives(input, end);
    if ($tmp$5.kind === 'left') {
        return $tmp$5;
    }
    const [$end5, $5] = $tmp$5.value;
    end = $end5;

    const $6 = ';';
    if (!input.startsWith($6, end)) {
        return { kind: 'left', value: { kind: 'no_match', expected: $6, idx: end } } as const;
    }

    end += $6.length;

    const $tmp$7 = ws(input, end);
    if ($tmp$7.kind === 'left') {
        return $tmp$7;
    }
    const [$end7, $7] = $tmp$7.value;
    end = $end7;

    const text = () => input.substring(start, end);
    return { kind: 'right', value: [ end, mkRule($0, $1, $5 as $StripReadonly<typeof $5>) ] } as const;
}


export function pastaText(input: string, start: number) {
    
    let end = start;

    
    
    const $cc0 = (input: string, start: number) => {
        
        const $cc0 = (input: string, start: number, end: number) => {
            
            const $0 = '}%';
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
    return { kind: 'right', value: [ end, mkText(start, end, text()) ] } as const;
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
    return { kind: 'right', value: [ end, mkPasta($1) ] } as const;
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
    return { kind: 'right', value: [ end, $0 ] } as const;
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
    return { kind: 'right', value: [ end, mkGrammar($1, $2) ] } as const;
}

