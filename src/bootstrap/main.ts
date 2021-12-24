
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
    const compiled = seq.split(/ +/)
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
    const [_0, name, _1, type, ruleBody] = /^(\w+)(:\s*(\w+))?\s*= *(.*)$/s.exec(rule)!;

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
