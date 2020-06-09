import { VarTerm, Term, AppTerm, AbsTerm } from "./lambda";

export function parseLambdaTerm(input: string) : Term | null {
    const st = new ParseState(input)
    const res = parseTerm(st)
    if (st.index >= input.length) {
        return res
    } else {
        return null
    }
}

const varNameRegex = /[a-zA-Z][a-zA-Z0-9]*/y
const whitespaceRegex = /\s+/y

class ParseState {
    index = 0
    stack: number[] = []
    constructor(public input: string) { }
}

type Parser<T> = (st: ParseState) => T | null

function mapParser<T, U>(p: Parser<T>, f: (res: T) => (U | null)): Parser<U> {
    return (st) => {
        const res = p(st)
        if (res) {
            return f(res)
        } else {
            return null
        }
    }
}

const parseWhitespace: Parser<true> = (st) => {
    whitespaceRegex.lastIndex = st.index
    const matchRes = whitespaceRegex.exec(st.input)
    if (matchRes) {
        st.index = whitespaceRegex.lastIndex
        return true
    } else {
        return null
    }
}

function maybeParser<T>(p: Parser<T>): Parser<T | true> {
    return (st) => {
        st.stack.push(st.index)
        const res = p(st)
        if (res) {
            st.stack.pop()
            return res
        } else {
            st.index = st.stack.pop()!
            return true
        }
    }
}

function tryParser<T>(p: Parser<T>): Parser<T> {
    return (st) => {
        st.stack.push(st.index)
        const res = p(st)
        if (res) {
            st.stack.pop()
            return res
        } else {
            st.index = st.stack.pop()!
            return null
        }
    }
}

function alternativeParser<T>(ps: Parser<T>[]): Parser<T> {
    return (st) => {
        for (let p of ps) {
            const res = tryParser(p)(st)
            if (res) {
                return res
            }
        }
        return null
    }
}

function parseToken<T>(p: Parser<T>): Parser<T> {
    return (st) => {
        maybeParser(parseWhitespace)(st)
        const res = p(st)
        if (!res) return null
        maybeParser(parseWhitespace)(st)
        return res
    }
}

function parseExact(str: string): Parser<true> {
    return st => {
        if (st.input.startsWith(str, st.index)) {
            st.index += str.length
            return true
        } else {
            return null
        }
    }
}

const parseVarName: Parser<string> =
    (st) => {
        const chars = [];

        varNameRegex.lastIndex = st.index
        const matchRes = varNameRegex.exec(st.input)
        if (matchRes) {
            st.index = varNameRegex.lastIndex
            return matchRes[0]
        } else {
            return null
        }
    }


function parseSome<T>(p: Parser<T>): Parser<T[]> {
    return (st) => {
        const res = p(st)
        if (!res) {
            return null
        }
        const vals = [res]

        while (true) {
            const res = tryParser(p)(st)
            if (res) {
                vals.push(res)
            } else {
                break
            }
        }
        return vals
    }
}

const parseLambdaToken: Parser<true> = parseToken(parseExact('\\'))

const parseDotToken: Parser<true> = parseToken(parseExact('.'))

function parseTerm(st: ParseState) {
    return (alternativeParser([
        parseApp, parseAbs
    ]))(st)
}

const parseOpenParen: Parser<true> = parseToken(parseExact('('))

const parseCloseParen: Parser<true> = parseToken(parseExact(')'))

const parseArg: Parser<Term> = alternativeParser([
    mapParser(parseToken(parseVarName), name => VarTerm(name)),
    (st) => {
        if (!parseOpenParen(st)) return null
        const res = parseTerm(st)
        if (!res) return null
        if (!parseCloseParen(st)) return null
        return res
    }
])

const parseApp: Parser<Term> = mapParser(parseSome(parseArg), args =>
    args.reduce((a, b) => AppTerm(a, b)))

const parseAbs: Parser<Term> = (st) => {
    if (!parseLambdaToken(st)) return null
    const paramName = parseVarName(st)
    if (!paramName) return null
    if (!parseDotToken(st)) return null
    const body = parseTerm(st)
    if (!body) return null
    return AbsTerm(paramName, body)
}
