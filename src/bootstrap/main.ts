#!/usr/bin/env node

import * as fs from 'fs';

type Expando<V> = {
    [key: string]: V
}

type Scope = Expando<boolean>

type Options = {
    noPrelude: boolean
}

function main() {
    const noPrelude = process.argv.includes('--no-prelude');
    const [node, self, grammarFile] = process.argv
        .filter(x => x !== '--no-prelude');

    if (!grammarFile) {
        console.log('syntax: bootstrap <grammar-file> [--no-prelude]');
        process.exit(1);
    }

    const contents = fs.readFileSync(grammarFile, 'utf-8');
    const result = compileGrammar(contents, { noPrelude });

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
    return `
    const ${tmp(idx)} = lit_macro(${literal}, input, end);
    if (${tmp(idx)}.kind === 'left') {
        return ${tmp(idx)};
    }
    const [$end${idx}, $${idx}] = ${tmp(idx)}.value;
    end = $end${idx};`
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

function compileNot(pattern: string, scope: Scope, idx: number): string {
    return `
    const $cc${idx} = (input: string, start: number, end: number) => {
        ${compileSimple(pattern, scope, idx).replace(/^    /gm, '        ')}
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

function compileSimple(pattern: string, scope: Scope, idx: number) {
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
        return compileNot(notPattern[1], scope, idx);
    }
    if (scope[pattern]) {
        return compileLiteral(pattern, idx);
    }
    return compileRuleInvokation(pattern, idx);
}

function compilePattern(pattern: string, scope: Scope, idx: number) {
    const [_, sp, modifier] = /(.+?)([?*+])?$/.exec(pattern)!;

    const code = compileGroup(sp, scope, idx);
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

function addSubPattern(pattern: string, map: Map<string, string>) {
    const key = '>>>' + map.size + '<<<';
    map.set(key, pattern);
    return key;
}

function revertSubPatterns(pattern: string, map: Map<string, string>): string {
    return pattern.replace(/>>>\d+<<</g, x => revertSubPatterns(map.get(x)!, map));
}

function splitSequence(seq: string) {
    const subPatterns = new Map<string, string>();

    return seq
        .replace(/\B(\([^\)]+?\))\B/g, x => addSubPattern(x, subPatterns)) // save (group)
        .replace(/\B(\/[^/]+?\/)\B/g,  x => addSubPattern(x, subPatterns)) // save /regexp/
        .replace(/\B(`[^`]+?`)\B/g,    x => addSubPattern(x, subPatterns)) // save 'string'
        .replace(/\B('[^']+?')\B/g,    x => addSubPattern(x, subPatterns)) // save `string`
        .split(/ +/)
        .map(pat => revertSubPatterns(pat, subPatterns));
}

function compileGroup(pattern: string, scope: Scope, idx: number): string {
    if (pattern[0] !== '(') {
        return compileSimple(pattern, scope, idx);
    }

    const subPatterns = splitSequence(pattern.slice(1, -1));
    const compiled = subPatterns
        .map((pat, idx) => pat[0] === '!'
            ? [ true, idx, compilePattern(pat.slice(1), scope, idx) ] as const
            : [ false, idx, compilePattern(pat, scope, idx) ] as const
        );

    const code = compiled
        .map(([extract, idx, code]) => code)
        .join('\n');

    const toExtract = compiled
        .flatMap(([extract, idx]) => extract ? [idx] : []);

    const projection = toExtract.length === 0 ? `[ ${subPatterns.map((_, i) => '$' + i).join(', ')} ]` : // extract all matches in a tuple
                       toExtract.length === 1 ? '$' + toExtract[0]                                       // extract a single result
                                              : `[ ${toExtract.map(i => '$' + i).join(', ')} ]`;         // extract the selected

    return `
    const $cc${idx} = (input: string, start: number) => {
        let end = start;
        ${code.replace(/^    /gm, '        ')}
        return { kind: 'right', value: [ end, ${projection} ] } as const;
    };
    ${compileRuleInvokation(`$cc${idx}`, idx)}`;
}

function compileAlternative(alt: string, scope: Scope) {
    const [seq, mapper] = alt
        .replace(/\\\n\s* %%/g, '\n')
        .split(/ *%% */);

    const code = splitSequence(seq)
        .map((pat, idx) => compilePattern(pat, scope, idx))
        .join('\n');

    return `
    let end = start;

    ${code}

    const text = () => input.substring(start, end);
    return { kind: 'right', value: [ end, ${mapper || '$0'} ] } as const;`;
}

function compileRule(rule: string) {
    const [_0, name, _1, type, ruleBody] = /^(`\w+`|\w+)(:\s*(\w+))?\s*= *(.*)$/s.exec(rule)!;
    const scope = name[0] === '`'
        ? { [name.slice(1, -1)]: true }
        : {};

    const alternatives = ruleBody.split(/\s+\|\s+/)
        .map(alt => compileAlternative(alt, scope));

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
function lit_macro<S extends string>(${name.slice(1, -1)}: S, input: string, start: number) {
    ${code}
}
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


function compileGrammar(g: string, options: Options) {
    const pasta = [ ... g.matchAll(/%\{(.*?)\}%/gs) ]
        .map(x => x[1].trim())

    const matchedRules = g
        .replaceAll(/%\{(.*?)\}%/gs, '')                          // remove the pasta
        .replaceAll(/--.*/g, '')                                  // remove comments
        .matchAll(/((`\w+`|\w+)(:\s*(\w+))?\s*=.+?)\s+;/gs);

    const left = g
        .replaceAll(/%\{(.*?)\}%/gs, '')                           // remove the pasta
        .replaceAll(/--.*/g, '')                                   // remove comments
        .replaceAll(/((`\w+`|\w+)(:\s*(\w+))?\s*=.+?)\s+;/gs, '')  // remove the rules
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


    return [
        ...(options.noPrelude ? [] : [ prelude ]),
        ...pasta,
        ...rules
    ].join('\n');
}

main();
