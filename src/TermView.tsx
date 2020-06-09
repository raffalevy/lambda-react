import * as React from 'react';

import { Term, TermKind } from './lambda';

export default function TermView(props: TermViewProps) {

    const [isHovered, setIsHovered] = React.useState(false)

    const attrs = {
        onClick: (e: React.MouseEvent) => {
            if (props.selectablePredicate && !props.selectablePredicate(props.term)) {
                return;
            }
            e.stopPropagation()
            if (props.onClick) {
                props.onClick(props.term)
            }
            setIsHovered(false)
        },
        className: 'term-view ' + kindToClassName(props.term.kind),
        onMouseMove: (e: React.MouseEvent) => {
            if (props.selectablePredicate && !props.selectablePredicate(props.term)) {
                return;
            }
            e.stopPropagation()
            setIsHovered(true)
        },
        onMouseOut: (e: React.MouseEvent) => {
            if (props.selectablePredicate && !props.selectablePredicate(props.term)) {
                return;
            }
            e.stopPropagation()
            setIsHovered(false)
        }
    }

    if (isHovered) {
        attrs.className += ' term-view-hovered'
    }

    switch (props.term.kind) {
        case TermKind.Var: return <span {...attrs}>
            &#32;{props.term.symbol}&#32;
        </span>;
        case TermKind.Abs: return <span {...attrs}>
            &#32;{
                props.isInsideApp ? <span className='paren'>(</span> : null
            } &lambda;{props.term.param}. <TermView term={props.term.body} onClick={props.onClick} selectablePredicate={props.selectablePredicate} />{
                props.isInsideApp ? <span className='paren'>)</span> : null
            }&#32;
        </span>;
        case TermKind.App: return <span {...attrs}>&#32;
            {
                props.isInsideAppSecond ? <span className='paren'>(</span> : null
            }
            <TermView term={props.term.first} onClick={props.onClick} selectablePredicate={props.selectablePredicate} isInsideApp />
            <TermView term={props.term.second} onClick={props.onClick} selectablePredicate={props.selectablePredicate} isInsideApp isInsideAppSecond />
            {
                props.isInsideAppSecond ? <span className='paren'>)</span> : null
            }
        &#32;</span>;
    }

    // return <>{JSON.stringify(props.term)}</>
}

interface TermViewProps {
    term: Term,
    isInsideApp?: boolean,
    isInsideAppSecond?: boolean,
    onClick?: (termReference: Term) => void,
    selectablePredicate?: (term: Term) => boolean,
}

function kindToClassName(k: TermKind) {
    switch (k) {
        case TermKind.Var: return 'term-view-var'
        case TermKind.Abs: return 'term-view-abs'
        case TermKind.App: return 'term-view-app'
    }
}