import { test } from 'pietr'

import * as assert from 'assert'

console.log(import.meta.url);

test('print suite', () => {
    const [_, filename, ext] = /\/?([^\/]+?)(\.\w+)?$/.exec(import.meta.url);
    console.log('\n' + filename + ' 1:');
});

test('bla', () => {});
test('bla', () => {});
test('bla', () => {});
test('bla', () => {});


test('\nprint suite #2', () => {
    const [_, filename, ext] = /\/?([^\/]+?)(\.\w+)?$/.exec(import.meta.url);
    console.log('\n' + filename + ' 2:');
});

test('bla', () => {});
test('bla', () => {});
test('bla', () => {});
test('bla', () => {});

