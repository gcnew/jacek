
import * as fs from 'fs';
import { parse, grammar } from './gen/parser'
import { generate } from './generator'

function main() {
    const [node, self, grammarFile] = process.argv;
    if (!grammarFile) {
        console.log('syntax: bootstrap <grammar-file>');
        process.exit(1);
    }

    const source = fs.readFileSync(grammarFile, 'utf-8');
    const parsed = parse(grammar, source, grammarFile);

    // for (let i = 0; i < 100000; ++i) {
    //     parse(grammar, source, grammarFile);
    // }

    if (parsed.kind === 'left') {
        console.log(parsed.value);
        process.exit(1);
    }

    const generated = generate(parsed.value);
    console.log(generated);
}


main();
