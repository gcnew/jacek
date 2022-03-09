
type $StripReadonly<T> = {
    -readonly [P in keyof T]: T[P];
}

type $Either<L, R> = { kind: 'left',  value: L }
                   | { kind: 'right', value: R }

type $NoMatch<T> = { kind: 'no_match', expected: T, idx: number }

type $Match<T> = $Either<$NoMatch<string | RegExp>, readonly [number, T]>

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

type Variable    = { kind: 'var',    value: string, start: number, end: number   }
type Lambda      = { kind: 'lambda', arg:   string, body:  Expr,   start: number }

type Application = { kind: 'app',    fn: Expr, arg: Expr }

type Expr        = Variable
                 | Lambda
                 | Application
/* ====== Interpreter ====== */

type Scope = { [key: string]: Value | undefined }

type Value = { kind: 'value',   value: string }
           | { kind: 'closure', arg:   string, body: Expr, closed: Scope }

function run(source: string) {
    const parsed = parse(program, source);

    if (parsed.kind === 'left') {
        console.log(parsed.value);
        return;
    }

    const ast = parsed.value;
    const res = reduce(ast, {});
    console.log(show(res));
}

function reduce(expr: Expr, scope: Scope): Value {
    switch (expr.kind) {
        case 'var':
            return scope[expr.value] || { kind: 'value', value: expr.value };

        case 'lambda':
            return { kind: 'closure', arg: expr.arg, body: expr.body, closed: scope };

        case 'app':
            const fn = reduce(expr.fn, scope);
            const arg = reduce(expr.arg, scope);

            if (fn.kind !== 'closure') {
                throw { kind: 'bad_reduction', expr, scope };
            }

            const newScope = { ...fn.closed, [fn.arg]: arg };
            return reduce(fn.body, newScope);
    }
}

function show(x: Value | Expr, lookup?: Scope): string {
    switch (x.kind) {
        case 'value':
            return x.value;

        case 'closure':
            return 'λ' + x.arg + '.' + show(x.body, x.closed);

        case 'var':
            const found = lookup?.[x.value];

            return found ? show(found, lookup)
                         : x.value;

        case 'lambda':
            return 'λ' + x.arg + '.' + show(x.body, lookup);

        case 'app':
            return '(' + show(x.fn, lookup) + ') ' + show(x.arg, lookup);
    }
}

run('(λx.λa.x) a');
run('(λx.λy.y x) (λy.y)');
run('(λx.λy.λf.f x y) ((λx.λa.x) a) ((λx.λa.x) a)');

export function variable(input: string, start: number) {
    
    let end = start;

    
    const $tmp$0 = /^\w+/.exec(input.substring(end));

    if (!$tmp$0) {
        return { kind: 'left', value: { kind: 'no_match', expected: /\w+/, idx: end } } as const;
    }

    const $0 = $tmp$0[0];
    end += $0.length;

    const text = () => input.substring(start, end);
    return { kind: 'right', value: [ end, { kind: 'var', value: text(), start, end } as Variable ] } as const;
}


export function lambda(input: string, start: number) {
    
    let end = start;

    
    const $0 = 'λ';
    if (!input.startsWith($0, end)) {
        return { kind: 'left', value: { kind: 'no_match', expected: $0, idx: end } } as const;
    }

    end += $0.length;

    const $tmp$1 = variable(input, end);
    if ($tmp$1.kind === 'left') {
        return $tmp$1;
    }
    const [$end1, $1] = $tmp$1.value;
    end = $end1;

    const $2 = '.';
    if (!input.startsWith($2, end)) {
        return { kind: 'left', value: { kind: 'no_match', expected: $2, idx: end } } as const;
    }

    end += $2.length;

    const $tmp$3 = expr(input, end);
    if ($tmp$3.kind === 'left') {
        return $tmp$3;
    }
    const [$end3, $3] = $tmp$3.value;
    end = $end3;

    const text = () => input.substring(start, end);
    return { kind: 'right', value: [ end, { kind: 'lambda', arg: $1.value, body: $3, start } as Lambda ] } as const;
}


export function simpleExpr(input: string, start: number): $Match<Expr> {
    
    let end = start;
    
    const $cc0 = (input: string, start: number) => {
        
        let end = start;

        
        const $tmp$0 = lambda(input, end);
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

        
        const $0 = '(';
        if (!input.startsWith($0, end)) {
            return { kind: 'left', value: { kind: 'no_match', expected: $0, idx: end } } as const;
        }

        end += $0.length;

        const $tmp$1 = expr(input, end);
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
        return { kind: 'right', value: [ end, $1 ] } as const;
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

        
        const $tmp$0 = variable(input, end);
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
    return $tmp$2;
}


export function application(input: string, start: number) {
    
    let end = start;

    
    const $0 = ' ';
    if (!input.startsWith($0, end)) {
        return { kind: 'left', value: { kind: 'no_match', expected: $0, idx: end } } as const;
    }

    end += $0.length;

    const $tmp$1 = simpleExpr(input, end);
    if ($tmp$1.kind === 'left') {
        return $tmp$1;
    }
    const [$end1, $1] = $tmp$1.value;
    end = $end1;

    const text = () => input.substring(start, end);
    return { kind: 'right', value: [ end, $1 ] } as const;
}


export function expr(input: string, start: number) {
    
    let end = start;

    
    const $tmp$0 = simpleExpr(input, end);
    if ($tmp$0.kind === 'left') {
        return $tmp$0;
    }
    const [$end0, $0] = $tmp$0.value;
    end = $end0;

    
    const $cc1 = (input: string, start: number) => {
        
        const $tmp$1 = application(input, end);
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
    return { kind: 'right', value: [ end, $1.reduce((fn, arg) => ({ kind: 'app', fn, arg }), $0) ] } as const;
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


export function program(input: string, start: number) {
    
    let end = start;

    
    const $tmp$0 = expr(input, end);
    if ($tmp$0.kind === 'left') {
        return $tmp$0;
    }
    const [$end0, $0] = $tmp$0.value;
    end = $end0;

    const $tmp$1 = eof(input, end);
    if ($tmp$1.kind === 'left') {
        return $tmp$1;
    }
    const [$end1, $1] = $tmp$1.value;
    end = $end1;

    const text = () => input.substring(start, end);
    return { kind: 'right', value: [ end, $0 ] } as const;
}

