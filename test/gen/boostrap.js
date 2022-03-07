"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapping = exports.eeff = exports.alternatives = exports.ref = exports.seq = exports.regExp = exports.stringLiteral = exports.parse = exports.formatSimpleError = exports.parseLineOffsets = exports.getLineCol = void 0;
function getLineCol(offset, lineOffsetTable) {
    let idx = binarySearch(lineOffsetTable, x => x[0] < offset ? -1 :
        x[0] > offset ? 1 : 0);
    if (idx === false) {
        return null;
    }
    if (idx < 0) {
        idx = -idx - 1;
    }
    return [idx, offset - lineOffsetTable[idx][0]];
}
exports.getLineCol = getLineCol;
function parseLineOffsets(source) {
    const lines = source.split('\n');
    let acc = [];
    let offset = 0;
    for (const l of lines) {
        acc.push([offset, l]);
        offset += l.length + 1;
    }
    return acc;
}
exports.parseLineOffsets = parseLineOffsets;
function binarySearch(arr, compare) {
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
function formatSimpleError(error, lineOffsets, fileName) {
    const [lineNo, col] = getLineCol(error.idx, lineOffsets);
    const line = lineOffsets[lineNo][1];
    return [
        line,
        ' '.repeat(col) + '^',
        `${fileName ? fileName + ': ' : ''}${lineNo + 1}:${col + 1}: Expected ${error.expected}`
    ].join('\n');
}
exports.formatSimpleError = formatSimpleError;
function parse(grammar, source, fileName) {
    const result = grammar(source, 0);
    if (result.kind === 'left') {
        const lineOffsets = parseLineOffsets(source);
        const error = formatSimpleError(result.value, lineOffsets, fileName);
        return { kind: 'left', value: error };
    }
    return { kind: 'right', value: result.value[1] };
}
exports.parse = parse;
const pietr_1 = require("pietr");
const assert = __importStar(require("assert"));
(0, pietr_1.test)('title', () => {
    const [_, filename, ext] = /\/?([^\/]+?)(\.\w+)?$/.exec(__filename);
    console.log('\n\n' + filename + ':');
});
/*  ========== String Literal ======= */
(0, pietr_1.test)('string literal - succeeds if exact match', () => {
    const res = parsed(stringLiteral, 'abcd');
    assert.equal(res, 'abcd');
});
(0, pietr_1.test)('string literal - succeeds if suffxed', () => {
    const res = parsed(stringLiteral, 'abcdx');
    assert.equal(res, 'abcd');
});
(0, pietr_1.test)('string literal - fails if prefixed', () => {
    const res = fails(stringLiteral, 'xabcd');
    assert.equal(res, 'xabcd\n^\n1:1: Expected abcd');
});
(0, pietr_1.test)('string literal - fails if other', () => {
    const res = fails(stringLiteral, 'xxxxdddd');
    assert.equal(res, 'xxxxdddd\n^\n1:1: Expected abcd');
});
/*  ========== RegExp ======= */
(0, pietr_1.test)('regexp - succeeds if exact match', () => {
    const res = parsed(regExp, 'abcd');
    assert.equal(res, 'abcd');
});
(0, pietr_1.test)('regexp - succeeds if suffxed', () => {
    const res = parsed(regExp, 'abcdx');
    assert.equal(res, 'abcd');
});
(0, pietr_1.test)('regexp - fails if prefixed', () => {
    const res = fails(regExp, 'xabcd');
    assert.equal(res, 'xabcd\n^\n1:1: Expected /abcd/');
});
(0, pietr_1.test)('regexp - fails if other', () => {
    const res = fails(regExp, 'xxxxdddd');
    assert.equal(res, 'xxxxdddd\n^\n1:1: Expected /abcd/');
});
/*  ========== Seq ======= */
(0, pietr_1.test)('seq - succeeds if exact match', () => {
    const res = parsed(seq, 'abcd');
    assert.equal(res, 'abcd');
});
(0, pietr_1.test)('seq - succeeds if suffxed', () => {
    const res = parsed(seq, 'abcdx');
    assert.equal(res, 'abcd');
});
(0, pietr_1.test)('seq - fails if prefixed', () => {
    const res = fails(seq, 'xabcd');
    assert.equal(res, 'xabcd\n^\n1:1: Expected a');
});
(0, pietr_1.test)('seq - fails if other', () => {
    const res = fails(seq, 'xxxxdddd');
    assert.equal(res, 'xxxxdddd\n^\n1:1: Expected a');
});
/*  ========== ref ======= */
(0, pietr_1.test)('ref - succeeds if exact match', () => {
    const res = parsed(ref, 'abcdabcdabcd');
    assert.equal(res, 'abcdabcdabcd');
});
(0, pietr_1.test)('ref - succeeds if suffxed', () => {
    const res = parsed(ref, 'abcdabcdabcdx');
    assert.equal(res, 'abcdabcdabcd');
});
(0, pietr_1.test)('ref - fails if prefixed', () => {
    const res = fails(ref, 'xabcdabcdabcd');
    assert.equal(res, 'xabcdabcdabcd\n^\n1:1: Expected a');
});
(0, pietr_1.test)('ref - fails if other', () => {
    const res = fails(ref, 'xxxxdddd');
    assert.equal(res, 'xxxxdddd\n^\n1:1: Expected a');
});
function parsed(grammar, source) {
    const res = parse(grammar, source);
    if (res.kind === 'left') {
        throw new Error(res.value);
    }
    return res.value;
}
function fails(grammar, source) {
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
function stringLiteral(input, start) {
    let end = start;
    const $0 = 'abcd';
    if (!input.startsWith($0, end)) {
        return { kind: 'left', value: { kind: 'no_match', expected: $0, idx: end } };
    }
    end += $0.length;
    const text = () => input.substring(start, end);
    return { kind: 'right', value: [end, $0] };
}
exports.stringLiteral = stringLiteral;
function regExp(input, start) {
    let end = start;
    const $tmp$0 = /^abcd/.exec(input.substring(end));
    if (!$tmp$0) {
        return { kind: 'left', value: { kind: 'no_match', expected: /abcd/, idx: end } };
    }
    const $0 = $tmp$0[0];
    end += $0.length;
    const text = () => input.substring(start, end);
    return { kind: 'right', value: [end, $0] };
}
exports.regExp = regExp;
function seq(input, start) {
    let end = start;
    const $0 = 'a';
    if (!input.startsWith($0, end)) {
        return { kind: 'left', value: { kind: 'no_match', expected: $0, idx: end } };
    }
    end += $0.length;
    const $tmp$1 = /^b/.exec(input.substring(end));
    if (!$tmp$1) {
        return { kind: 'left', value: { kind: 'no_match', expected: /b/, idx: end } };
    }
    const $1 = $tmp$1[0];
    end += $1.length;
    const $2 = 'c';
    if (!input.startsWith($2, end)) {
        return { kind: 'left', value: { kind: 'no_match', expected: $2, idx: end } };
    }
    end += $2.length;
    const $tmp$3 = /^d/.exec(input.substring(end));
    if (!$tmp$3) {
        return { kind: 'left', value: { kind: 'no_match', expected: /d/, idx: end } };
    }
    const $3 = $tmp$3[0];
    end += $3.length;
    const text = () => input.substring(start, end);
    return { kind: 'right', value: [end, $0 + $1 + $2 + $3] };
}
exports.seq = seq;
function ref(input, start) {
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
    return { kind: 'right', value: [end, $0 + $1 + $2] };
}
exports.ref = ref;
function alternatives(input, start) {
    let end = start;
    const $cc0 = (input, start) => {
        let end = start;
        const $tmp$0 = seq(input, end);
        if ($tmp$0.kind === 'left') {
            return $tmp$0;
        }
        const [$end0, $0] = $tmp$0.value;
        end = $end0;
        const text = () => input.substring(start, end);
        return { kind: 'right', value: [end, $0] };
    };
    const $tmp$0 = $cc0(input, start);
    if ($tmp$0.kind === 'right') {
        return $tmp$0;
    }
    if ($tmp$0.kind === 'left' && !($tmp$0.value.kind === 'no_match' && $tmp$0.value.idx === end)) {
        return $tmp$0;
    }
    const $cc1 = (input, start) => {
        let end = start;
        const $0 = 'def';
        if (!input.startsWith($0, end)) {
            return { kind: 'left', value: { kind: 'no_match', expected: $0, idx: end } };
        }
        end += $0.length;
        const text = () => input.substring(start, end);
        return { kind: 'right', value: [end, $0] };
    };
    const $tmp$1 = $cc1(input, start);
    if ($tmp$1.kind === 'right') {
        return $tmp$1;
    }
    if ($tmp$1.kind === 'left' && !($tmp$1.value.kind === 'no_match' && $tmp$1.value.idx === end)) {
        return $tmp$1;
    }
    const $cc2 = (input, start) => {
        let end = start;
        const $tmp$0 = /^geh/.exec(input.substring(end));
        if (!$tmp$0) {
            return { kind: 'left', value: { kind: 'no_match', expected: /geh/, idx: end } };
        }
        const $0 = $tmp$0[0];
        end += $0.length;
        const text = () => input.substring(start, end);
        return { kind: 'right', value: [end, $0] };
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
exports.alternatives = alternatives;
function eeff(input, start) {
    let end = start;
    const $cc0 = (input, start) => {
        let end = start;
        const $0 = 'ee';
        if (!input.startsWith($0, end)) {
            return { kind: 'left', value: { kind: 'no_match', expected: $0, idx: end } };
        }
        end += $0.length;
        const text = () => input.substring(start, end);
        return { kind: 'right', value: [end, $0] };
    };
    const $tmp$0 = $cc0(input, start);
    if ($tmp$0.kind === 'right') {
        return $tmp$0;
    }
    if ($tmp$0.kind === 'left' && !($tmp$0.value.kind === 'no_match' && $tmp$0.value.idx === end)) {
        return $tmp$0;
    }
    const $cc1 = (input, start) => {
        let end = start;
        const $0 = 'ff';
        if (!input.startsWith($0, end)) {
            return { kind: 'left', value: { kind: 'no_match', expected: $0, idx: end } };
        }
        end += $0.length;
        const text = () => input.substring(start, end);
        return { kind: 'right', value: [end, $0] };
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
exports.eeff = eeff;
function mapping(input, start) {
    let end = start;
    const $0 = 'aa';
    if (!input.startsWith($0, end)) {
        return { kind: 'left', value: { kind: 'no_match', expected: $0, idx: end } };
    }
    end += $0.length;
    const $cc1 = (input, start) => {
        const $1 = 'bb';
        if (!input.startsWith($1, end)) {
            return { kind: 'left', value: { kind: 'no_match', expected: $1, idx: end } };
        }
        end += $1.length;
        return { kind: 'right', value: $1 };
    };
    let $1;
    const $tmp$1 = $cc1(input, end);
    if ($tmp$1.kind === 'left') {
        if (!($tmp$1.value.kind === 'no_match' && $tmp$1.value.idx === end)) {
            return $tmp$1;
        }
        $1 = undefined;
    }
    else {
        $1 = $tmp$1.value;
    }
    const $cc2 = (input, start) => {
        const $2 = 'cc';
        if (!input.startsWith($2, end)) {
            return { kind: 'left', value: { kind: 'no_match', expected: $2, idx: end } };
        }
        end += $2.length;
        return { kind: 'right', value: $2 };
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
    const $cc3 = (input, start) => {
        const $3 = 'dd';
        if (!input.startsWith($3, end)) {
            return { kind: 'left', value: { kind: 'no_match', expected: $3, idx: end } };
        }
        end += $3.length;
        return { kind: 'right', value: $3 };
    };
    const $tmp$3_1 = $cc3(input, end);
    if ($tmp$3_1.kind === 'left') {
        return $tmp$3_1;
    }
    let $3 = [$tmp$3_1.value];
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
        return { kind: 'left', value: { kind: 'no_match', expected: /gg/, idx: end } };
    }
    const $5 = $tmp$5[0];
    end += $5.length;
    const $cc6 = (input, start, end) => {
        const $6 = 'hh';
        if (!input.startsWith($6, end)) {
            return { kind: 'left', value: { kind: 'no_match', expected: $6, idx: end } };
        }
        end += $6.length;
        return { kind: 'right', value: $6 };
    };
    if ($cc6(input, end, end).kind === 'right') {
        return { kind: 'left', value: { kind: 'no_match', expected: '<not>', idx: end } };
    }
    if (input.length === end) {
        return { kind: 'left', value: { kind: 'no_match', expected: '<not>', idx: end } };
    }
    const $6 = input[end];
    end++;
    if (input.length === end) {
        return { kind: 'left', value: { kind: 'no_match', expected: '<any>', idx: end } };
    }
    const $7 = input[end];
    end++;
    const text = () => input.substring(start, end);
    return { kind: 'right', value: [end, ((aa, bb, cc, dd, eeff, gg, n, any) => aa + bb + cc.join('') + dd.join('') + eeff + gg + n + any)($0, $1, $2, $3, $4, $5, $6, $7)] };
}
exports.mapping = mapping;
