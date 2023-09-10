
import type {
    Grammar, Rule, Alternative, Rep, SimplePattern, Group
} from './gen/parser'

import * as fs from 'fs';

const prelude = fs.readFileSync(require.resolve('../src/prelude.ts'), 'utf8');

export function generate(g: Grammar) {
    const pasta = g.pasta
        .map(x => x.text.text.trim());

    const rules = g.rules
        .map(compileRule);

    return [
        ... pasta,
        ... rules,
        prelude
    ].join('\n\n');
}

function compileRule(r: Rule) {
    const name = r.id?.text || '$macro';

    const alternatives = r.alternatives
        .map(x => compileAlternative(x));

    const alternativesHeader = alternatives.length === 1
        ? []
        : alternatives.map((alt, idx) => {
            // TODO: add a comment with the grammar
            return [
                `function ${name}_$alt${idx + 1}(input: string, start: number) {`,
                indent(alt),
                '}'
            ].join('\n');
        });

    const ruleBody = alternatives.length === 1
        ? alternatives[0]
        : alternatives
            .map((_, idx) => {
                // the last alternative should be attempted without try/catch
                if (idx === alternatives.length - 1) {
                    return `return ${name}_$alt${idx + 1}(input, start);`;
                }

                return [
                    'try {',
                    `    return ${name}_$alt${idx + 1}(input, start);`,
                    '} catch(e: unknown) {',
                    '    if ((e as $NoMatch).idx !== start)',
                    '        throw e;',
                    '}'
                ].join('\n');
            })
            .join('\n\n');

    const type = r.type?.text === 'infer'
        ? `: $Match<\n${indent(alternatives.map((_, idx) => `ReturnType<typeof ${name}_$alt${idx + 1}>[0]`).join('|\n'))}\n>`
        : r.type ? `: $Match<${r.type.text}>` : '';

    const ruleDef = r.kind === 'templateRule'
        ? [
            `export function ${name}<S extends string>($s: S)${type} {`,
            `    const ${r.template.text} = $lit($s);`,
            `    return (input: string, start: number) => {`,
                    indent(indent(ruleBody)),
            `    };`,
            `}`
        ].join('\n')
        :[
            `export function ${name}(input: string, start: number)${type} {`,
                indent(ruleBody),
            '}'
        ].join('\n');

    // TODO: add a comment with the grammar
    return [
        ... alternativesHeader,
        ruleDef
    ].join('\n\n');
}

function compileAlternative(alt: Alternative) {
    const patterns = alt.patterns
        .map(compileRep)
        .map((p, idx) => {
            const start = idx === 0 ? 'start' : `$end${idx - 1}`;
            return `const [$${idx}, $end${idx}] = ${p}(input, ${start});`
        });

    const mapper = (alt.mapper?.text || '$0')
        .replace(/\btext\(\)/, `input.slice(start, $end${patterns.length - 1})`)
        .replace(/\B\$start(\d+)\b/g, (_, idx) => idx === '0' ? 'start' : `$end${Number(idx) - 1}`);

    const endShim = /\bend\b/.test(alt.mapper?.text || '')
        ? [ `const end = $end${patterns.length - 1};` ]
        : [];

    return [
        ...patterns,
        '',
        ...endShim,
        `const $mapped = ${indent(mapper, false)};`,
        `return [$mapped, $end${patterns.length - 1}] as const;`
    ].join('\n');
}

function compileRep(rep: Rep) {
    const pattern = compileSimplePattern(rep.pattern);

    return rep.modifier
        ? modifierToRepeater(rep.modifier.text) + '(' + pattern + ')'
        : pattern;
}

function modifierToRepeater(x: '?' | '*' | '+') {
    switch (x) {
        case '?': return '$opt';
        case '*': return '$many';
        case '+': return '$many1';
    }
}

function compileSimplePattern(pat: SimplePattern): string {
    switch (pat.kind) {
        case 'literal':    return `$lit('${pat.text.replaceAll('\'', '\\\'')}')`;
        case 'regexp':     return `$rx(/^${pat.text.slice(1)})`;
        case 'any':        return `$any`;
        case 'apply':      return mapIntrinsic(pat.func.text) + '(' + compileSimplePattern(pat.pattern) + ')';
        case 'id':         return pat.text;
        case 'template':   return (pat.func?.text || '$macro') + `('${pat.text.replaceAll('\'', '\\\'')}')`;
        case 'group':      return compileGroup(pat);
        case 'variable':   return `$lit(${pat.text})`;
    }
}

function mapIntrinsic(func: string) {
    switch (func) {
        case 'not':       return '$not';
        case 'try':       return '$try';
        case 'look':      return '$look';
        case 'backtrack': return '$backtrack';

        default: {
            return func;
        }
    }
}

function compileGroup(group: Group): string {
    const patterns = group.patterns
        .map(x => compileRep(x.pattern))
        .map((p, idx) => {
            const start = idx === 0 ? 'start' : `$end${idx - 1}`;
            return `const [$${idx}, $end${idx}] = ${p}(input, ${start});`
        });

    const toExtract = group.patterns
        .flatMap(({ important }, idx) => important ? [idx] : []);

    const projection = toExtract.length === 0 ? `[ ${patterns.map((_, i) => '$' + i).join(', ')} ]` :  // extract all matches in a tuple
                       toExtract.length === 1 ? '$' + toExtract[0]                                     // extract a single result
                                              : `[ ${toExtract.map(i => '$' + i).join(', ')} ]`;       // extract the selected

    const body = [
        ...patterns,
        '',
        `return [ ${projection}, $end${patterns.length - 1}] as const;`
    ].join('\n');

    return [
        `((input: string, start: number) => {`,
            indent(body),
        `})`,
    ].join('\n');
}

function indent(s: string, all = true) {
    return (all ? '    ' : '') + s.replace(/\n/g, '\n    ');
}
