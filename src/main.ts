
import * as fs from 'fs';
import { parse, grammar } from './gen/parser'
import type { Grammar, Rule, Pattern, Rep, SimplePattern, Modifier, Literal, Regexp, Id } from './gen/parser'

function main() {
    const [node, self, grammarFile] = process.argv;
    if (!grammarFile) {
        console.log('syntax: bootstrap <grammar-file>');
        process.exit(1);
    }

    const source = fs.readFileSync(grammarFile, 'utf-8');
    const parsed = parse(grammar, source, grammarFile);

    if (parsed.kind === 'left') {
        console.log(parsed.value);
        process.exit(1);
    }

    compileGrammar(parsed.value);
}


function compileGrammar(grammar: Grammar) {
    const pasta = grammar.pasta
        .map(x => x.text.text.trim());

    const rules = grammar.rules
        .map(compileRule);

    const prelude = '';

    return [ prelude, ...pasta, ...rules ].join('\n');
}

function compileRule(rule: Rule) {
    const alternatives = compileAlternatives(rule.alternatives);

    return `
function ${rule.id.text}(input: string, start: number)${rule.type ? `: $Match<${rule.type.text}>` : ''} {
    ${alternatives.join('\n')}
}
`;
}

function compileAlternatives(patterns: Pattern[]) {
    const compiled = patterns
        .map(compilePattern);

}

function compilePattern(pattern: Pattern) {
    const parts = pattern.seq
        .map((x, idx) => compileSimple(x.pattern, idx, x.modifier))

    const mapper = (pattern.mapper?.text || '$0')
        .replace('text()', `input.substring(start, $end${parts.length - 1})`);

    return `
    ${parts.join('\n')}

    const $result = ${mapper};
    return { kind: 'right', value: [ end, $result ] } as const;
`
}

function compileSimple(simple: SimplePattern, idx: number, modifier?: Modifier): string {
    switch (simple.kind) {
        case 'id': return compileId(simple.text, idx, modifier);
        case 'literal': return compileLiteral(simple.text, idx, modifier);
        case 'regexp': return compileRegExp(simple.text, idx, modifier);
        case 'any': return compileAny(idx, modifier);
        case 'not': return compileNot(simple.pattern, idx, modifier);
    }
}

function compileId(id: string, idx: number, modifier?: Modifier): string {
    const start = getStart(idx);

    if (!modifier) {
    return `
    const $tmp${idx} = ${id}(input, ${start});
    if ($tmp${idx}.kind === 'left') {
        return $tmp${idx};
    }
    const [$end${idx}, $${idx}] = $tmp${idx}.value;`;
    }

    if (modifier === '?') {
    return `
    const $tmp${idx} = ${id}(input, ${start});
    if ($tmp${idx}.kind === 'left' && $tmp${idx}.value.idx === ${start}) {
        return $tmp${idx};
    }
    const [$end${idx}, $${idx}] = ($tmp${idx}.kind === 'left')
        ? [${start}, undefined]
        : $tmp${idx}.value;`;
    }

    if (modifier === '*') {
    return `
    const $${idx} = [];
    let $end${idx} = ${start};
    while (true) {
        const $tmp${idx} = ${id}(input, $end${idx});
        if ($tmp${idx}.kind === 'left') {
            if ($tmp${idx}.value.idx !== $end${idx}) {
                return $tmp${idx};
            }
            break;
        }
        $${idx}.push($tmp${idx}.value[1]);
        $end${idx} = $tmp${idx}.value[0];
    }`;
    }

    if (modifier === '+') {
    return `
    const $tmp${idx} = ${id}(input, ${start});
    if ($tmp${idx}.kind === 'left') {
        return $tmp${idx};
    }
    const $${idx} = [ $tmp${idx}.value[1] ];
    let $end${idx} = $tmp${idx}.value[0];
    while (true) {
        const $tmp${idx} = ${id}(input, $end${idx});
        if ($tmp${idx}.kind === 'left') {
            if ($tmp${idx}.value.idx !== $end${idx}) {
                return $tmp${idx};
            }
            break;
        }
        $${idx}.push($tmp${idx}.value[1]);
        $end${idx} = $tmp${idx}.value[0];
    }`;
    }

    assertNever(modifier);
}

function compileLiteral(literal: string, idx: number, modifier?: Modifier): string {
    const start = getStart(idx);

    if (!modifier) {
    return `
    if (!input.startsWith(${literal}, ${start})) {
        return { kind: 'left', value: { idx: ${start}, expected: ${literal} } } as const;
    }
    const [ $end${idx}, $${idx} ] = [ ${start} + ${literal}.length, ${literal} ];`;
    }

    if (modifier === '?') {
    return `;
    const [$end${idx}, $${idx}] = input.startsWith(${literal}, ${start})
        ? [${start} + ${literal}.length, ${literal}]
        : [${start}, undefined];`;
    }

    if (modifier === '*') {
    return `
    const $${idx} = [];
    let $end${idx} = ${start};
    while (true) {
        if (!input.startsWith(${literal}, $end${idx})) {
            break;
        }
        $${idx}.push(${literal});
        $end${idx} = $end${idx} + ${literal}.length;
    }`;
    }

    if (modifier === '+') {
    return `
    if (!input.startsWith(${literal}, ${start})) {
        return { kind: 'left', value: { idx: ${start}, expected: ${literal} } } as const;
    }
    const $${idx} = [ ${literal} ];
    let $end${idx} = ${start} + ${literal}.length;
    while (true) {
        if (!input.startsWith(${literal}, $end${idx})) {
            break;
        }
        $${idx}.push(${literal});
        $end${idx} = $end${idx} + ${literal}.length;
    }`;
    }

    assertNever(modifier);
}

function compileRegExp(rx: string, idx: number|string, modifier?: Modifier): string {
    const start = getStart(idx);

    if (!modifier) {
    return `
    const $tmp${idx} = /^${rx.substr(1)}.exec(input.substring(${start}));
    if (!$tmp${idx}) {
        return { kind: 'left', value: { expected: ${rx}, idx: ${start} } } as const;
    }
    const [$end${idx}, $${idx}]  = [ ${start} + $tmp${idx}[0].length, $tmp${idx}[0] ];`;
    }

    if (modifier === '?') {
    return `;
    const $tmp${idx} = /^${rx.substr(1)}.exec(input.substring(${start}));
    const [$end${idx}, $${idx}] = $tmp${idx}
        ? [${start} + $tmp${idx}[0].length, $tmp${idx}[0]]
        : [${start}, undefined];`;
    }

    if (modifier === '*') {
    return `
    const $${idx} = [];
    let $end${idx} = ${start};
    while (true) {
        const $tmp${idx} = /^${rx.substr(1)}.exec(input.substring($end${idx}));
        if (!$tmp${idx}) {
            break;
        }
        $${idx}.push($tmp${idx}[0]);
        $end${idx} = $end${idx} + $tmp${idx}[0].length;
    }`;
    }

    if (modifier === '+') {
    return `
    const $tmp${idx} = /^${rx.substr(1)}.exec(input.substring($end${idx}));
    if (!$tmp${idx}) {
        return { kind: 'left', value: { expected: ${rx}, idx: ${start} } } as const;
    }
    const $${idx} = [ $tmp${idx}[0] ];
    let $end${idx} = ${start} + $tmp${idx}[0].length;
    while (true) {
        const $tmp${idx} = /^${rx.substr(1)}.exec(input.substring($end${idx}));
        if (!$tmp${idx}) {
            break;
        }
        $${idx}.push($tmp${idx}[0]);
        $end${idx} = $end${idx} + $tmp${idx}[0].length;
    }`;
    }

    assertNever(modifier);
}


function getStart(idx: number|string) {
    if (typeof idx === 'number') {
        if (idx > 0) {
            return `$end{idx - 1}`;
        }

        return 'start';
    }
}


function compileAny(idx: number, modifier?: Modifier): string {
    const start = getStart(idx);

    if (!modifier) {
    return `
    if (input.length === ${start}) {
        return { kind: 'left', value: { expected: '<any>', idx: ${start} } } as const;
    }
    const [ $end${idx}, $${idx} ] = [ ${start} + 1, input[${start}] ];`;
    }

    if (modifier === '?') {
        return `
    const [$end${idx}, $${idx}] = input.length !== ${start}
        ? [${start} + 1, input[${start}]]
        : [${start}, undefined];`;
    }

    if (modifier === '*') {
        return `
    const [$end${idx}, $${idx}] = [ input.length, input.substring(${start} ];`;
    }

    if (modifier === '+') {
        return `
    if (input.length === ${start}) {
        return { kind: 'left', value: { expected: '<any>', idx: ${start} } } as const;
    }
    const [$end${idx}, $${idx}] = [ input.length, input.substring(${start} ];`;
    }

    assertNever(modifier);
}

function compileNot(pattern: Literal | Regexp | Id, idx: number, modifier?: Modifier): string {
    const start = getStart(idx);

    const check = pattern.kind === 'literal' ? `input.startsWith(${pattern.text}, $end${idx})`
        : pattern.kind === 'regexp' ? `/^${pattern.text.substr(1)}.test(input.substring($end${idx}))`
        : pattern.kind === 'id'? `${pattern.text}(input, $end${idx}).kind === 'right'`
        : assertNever(pattern);

    if (!modifier) {
        return `
    if (input.length === ${start}) {
        return { kind: 'left', value: { expected: '<not>', idx: ${start} } } as const;
    }
    const [ $end${idx}, $${idx} ] = [ ${start} + 1, input[${start}] ];`;
    }
}

function assertNever(x: never): never {
    throw 'assert: not never: ' + x;
}

main();

