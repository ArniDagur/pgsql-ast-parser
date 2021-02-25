import { compile, keywords } from 'https://deno.land/x/moo@0.5.1-deno.2/mod.ts';
import { LOCATION, PGComment, StatementLocation } from './syntax/ast.ts';
import { sqlKeywords } from './keywords.ts';
export { LOCATION } from './syntax/ast.ts';

// build keywords
const keywodsMap: any = {};
for (const k of sqlKeywords) {
    keywodsMap['kw_' + k.toLowerCase()] = k;
}
const caseInsensitiveKeywords = (map: any) => {
    const transform = keywords(map)
    return (text: string) => transform(text.toUpperCase())
}


// build lexer
export const lexer = compile({
    word: {
        match: /[eE](?!')[A-Za-z0-9_]*|[a-df-zA-DF-Z][A-Za-z0-9_]*/,
        type: caseInsensitiveKeywords(keywodsMap),
        value: x => x.toLowerCase(),
    },
    wordQuoted: {
        match: /"(?:[^"\*]|"")+"/,
        type: () => 'word',
        // value: x => x.substr(1, x.length - 2),
    },
    string: {
        match: /'(?:[^']|\'\')*'/,
        value: x => {
            return x.substr(1, x.length - 2)
                .replace(/''/g, '\'');
        },
    },
    eString: {
        match: /\b(?:e|E)'(?:[^'\\]|[\r\n\s]|(?:\\\s)|(?:\\\n)|(?:\\.)|(?:\'\'))+'/,
        value: x => {
            return x.substr(2, x.length - 3)
                .replace(/''/g, '\'')
                .replace(/\\([\s\n])/g, (_, x) => x)
                .replace(/\\./g, m => JSON.parse('"' + m + '"'));
        },
    },
    qparam: {
        match: /\$\d+/,
    },
    star: '*',
    comma: ',',
    space: { match: /[\s\t\n\v\f\r]+/, lineBreaks: true, },
    int: /\-?\d+(?![\.\d])/,
    float: /\-?(?:(?:\d*\.\d+)|(?:\d+\.\d*))/,
    // word: /[a-zA-Z][A-Za-z0-9_\-]*/,
    commentLine: /\-\-.*?$[\s\r\n]*/,
    commentFull: /(?<!\/)\/\*(?:.|[\r\n])*?\*\/[\s\r\n]*/,
    lparen: '(',
    rparen: ')',
    lbracket: '[',
    rbracket: ']',
    semicolon: ';',
    dot: /\.(?!\d)/,
    op_cast: '::',
    op_plus: '+',
    op_eq: '=',
    op_neq: {
        match: /(?:!=)|(?:\<\>)/,
        value: () => '!=',
    },
    op_minus: /(?<!\-)\-(?!\-)(?!\>)/,
    op_div: /(?<!\/)\/(?!\/)/,
    op_like: /(?<!\!)~~(?!\*)/, // ~~ =LIKE
    op_ilike: /(?<!\!)~~\*/, // ~~* =ILIKE
    op_not_like: /\!~~(?!\*)/, // !~~ =LIKE
    op_not_ilike: /\!~~\*/, // !~~* =ILIKE
    op_mod: '%',
    op_exp: '^',
    op_member: /\-\>(?!\>)/,
    op_membertext: '->>',
    op_additive: {
        // group other additive operators
        match: ['||', '-', '#-', '&&'],
    },
    op_compare: {
        // group other comparison operators
        // ... to add: "IN" and "NOT IN" that are matched by keywords
        match: ['>', '>=', '<', '<=', '@>', '<@', '?', '?|', '?&', '#>>'],
    },
    codeblock: {
        match: /\$\$(?:.|[\s\t\n\v\f\r])*\$\$/s,
        lineBreaks: true,
        value: (x: string) => x.substr(2, x.length - 4),
    },
});

lexer.next = (next => () => {
    let tok;
    while (tok = next.call(lexer)) {
        if (tok.type === 'space') {
            continue;
        }
        if (tok.type === 'commentLine' || tok.type === 'commentFull') {
            comments?.push({
                [LOCATION]: { start: tok.offset, end: tok.offset + tok.text.length },
                comment: tok.text,
            })
            continue;
        }
        break;
    }

    if (trackingLoc && tok) {
        const start = tok.offset;
        const loc: StatementLocation = {
            start,
            end: start + tok.text.length,
        };
        (tok as any)[LOCATION] = loc;
    }
    return tok;
})(lexer.next);

export const lexerAny: any = lexer;

let comments: PGComment[] | null = null;

export function trackingComments<T>(act: () => T): { ast: T; comments: PGComment[] } {
    if (comments) {
        throw new Error('WAT ? Recursive comments tracking 🤔🤨 ?');
    }
    try {
        comments = [];
        const ast = act();
        return { comments, ast };
    } finally {
        comments = null;
    }
}

let trackingLoc = false;
export function tracking<T>(act: () => T): T {
    if (trackingLoc) {
        return act();
    }
    try {
        trackingLoc = true;
        return act();
    } finally {
        trackingLoc = false;
    }
}

export function track(xs: any, ret: any) {
    if (!trackingLoc || !ret || typeof ret !== 'object') {
        return ret;
    }
    const start = seek(xs, true);
    const end = seek(xs, false);
    if (!start || !end) {
        return ret;
    }
    if (start === end) {
        ret[LOCATION] = start;
    } else {
        const loc: StatementLocation = {
            start: start.start,
            end: end.end,
        };
        ret[LOCATION] = loc;
    }

    return ret;
}

const literal = Symbol('_literal');
export function box(xs: any, value: any) {
    if (!trackingLoc) {
        return value;
    }
    return track(xs, { [literal]: value });
}
export function unbox(value: any): any {
    if (!trackingLoc) {
        return value;
    }
    if (typeof value === 'object') {
        return value?.[literal] ?? value;
    }
    return value;
}


function seek(xs: any, start: boolean): StatementLocation | null {
    if (!xs) {
        return null;
    }
    if (Array.isArray(xs)) {
        const diff = start ? 1 : -1;
        for (let i = start ? 0 : xs.length - 1; i >= 0 && i < xs.length; i += diff) {
            const v = seek(xs[i], start);
            if (v) {
                return v;
            }
        }
        return null;
    }
    if (typeof xs !== 'object') {
        return null;
    }
    return xs[LOCATION];
}
