
export type Term = VarTerm | AbsTerm | AppTerm

export enum TermKind {
    Var, Abs, App
}

export interface VarTerm {
    kind: TermKind.Var,
    symbol: string
}

export interface AbsTerm {
    kind: TermKind.Abs,
    param: string,
    body: Term
}

export interface AppTerm {
    kind: TermKind.App,
    first: Term,
    second: Term
}

export function VarTerm(symbol: string): VarTerm {
    return {
        kind: TermKind.Var,
        symbol
    }
}

export function AbsTerm(param: string, body: Term): AbsTerm {
    return {
        kind: TermKind.Abs,
        param, body
    }
}

export function AppTerm(first: Term, second: Term): AppTerm {
    return {
        kind: TermKind.App,
        first, second
    }
}

export function freeVars(term: Term) {
    const fv : string[] = []
    const bv : string[] = []

    const termStack : (Term | 0)[] = [term]

    while (true) {
        const term = termStack.pop()
        if (term === 0) {
            bv.pop()
            continue
        } else if (!term) {
            return fv
        }

        switch (term.kind) {
            case TermKind.Var: {
                if (fv.indexOf(term.symbol) === -1 && bv.indexOf(term.symbol) === -1) {
                    fv.push(term.symbol)
                }
                continue
            }
            case TermKind.Abs: {
                bv.push(term.param)
                termStack.push(0)
                termStack.push(term.body)
                continue
            }
            case TermKind.App: {
                termStack.push(term.second)
                termStack.push(term.first)
                continue
            }
        }
    }
}

export function cloneTerm(term: Term) : Term {
    switch (term.kind) {
        case TermKind.Var:
            return VarTerm(term.symbol)
        case TermKind.Abs:
            return AbsTerm(term.param, cloneTerm(term.body))
        case TermKind.App:
            return AppTerm(cloneTerm(term.first), cloneTerm(term.second))
    }
}

export function substituteVar(term: Term, left: string, right: Term) : Term {
    switch (term.kind) {
        case TermKind.Var: {
            if (term.symbol === left) {
                return cloneTerm(right)
            } else {
                return term
            }
        }
        case TermKind.Abs: {
            if (term.param !== left) {
                const fvRight = freeVars(right)
                if (fvRight.indexOf(term.param) === -1) {
                    return AbsTerm(term.param, substituteVar(term.body, left, right))
                } else {
                    const newName = freshName(fvRight)
                    const newBody = substituteVar(term.body, term.param, VarTerm(newName))
                    return AbsTerm(newName, substituteVar(newBody, left, right))
                }
            } else {
                return term
            }
        }
        case TermKind.App: {
            return AppTerm(substituteVar(term.first, left, right), substituteVar(term.second, left, right))
        }
    }
}

function freshName(existingNames: string[]) {
    const i = 0;

    for (let i = 0;; i++) {
        const name = "v" + i.toString();
        if (existingNames.indexOf(name) === -1) {
            return name
        }
    }
}

export function betaReduce(func: AbsTerm, arg: Term) {
    return substituteVar(func.body, func.param, arg)
}

export function betaReduceInPlace(term: AppTerm) {
    if (term.first.kind !== TermKind.Abs) {
        return;
    }
    const newExpr = betaReduce(term.first, term.second);
    console.log(newExpr)
    // @ts-ignore
    Object.assign(term, newExpr)
}

export function alphaConvert(func: AbsTerm, newName: string) {
    if (freeVars(func.body).indexOf(newName) !== -1) {
        return null
    }
    const newBody = substituteVar(func.body, func.param, VarTerm(newName))
    return AbsTerm(newName, newBody)
}

export function alphaConvertInPlace(func: AbsTerm, newName: string) {
    const newExpr = alphaConvert(func, newName)
    if (newExpr) {
        // @ts-ignore
        Object.assign(func, newExpr)
        return true
    } else {
        return false
    }
}

export function termToString(t: Term, isInsideApp = false, isInsideAppSecond = false) : string {
    switch (t.kind) {
        case TermKind.Var:
            return varTermToString(t)
        case TermKind.Abs:
            return absTermToString(t, isInsideApp)
        case TermKind.App:
            return appTermToString(t, isInsideAppSecond)
    }
}

export function varTermToString(t: VarTerm) {
    return t.symbol
}

export function absTermToString(t: AbsTerm, isInsideApp: boolean) {
    const str = '\\' + t.param + '. ' + termToString(t.body)

    if (isInsideApp) {
        return '(' + str + ')'
    } else {
        return str
    }
}

export function appTermToString(t: AppTerm, isInsideAppSecond: boolean) {
    const str = termToString(t.first, true, false) + ' ' + termToString(t.second, true, true)

    if (isInsideAppSecond) {
        return '(' + str + ')'
    } else {
        return str
    } 
}