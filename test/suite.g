%{

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

}%


stringLiteral = 'abcd'
              ;

regExp = /abcd/
       ;

seq = 'a' /b/ 'c' /d/            %% $0 + $1 + $2 + $3
    ;

ref = seq regExp stringLiteral   %% $0 + $1 + $2
    ;

alternatives = seq
             | 'def'
             | /geh/
             ;

eeff = 'ee'
     | 'ff'
     ;

mappingTypes = 'aa' 'bb'? 'cc'* 'dd'+ eeff /gg/ not('hh') .  %% ((aa: 'aa', bb: 'bb'|undefined, cc: 'cc'[], dd: 'dd'[], eeff: 'ee'|'ff', gg: string, n: string, any: string) => aa + bb + cc.join('') + dd.join('') + eeff + gg + n + any)($0, $1, $2, $3, $4, $5, $6, $7)
             ;

mappingAlternative = 'aaa' 'bbb'      %% $1
                   | 'default'
                   | 'a'+ ':' 'b'*    %% [ ...$0, ...$2 ]
                   ;

textMapping = 'a' 'b' 'c' 'd'         %% text()
            ;
