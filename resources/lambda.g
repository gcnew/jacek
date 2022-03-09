
%{
type Variable    = { kind: 'var',    value: string, start: number, end: number   }
type Lambda      = { kind: 'lambda', arg:   string, body:  Expr,   start: number }

type Application = { kind: 'app',    fn: Expr, arg: Expr }

type Expr        = Variable
                 | Lambda
                 | Application
}%

variable = /\w+/                          %% { kind: 'var', value: text(), start, end } as Variable
         ;

lambda = 'λ' variable '.' expr            %% { kind: 'lambda', arg: $1.value, body: $3, start } as Lambda
       ;

simpleExpr: Expr = lambda
                 | '(' expr ')'           %% $1
                 | variable
                 ;

application = ' ' simpleExpr              %% $1
            ;

expr = simpleExpr application*            %% $1.reduce((fn, arg) => ({ kind: 'app', fn, arg }), $0)
                  ;


eof = /$/
    ;

program = expr eof
        ;


%{
/* ====== Interpreter ====== */

type Scope = { [key: string]: Value | undefined }

type Value = { kind: 'value',   value: string }
           | { kind: 'closure', arg:   string, body: Expr, closed: Scope }

function run(source: string) {
    const parsed = parse(program, source);

    if (parsed.kind === 'left') {
        console.log(parsed.value);
        return;
    }

    const ast = parsed.value;
    const res = reduce(ast, {});
    console.log(show(res));
}

function reduce(expr: Expr, scope: Scope): Value {
    switch (expr.kind) {
        case 'var':
            return scope[expr.value] || { kind: 'value', value: expr.value };

        case 'lambda':
            return { kind: 'closure', arg: expr.arg, body: expr.body, closed: scope };

        case 'app':
            const fn = reduce(expr.fn, scope);
            const arg = reduce(expr.arg, scope);

            if (fn.kind !== 'closure') {
                throw { kind: 'bad_reduction', expr, scope };
            }

            const newScope = { ...fn.closed, [fn.arg]: arg };
            return reduce(fn.body, newScope);
    }
}

function show(x: Value | Expr, lookup?: Scope): string {
    switch (x.kind) {
        case 'value':
            return x.value;

        case 'closure':
            return 'λ' + x.arg + '.' + show(x.body, x.closed);

        case 'var':
            const found = lookup?.[x.value];

            return found ? show(found, lookup)
                         : x.value;

        case 'lambda':
            return 'λ' + x.arg + '.' + show(x.body, lookup);

        case 'app':
            return '(' + show(x.fn, lookup) + ') ' + show(x.arg, lookup);
    }
}

run('(λx.λa.x) a');
run('(λx.λy.y x) (λy.y)');
run('(λx.λy.λf.f x y) ((λx.λa.x) a) ((λx.λa.x) a)');
}%
