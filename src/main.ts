
import * as fs from 'fs';
import { grammar } from './gen/parser'

function main() {
    const [node, self, grammarFile] = process.argv;
    if (!grammarFile) {
        console.log('syntax: bootstrap <grammar-file>');
        process.exit(1);
    }

    const contents = fs.readFileSync(grammarFile, 'utf-8');
    const parsed = grammar(contents, 0);

    console.log(JSON.stringify(parsed, null, 4));
}

main();
