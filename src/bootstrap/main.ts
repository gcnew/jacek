#!/usr/bin/env node

import * as fs from 'fs';


function main() {
    const [node, self, grammarFile] = process.argv;
    if (!grammarFile) {
        console.log('syntax: bootstrap <grammar-file>');
        process.exit(1);
    }

    const contents = fs.readFileSync(grammarFile, 'utf-8');
    const result = compileGrammar(contents);

    console.log(result);
}

function tmp(idx: number) {
    return '$tmp$' + idx;
}

function isLook(idx: number) {
    return `${tmp(idx)}.value.kind === 'no_match' && ${tmp(idx)}.value.idx === end`
}

function cc(code: string, idx: number) {
    return `
    const $cc${idx} = (input: string, start: number) => {
        ${code.replace(/^    /gm, '        ')}
        return { kind: 'right', value: $${idx} } as const;
    };`;
}

function compileRx(pattern: string, idx: number) {
    return `
    const ${tmp(idx)} = /^${pattern.substr(1)}.exec(input.substring(end));

    if (!${tmp(idx)}) {
        return { kind: 'left', value: { kind: 'no_match', expected: ${pattern}, idx: end } } as const;
    }

    const $${idx} = ${tmp(idx)}[0];
    end += $${idx}.length;`
}

function compileLiteral(literal: string, idx: number) {
    return `
    const $${idx} = ${literal};
    if (!input.startsWith($${idx}, end)) {
        return { kind: 'left', value: { kind: 'no_match', expected: $${idx}, idx: end } } as const;
    }

    end += $${idx}.length;`
}

function compileLexLiteral(literal: string, idx: number) {

}

function compileRuleInvokation(rule: string, idx: number) {
    return `
    const ${tmp(idx)} = ${rule}(input, end);
    if (${tmp(idx)}.kind === 'left') {
        return ${tmp(idx)};
    }
    const [$end${idx}, $${idx}] = ${tmp(idx)}.value;
    end = $end${idx};`
}

function compileAny(idx: number) {
    return `
    if (input.length === end) {
        return { kind: 'left', value: { kind: 'no_match', expected: '<any>', idx: end } } as const;
    }
    const $${idx} = input[end];
    end++;`;
}

function compileNot(pattern: string, idx: number): string {
    return `
    const $cc${idx} = (input: string, start: number, end: number) => {
        ${compileSimple(pattern, idx).replace(/^    /gm, '        ')}
        return { kind: 'right', value: $${idx} } as const;
    };
    if ($cc${idx}(input, end, end).kind === 'right') {
        return { kind: 'left', value: { kind: 'no_match', expected: '<not>', idx: end } } as const;
    }
    if (input.length === end) {
        return { kind: 'left', value: { kind: 'no_match', expected: '<not>', idx: end } } as const;
    }
    const $${idx} = input[end];
    end++;`;
}

function compileSimple(pattern: string, idx: number) {
    if (pattern[0] === '/') {
        return compileRx(pattern, idx);
    }

    if (pattern[0] === '\'') {
        return compileLiteral(pattern, idx);
    }

    if (pattern[0] === '`') {
        return compileLexLiteral(pattern, idx);
    }

    if (pattern === '.') {
        return compileAny(idx);
    }

    const notPattern = /not\((.*)\)/.exec(pattern);
    if (notPattern) {
        return compileNot(notPattern[1], idx);
    }

    return compileRuleInvokation(pattern, idx);
}

function compilePattern(pattern: string, idx: number) {
    const [_, sp, modifier] = /(.+?)([?*+])?$/.exec(pattern)!;

    const code = compileSimple(sp, idx);
    if (!modifier) {
        return code;
    }

    if (modifier === '?') {
        return `
    ${cc(code, idx)}
    let $${idx};
    const ${tmp(idx)} = $cc${idx}(input, end);
    if (${tmp(idx)}.kind === 'left') {
        if (!(${isLook(idx)})) {
            return ${tmp(idx)};
        }
        $${idx} = undefined;
    } else {
        $${idx} = ${tmp(idx)}.value;
    }`;
    }

    if (modifier === '*') {
    return `
    ${cc(code, idx)}
    let $${idx} = [];
    while (true) {
        const ${tmp(idx)} = $cc${idx}(input, end);
        if (${tmp(idx)}.kind === 'left') {
            if (!(${isLook(idx)})) {
                return ${tmp(idx)};
            }
            break;
        }
        $${idx}.push(${tmp(idx)}.value);
    }`;
    }

    if (modifier === '+') {
    return `
    ${cc(code, idx)}
    const ${tmp(idx)}_1 = $cc${idx}(input, end);
    if (${tmp(idx)}_1.kind === 'left') {
        return ${tmp(idx)}_1;
    }
    let $${idx} = [ ${tmp(idx)}_1.value ];
    while (true) {
        const ${tmp(idx)} = $cc${idx}(input, end);
        if (${tmp(idx)}.kind === 'left') {
            if (!(${isLook(idx)})) {
                return ${tmp(idx)};
            }
            break;
        }
        $${idx}.push(${tmp(idx)}.value);
    }`;
    }

    throw 'fail: whooops!';
}

function compileAlternative(alt: string) {
    const [seq, mapper] = alt.split(/ *%% */);
    const compiled = seq
        .replace(/'[^']+?'/g, x => x.replaceAll(' ', '>>>space<<<'))   // map space in strings
        .replace(/\/[^']+?\//g, x => x.replaceAll(' ', '>>>space<<<')) // map space in regexps
        .split(/ +/)
        .map(s => s.replaceAll('>>>space<<<', ' '))
        .map(compilePattern);

    const code = compiled
        .join('\n');

    return `
    let end = start;

    ${code}

    const text = () => input.substring(start, end);
    return { kind: 'right', value: [ end, ${mapper || '$0'} ] } as const;`;
}

function compileRule(rule: string) {
    const [_0, name, _1, type, ruleBody] = /^(`\w+`|\w+)(:\s*(\w+))?\s*= *(.*)$/s.exec(rule)!;

    const alternatives = ruleBody.split(/\s+\|\s+/)
        .map(compileAlternative);

    let code;
    if (alternatives.length === 1) {
        code = alternatives[0];
    } else {
        const ccs = alternatives.map((alt, idx) => `
    const $cc${idx} = (input: string, start: number) => {
        ${alt.replace(/^    /gm, '        ')}
    };
    const ${tmp(idx)} = $cc${idx}(input, start);
    if (${tmp(idx)}.kind === 'right') {
        return ${tmp(idx)};
    }
    if (${tmp(idx)}.kind === 'left' && !(${isLook(idx)})) {
        return ${tmp(idx)};
    }`);

        code = `
    let end = start;
    ${ccs.join('\n')}
    return ${tmp(alternatives.length - 1)};`
    }

    if (name[0] == '`') {
        return `
function
`;
    }

    return `
export function ${name}(input: string, start: number)${(type ? `: $Match<${type}>` : '')} {
    ${code}
}
`;
}

const prelude = `
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
    const lines = source.split('\\n');

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
        \`\${fileName ? fileName + ': ' : ''}\${lineNo+1}:\${col+1}: Expected \${error.expected}\`
    ].join('\\n');
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
`;


function compileGrammar(g: string) {
    const pasta = [ ... g.matchAll(/%\{(.*?)\}%/gs) ]
        .map(x => x[1].trim())

    const matchedRules = g
        .replaceAll(/%\{(.*?)\}%/gs, '')                  // remove the pasta
        .matchAll(/(\w+(:\s*(\w+))?\s*=.+?)\s+;/gs);

    const left = g
        .replaceAll(/%\{(.*?)\}%/gs, '')                  // remove the pasta
        .replaceAll(/(\w+(:\s*(\w+))?\s*=.+?)\s+;/gs, '') // remove the rules
        .trim();
    if (left) {
        console.log('Cannot compile: \n\n'+ left);
        process.exit(1);
    }

    const rules = [];
    for (const [_, rule] of matchedRules) {
        const compiled = compileRule(rule);
        rules.push(compiled);
    }


    return [ prelude, ...pasta, ...rules ].join('\n');
}

main();
