
type $Either<L, R> = { readonly kind: 'left',  readonly value: L }
                   | { readonly kind: 'right', readonly value: R }

type $NoMatch = { kind: 'no_match', expected: string | RegExp, idx: number }

type $Match<T> = readonly [value: T, end: number]

type $Parser<T> = (input: string, start: number) => $Match<T>

export function $fail(expected: string, idx: number): never {
    throw { kind: 'no_match', expected, idx };
}

export function $success<T>(value: T, end: number): $Match<T> {
    return [value, end];
}

export const $any: $Parser<string> = (input, start) => {
    if (input.length === start) {
        const err: $NoMatch = { kind: 'no_match', expected: '<any>', idx: start };
        throw err;
    }

    return [ input[start], start + 1 ];
};

export function $not<T>(p: $Parser<T>): $Parser<string> {
    return (input, start) => {
        try {
            p(input, start);
        } catch (e: unknown) {
            if (start === input.length) {
                const err: $NoMatch = { kind: 'no_match', expected: '<not>', idx: start };
                throw err;
            }

            return [input[start], start + 1 ];
        }

        const err: $NoMatch = { kind: 'no_match', expected: '<not>', idx: start };
        throw err;
    };
}

export function $lit<S extends string>(s: S): $Parser<S> {
    return (input, start) => {
        if (!input.startsWith(s, start)) {
            const err: $NoMatch = { kind: 'no_match', expected: s, idx: start };
            throw err;
        }

        return [s, start + s.length];
    };
}

export function $rx(rx: RegExp): $Parser<string> {
    return (input, start) => {
        const res = rx.exec(input.substring(start));

        if (!res) {
            const err: $NoMatch = { kind: 'no_match', expected: rx, idx: start };
            throw err;
        }

        return [res[0], start + res[0].length];
    };
}

export function $opt<T>(p: $Parser<T>): $Parser<T | undefined> {
    return (input, start) => {
        try {
            return p(input, start);
        } catch (e: unknown) {
            if ((e as $NoMatch).idx === start) {
                return [undefined, start];
            }

            throw e;
        }
    };
}

export function $many<T>(p: $Parser<T>): $Parser<T[]> {
    return (input, start) => {
        const result: T[] = [];
        let value: T, end = start;

        try {
            while (true) {
                [value, end] = p(input, end);
                result.push(value);
            }
        } catch (e: unknown) {
            if ((e as $NoMatch).idx === end) {
                return [result, end];
            }

            throw e;
        }
    };
}

export function $many1<T>(p: $Parser<T>): $Parser<T[]> {
    return (input, start) => {
        const result: T[] = [];
        let value: T, _, end = start;

        try {
            do {
                [value, end] = p(input, end);
                result.push(value);
            } while (true);
        } catch (e: unknown) {
            if ((e as $NoMatch).idx === end) {
                return [result, end];
            }

            throw e;
        }
    };
}

export function $try<T>(p: $Parser<T>): $Parser<T> {
    return (input, start) => {
        try {
            return p(input, start);
        } catch (e: unknown) {
            const err: $NoMatch = { kind: 'no_match', expected: '<try>', idx: start };
            throw err;
        }
    };
}

export function $look<T>(p: $Parser<T>): $Parser<T> {
    return (input, start) => {
        try {
            const [value] = p(input, start);
            return [value, start];
        } catch (e: unknown) {
            const err: $NoMatch = { kind: 'no_match', expected: '<try>', idx: start };
            throw err;
        }
    };
}

export function $backtrack<T>(p: $Parser<T>): $Parser<T> {
    return (input, start) => {
        try {
            const reversed = input.slice(0, start).split('').reverse().join('');
            const [value, end] = p(reversed, 0);
            return [value, start - end];
        } catch (e: unknown) {
            const err: $NoMatch = { kind: 'no_match', expected: '<backtrack>', idx: start };
            throw err;
        }
    };
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

export function formatSimpleError(error: $NoMatch, lineOffsets: [number, string][], fileName?: string) {
    const [ lineNo, col ] = getLineCol(error.idx, lineOffsets)!;
    const line = lineOffsets[lineNo][1];

    return [
        line,
        ' '.repeat(col) + '^',
        `${fileName ? fileName + ': ' : ''}${lineNo+1}:${col+1}: Expected ${error.expected}`
    ].join('\n');
}

export function parse<T>(grammar: $Parser<T>, source: string, fileName?: string): $Either<string, T> {
    try {
        const result = grammar(source, 0);
        return { kind: 'right', value: result[0] };
    } catch (e: unknown) {
        const lineOffsets = parseLineOffsets(source);
        const error = formatSimpleError(e as $NoMatch, lineOffsets, fileName);

        return { kind: 'left', value: error };
    }
}
