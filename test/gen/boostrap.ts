
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

import { test } from 'pietr'
import * as assert from 'assert'

test('title', () => {
    const [_, filename, ext] = /\/?([^\/]+?)(\.\w+)?$/.exec(__filename)!;
    console.log('\n\n' + filename + ':');
});

/*  ========== String Literal ======= */
test('string literal - succeeds if exact match', () => {
    const res = parsed(stringLiteral, 'abcd');
    assert.equal(res, 'abcd');
});

test('string literal - succeeds if suffxed', () => {
    const res = parsed(stringLiteral, 'abcdx');
    assert.equal(res, 'abcd');
});

test('string literal - fails if prefixed', () => {
    const res = fails(stringLiteral, 'xabcd');
    assert.equal(res, 'xabcd\n^\n1:1: Expected abcd');
});

test('string literal - fails if other', () => {
    const res = fails(stringLiteral, 'xxxxdddd');
    assert.equal(res, 'xxxxdddd\n^\n1:1: Expected abcd');
});

/*  ========== RegExp ======= */
test('regexp - succeeds if exact match', () => {
    const res = parsed(regExp, 'abcd');
    assert.equal(res, 'abcd');
});

test('regexp - succeeds if suffxed', () => {
    const res = parsed(regExp, 'abcdx');
    assert.equal(res, 'abcd');
});

test('regexp - fails if prefixed', () => {
    const res = fails(regExp, 'xabcd');
    assert.equal(res, 'xabcd\n^\n1:1: Expected /abcd/');
});

test('regexp - fails if other', () => {
    const res = fails(regExp, 'xxxxdddd');
    assert.equal(res, 'xxxxdddd\n^\n1:1: Expected /abcd/');
});

/*  ========== Seq ======= */
test('seq - succeeds if exact match', () => {
    const res = parsed(seq, 'abcd');
    assert.equal(res, 'abcd');
});

test('seq - succeeds if suffxed', () => {
    const res = parsed(seq, 'abcdx');
    assert.equal(res, 'abcd');
});

test('seq - fails if prefixed', () => {
    const res = fails(seq, 'xabcd');
    assert.equal(res, 'xabcd\n^\n1:1: Expected a');
});

test('seq - fails if other', () => {
    const res = fails(seq, 'xxxxdddd');
    assert.equal(res, 'xxxxdddd\n^\n1:1: Expected a');
});

/*  ========== ref ======= */
test('ref - succeeds if exact match', () => {
    const res = parsed(ref, 'abcdabcdabcd');
    assert.equal(res, 'abcdabcdabcd');
});

test('ref - succeeds if suffxed', () => {
    const res = parsed(ref, 'abcdabcdabcdx');
    assert.equal(res, 'abcdabcdabcd');
});

test('ref - fails if prefixed', () => {
    const res = fails(ref, 'xabcdabcdabcd');
    assert.equal(res, 'xabcdabcdabcd\n^\n1:1: Expected a');
});

test('ref - fails if other', () => {
    const res = fails(ref, 'xxxxdddd');
    assert.equal(res, 'xxxxdddd\n^\n1:1: Expected a');
});


function parsed<T>(grammar: (input: string, start: number) => $Match<T>, source: string): T {
    const res = parse(grammar, source);

    if (res.kind === 'left') {
        throw new Error(res.value);
    }

    return res.value;
}

function fails<T>(grammar: (input: string, start: number) => $Match<T>, source: string): string {
    const res = parse(grammar, source);

    if (res.kind === 'right') {
        throw new assert.AssertionError({
            message: 'Parsing did not fail',
            expected: '<parsing-to-fail>',
            actual: res.value
        });
    }

    return res.value;
}

export function stringLiteral(input: string, start: number) {
    
    let end = start;

    
    const $0 = 'abcd';
    if (!input.startsWith($0, end)) {
        return { kind: 'left', value: { kind: 'no_match', expected: $0, idx: end } } as const;
    }

    end += $0.length;

    const text = () => input.substring(start, end);
    return { kind: 'right', value: [ end, $0 ] } as const;
}


export function regExp(input: string, start: number) {
    
    let end = start;

    
    const $tmp$0 = /^abcd/.exec(input.substring(end));

    if (!$tmp$0) {
        return { kind: 'left', value: { kind: 'no_match', expected: /abcd/, idx: end } } as const;
    }

    const $0 = $tmp$0[0];
    end += $0.length;

    const text = () => input.substring(start, end);
    return { kind: 'right', value: [ end, $0 ] } as const;
}


export function seq(input: string, start: number) {
    
    let end = start;

    
    const $0 = 'a';
    if (!input.startsWith($0, end)) {
        return { kind: 'left', value: { kind: 'no_match', expected: $0, idx: end } } as const;
    }

    end += $0.length;

    const $tmp$1 = /^b/.exec(input.substring(end));

    if (!$tmp$1) {
        return { kind: 'left', value: { kind: 'no_match', expected: /b/, idx: end } } as const;
    }

    const $1 = $tmp$1[0];
    end += $1.length;

    const $2 = 'c';
    if (!input.startsWith($2, end)) {
        return { kind: 'left', value: { kind: 'no_match', expected: $2, idx: end } } as const;
    }

    end += $2.length;

    const $tmp$3 = /^d/.exec(input.substring(end));

    if (!$tmp$3) {
        return { kind: 'left', value: { kind: 'no_match', expected: /d/, idx: end } } as const;
    }

    const $3 = $tmp$3[0];
    end += $3.length;

    const text = () => input.substring(start, end);
    return { kind: 'right', value: [ end, $0 + $1 + $2 + $3 ] } as const;
}


export function ref(input: string, start: number) {
    
    let end = start;

    
    const $tmp$0 = seq(input, end);
    if ($tmp$0.kind === 'left') {
        return $tmp$0;
    }
    const [$end0, $0] = $tmp$0.value;
    end = $end0;

    const $tmp$1 = regExp(input, end);
    if ($tmp$1.kind === 'left') {
        return $tmp$1;
    }
    const [$end1, $1] = $tmp$1.value;
    end = $end1;

    const $tmp$2 = stringLiteral(input, end);
    if ($tmp$2.kind === 'left') {
        return $tmp$2;
    }
    const [$end2, $2] = $tmp$2.value;
    end = $end2;

    const text = () => input.substring(start, end);
    return { kind: 'right', value: [ end, $0 + $1 + $2 ] } as const;
}


export function alternatives(input: string, start: number) {
    
    let end = start;
    
    const $cc0 = (input: string, start: number) => {
        
        let end = start;

        
        const $tmp$0 = seq(input, end);
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

        
        const $0 = 'def';
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

        
        const $tmp$0 = /^geh/.exec(input.substring(end));

        if (!$tmp$0) {
            return { kind: 'left', value: { kind: 'no_match', expected: /geh/, idx: end } } as const;
        }

        const $0 = $tmp$0[0];
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


export function eeff(input: string, start: number) {
    
    let end = start;
    
    const $cc0 = (input: string, start: number) => {
        
        let end = start;

        
        const $0 = 'ee';
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

        
        const $0 = 'ff';
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
    return $tmp$1;
}


export function mapping(input: string, start: number) {
    
    let end = start;

    
    const $0 = 'aa';
    if (!input.startsWith($0, end)) {
        return { kind: 'left', value: { kind: 'no_match', expected: $0, idx: end } } as const;
    }

    end += $0.length;

    
    const $cc1 = (input: string, start: number) => {
        
        const $1 = 'bb';
        if (!input.startsWith($1, end)) {
            return { kind: 'left', value: { kind: 'no_match', expected: $1, idx: end } } as const;
        }

        end += $1.length;
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

    
    const $cc2 = (input: string, start: number) => {
        
        const $2 = 'cc';
        if (!input.startsWith($2, end)) {
            return { kind: 'left', value: { kind: 'no_match', expected: $2, idx: end } } as const;
        }

        end += $2.length;
        return { kind: 'right', value: $2 } as const;
    };
    let $2: Extract<ReturnType<typeof $cc2>, { kind: 'right' }>['value'][] = [];
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

    
    const $cc3 = (input: string, start: number) => {
        
        const $3 = 'dd';
        if (!input.startsWith($3, end)) {
            return { kind: 'left', value: { kind: 'no_match', expected: $3, idx: end } } as const;
        }

        end += $3.length;
        return { kind: 'right', value: $3 } as const;
    };
    const $tmp$3_1 = $cc3(input, end);
    if ($tmp$3_1.kind === 'left') {
        return $tmp$3_1;
    }
    let $3 = [ $tmp$3_1.value ];
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

    const $tmp$4 = eeff(input, end);
    if ($tmp$4.kind === 'left') {
        return $tmp$4;
    }
    const [$end4, $4] = $tmp$4.value;
    end = $end4;

    const $tmp$5 = /^gg/.exec(input.substring(end));

    if (!$tmp$5) {
        return { kind: 'left', value: { kind: 'no_match', expected: /gg/, idx: end } } as const;
    }

    const $5 = $tmp$5[0];
    end += $5.length;

    const $cc6 = (input: string, start: number, end: number) => {
        
        const $6 = 'hh';
        if (!input.startsWith($6, end)) {
            return { kind: 'left', value: { kind: 'no_match', expected: $6, idx: end } } as const;
        }

        end += $6.length;
        return { kind: 'right', value: $6 } as const;
    };
    if ($cc6(input, end, end).kind === 'right') {
        return { kind: 'left', value: { kind: 'no_match', expected: '<not>', idx: end } } as const;
    }
    if (input.length === end) {
        return { kind: 'left', value: { kind: 'no_match', expected: '<not>', idx: end } } as const;
    }
    const $6 = input[end];
    end++;

    if (input.length === end) {
        return { kind: 'left', value: { kind: 'no_match', expected: '<any>', idx: end } } as const;
    }
    const $7 = input[end];
    end++;

    const text = () => input.substring(start, end);
    return { kind: 'right', value: [ end, ((aa: 'aa', bb: 'bb'|undefined, cc: 'cc'[], dd: 'dd'[], eeff: 'ee'|'ff', gg: string, n: string, any: string) => aa + bb + cc.join('') + dd.join('') + eeff + gg + n + any)($0, $1, $2, $3, $4, $5, $6, $7) ] } as const;
}

