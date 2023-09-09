
NC='\033[0m'
RED='\033[0;31m'
GREEN='\033[0;32m'

(
    set -e
    set -x
    set -v

    rm -f src/gen/parser.ts src/gen/parser2.ts src/gen/parser3.ts

    tsc -p tsconfig.boot.json
    node built/bootstrap/main.js resources/grammar.g > src/gen/parser.ts

    tsc
    node built/main.js resources/grammar.g > src/gen/parser2.ts

    tsc
    mv built/gen/parser.js built/gen/parserB.js
    mv built/gen/parser2.js built/gen/parser.js
    node built/main.js resources/grammar.g > src/gen/parser3.ts

    diff src/gen/parser2.ts src/gen/parser3.ts > /dev/null
    echo "${GREEN}Success!${NC}"
)

if [ $? != 0 ]; then
    echo "${RED}FAILED!${NC}"
    exit 1
fi
