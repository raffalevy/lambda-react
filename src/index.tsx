import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { FunctionComponent } from 'react';

import TermView from './TermView';
import { AbsTerm, AppTerm, VarTerm, TermKind, freeVars, Term, betaReduceInPlace, alphaConvertInPlace, termToString } from './lambda';
import { parseLambdaTerm } from './parser';

const INTRO = (<>
    <h1>Interactive Lambda Calculus Evaluator</h1>
    <section className='intro'>
        <p>
            This app lets you experiment with expressions in
            the <a href='https://en.wikipedia.org/wiki/Lambda_calculus'>
                <em>&lambda;</em>-calculus.
            </a>
        </p>
    </section>
</>)

function App() {

    // console.log(parseLambdaTerm('(\\n. \\f. \\x. f (n f x)) (\\x.x)'))

    const [updateCount, setUpdateCount] = React.useState(0)

    const [selectedTool, setSelectedTool] = React.useState(Tool.Beta)

    const termRef = React.useRef(AppTerm(AbsTerm('f', AbsTerm('x', AppTerm(VarTerm('f'), VarTerm('x')))), AppTerm(VarTerm('y'), VarTerm('z'))));

    // const termRef = React.useRef(AppTerm(AppTerm(VarTerm('a'), VarTerm('b')), AppTerm(AppTerm(VarTerm('c'), VarTerm('d')), VarTerm('e'))))

    // const termRef = React.useRef(parseLambdaTerm('(\\n. \\f. \\x. f (n f x)) (\\x.x)')!)

    // const termRef = React.useRef(
    //     AppTerm(AbsTerm('x',
    //         AbsTerm('y',
    //             AppTerm(VarTerm('x'), VarTerm('y')))), VarTerm('y'))
    // )

    const { modal, showModal, hideModal } = useModal()

    function onTermClick(t: Term) {
        switch (selectedTool) {
            case Tool.Beta: {
                if (t.kind === TermKind.App && t.first.kind === TermKind.Abs) {
                    betaReduceInPlace(t)
                    setUpdateCount(updateCount + 1)
                }
                break;
            }
            case Tool.Alpha: {
                if (t.kind === TermKind.Abs) {
                    showModal("Alpha Convert",
                        <AlphaModalContent
                            showModal={showModal}
                            hideModal={hideModal}
                            oldName={t.param}
                            freeVarsInBody={freeVars(t.body)}
                            renameCallback={newName => {
                                alphaConvertInPlace(t, newName)
                                setUpdateCount(updateCount + 1)
                            }} />
                    )
                }
                break;
            }
        }
    }

    function onEditClick() {
        showModal('Edit Expression',
            <EditModalContent
                oldExpression={termToString(termRef.current)}
                editCallback={(newTerm) => {
                    Object.assign(termRef.current, newTerm)
                    setUpdateCount(updateCount + 1)
                }}
                showModal={showModal}
                hideModal={hideModal}
            />
        )
    }

    return <>
        <article>
            {INTRO}
            <Toolbar selected={selectedTool} onClick={setSelectedTool} onEditClick={onEditClick} />
            <section className='term-view-container'>
                <div className='term-view-container-inner'>
                    <TermView term={
                        termRef.current
                    } onClick={onTermClick} selectablePredicate={term => isSelectable(term, selectedTool)} />
                </div>
            </section>
        </article>
        {modal}
    </>
}

enum Tool {
    Beta = '\u03B2 Reduce Expression',
    Alpha = '\u03B1 Rename Parameter'
}

const TOOLS = [
    Tool.Beta,
    Tool.Alpha
]

const Toolbar: FunctionComponent<{
    selected: string,
    onClick: (toolName: Tool) => void,
    onEditClick: () => void
}> = props => {
    return <section className='toolbar'>
        <h2>Tools:</h2>
        <p>
            {
                TOOLS.map(toolName =>
                    <ToolbarButton toolName={toolName}
                        isSelected={toolName === props.selected}
                        onClick={props.onClick}
                        key={toolName} />)
            }
            <button className='toolbar-button' type='button' onClick={props.onEditClick}>
                Edit Expression
            </button>
        </p>
    </section>
}

const ToolbarButton: FunctionComponent<{
    toolName: string,
    isSelected?: boolean,
    onClick: (toolName: string) => void
}> = props =>
        <button type='button' className={
            props.isSelected ? 'toolbar-button toolbar-button-selected'
                : 'toolbar-button'
        } onClick={() => props.onClick(props.toolName)} >{props.toolName}</button>

function isSelectable(term: Term, tool: Tool) {
    switch (tool) {
        case Tool.Beta: {
            return term.kind === TermKind.App && term.first.kind === TermKind.Abs;
        }
        case Tool.Alpha: {
            return term.kind === TermKind.Abs;
        }
    }
}

const Modal: FunctionComponent<{
    active: boolean,
    title: String,
    children?: any,
    onExitClick?: () => void
}> = props => {
    if (!props.active) {
        return null
    }

    return <div className='modal-container'>
        <div className='modal-box'>
            <h2>{props.title}
                <button type='button'
                    className='modal-exit-button'
                    onClick={props.onExitClick}>X</button>
            </h2>
            <section>{props.children}</section>
        </div>
    </div>
}

function useModal(): {
    modal: React.ReactElement,
    showModal: (title: string, content: React.ReactElement | null) => void
    hideModal: () => void,
} {
    const [inner, setInner] =
        React.useState<[string, React.ReactElement | null]>(['', null])

    const [active, setActive] = React.useState(false)

    const hideModal = () => setActive(false)

    return {
        modal: <Modal active={active} title={inner[0]} onExitClick={hideModal}>{inner[1]}</Modal>,
        showModal: (title, content) => {
            setInner([title, content])
            setActive(true)
        },
        hideModal
    }
}

const AlphaModalContent: FunctionComponent<{
    oldName: string,
    freeVarsInBody: string[],
    renameCallback: (newName: string) => void,
    showModal: (title: string, content: React.ReactElement | null) => void,
    hideModal: () => void,
}> = (props) => {

    const [inputValue, setInputValue] = React.useState('')

    return <>
        <p>
            Rename variable <em>{props.oldName}</em> to
        <input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)} />
            <button type='button' onClick={() => {
                props.renameCallback(inputValue)
                props.hideModal()
            }} disabled={!(isValidVariable(inputValue) && props.freeVarsInBody.indexOf(inputValue) === -1)} >Rename</button>
        </p>
        <p>
            <em>The new variable can only contain letters and numbers,
                and cannot occur free in the function's body.</em>
        </p>
    </>
}

const EditModalContent: FunctionComponent<{
    oldExpression: string,
    editCallback: (newExpression: Term) => void,
    showModal: (title: string, content: React.ReactElement | null) => void,
    hideModal: () => void,
}> = props => {

    const [inputValue, setInputValue] = React.useState(props.oldExpression)

    const [failed, setFailed] = React.useState(false)

    return <>
        <p>
            <textarea value={inputValue} onChange={e => setInputValue(e.target.value)} />
        </p>
        <p>
            <button type='button' onClick={() => {
                const res = parseLambdaTerm(inputValue)
                if (res) {
                    props.editCallback(res)
                    props.hideModal()
                } else {
                    setFailed(true)
                }
            }}>Parse</button>
        </p>
        {
            failed ? <p>
                <em>Could not parse expression.</em>
            </p> : null
        }
    </>
}

function isValidVariable(varName: string) {
    return /^[a-zA-Z][a-zA-Z0-9]*$/.test(varName)
}

ReactDOM.render(<App />, document.getElementById('root'))