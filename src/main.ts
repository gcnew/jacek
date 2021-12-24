
import * as fs from 'fs';
import { parse, grammar } from './gen/parser'

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

    console.log('Win!');
}


main();
