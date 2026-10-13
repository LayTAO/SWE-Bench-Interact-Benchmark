import React, {useEffect, useRef, useState} from 'react'
import ReactDOM from 'react-dom/client'
import {Autocomplete} from 'react-aria-components/src/Autocomplete'
import {Input} from 'react-aria-components/src/Input'
import {Label} from 'react-aria-components/src/Label'
import {Menu, MenuItem} from 'react-aria-components/src/Menu'
import {SearchField} from 'react-aria-components/src/SearchField'
import {Text} from 'react-aria-components/src/Text'

const styles = `
  :root {
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    color: #19243a;
    background: #edf2f8;
  }
  * { box-sizing: border-box; }
  html, body, #root { width: 100%; min-height: 100%; margin: 0; }
  body { min-height: 100vh; }
  .page {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 300px;
    gap: 28px;
    min-height: 640px;
    padding: 42px;
    background: radial-gradient(circle at top left, rgba(105, 151, 224, 0.16), transparent 38%), #edf2f8;
  }
  .card, .state-panel {
    border: 1px solid #cbd6e5;
    border-radius: 16px;
    background: white;
    box-shadow: 0 14px 38px rgba(36, 52, 78, 0.12);
  }
  .card { padding: 30px 34px; }
  .eyebrow {
    margin: 0 0 6px;
    color: #315f9c;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.09em;
    text-transform: uppercase;
  }
  h1, h2 { margin: 0; }
  h1 { font-size: 28px; }
  .instructions {
    max-width: 590px;
    margin: 10px 0 26px;
    color: #52627a;
    line-height: 1.55;
  }
  .search-field { display: grid; gap: 7px; max-width: 520px; }
  .search-field label { font-weight: 650; }
  .search-field input {
    width: 100%;
    min-height: 44px;
    padding: 10px 13px;
    border: 2px solid #aab8ca;
    border-radius: 9px;
    outline: none;
    color: #17233a;
    background: #fbfcfe;
    font: inherit;
  }
  .search-field input[data-focused] {
    border-color: #3975cf;
    box-shadow: 0 0 0 4px rgba(57, 117, 207, 0.18);
    background: white;
  }
  .search-field [slot='description'] { color: #66758b; font-size: 13px; }
  .menu {
    display: grid;
    gap: 5px;
    max-width: 520px;
    margin-top: 18px;
    padding: 8px;
    border: 1px solid #c7d2e1;
    border-radius: 11px;
    outline: none;
    background: #f8fafe;
  }
  .menu [role='menuitem'] {
    padding: 11px 12px;
    border-radius: 7px;
    outline: none;
    cursor: default;
  }
  .menu [role='menuitem'][data-focused] { color: white; background: #3975cf; }
  .state-panel { align-self: start; padding: 24px; }
  .state-panel h2 { margin-bottom: 18px; font-size: 17px; }
  .state-panel dl { display: grid; gap: 11px; margin: 0; }
  .state-panel dl > div { padding-bottom: 10px; border-bottom: 1px solid #e2e8f1; }
  .state-panel dt { margin-bottom: 3px; color: #718096; font-size: 12px; }
  .state-panel dd {
    margin: 0;
    overflow-wrap: anywhere;
    color: #1d3152;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 13px;
    font-weight: 650;
  }
`

type FocusSnapshot = {
  inputFocused: boolean
  inputFocusVisible: boolean
  activeDescendant: string | null
  focusedOption: string | null
  activeElement: string
}

function readSnapshot(input: HTMLInputElement | null): FocusSnapshot {
  const focusedOption = document.querySelector('[role="menuitem"][data-focused]')
  return {
    inputFocused: input?.hasAttribute('data-focused') ?? false,
    inputFocusVisible: input?.hasAttribute('data-focus-visible') ?? false,
    activeDescendant: input?.getAttribute('aria-activedescendant') ?? null,
    focusedOption: focusedOption?.textContent?.trim() ?? null,
    activeElement: document.activeElement === input
      ? 'input'
      : document.activeElement?.tagName.toLowerCase() ?? 'none',
  }
}

function App() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [snapshot, setSnapshot] = useState<FocusSnapshot>(() => readSnapshot(null))

  useEffect(() => {
    const update = () => setSnapshot(readSnapshot(inputRef.current))
    const observer = new MutationObserver(update)
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-focused', 'data-focus-visible', 'aria-activedescendant'],
      subtree: true,
    })
    document.addEventListener('focusin', update)
    document.addEventListener('focusout', update)
    update()
    return () => {
      observer.disconnect()
      document.removeEventListener('focusin', update)
      document.removeEventListener('focusout', update)
    }
  }, [])

  const filter = (textValue: string, inputValue: string) => (
    textValue.toLocaleLowerCase().includes(inputValue.toLocaleLowerCase())
  )

  return (
    <main className="page" data-testid="repro-root">
      <style>{styles}</style>
      <section className="card">
        <p className="eyebrow">Frozen interaction reproduction</p>
        <h1>Autocomplete input focus</h1>
        <p className="instructions">
          Click the input, hover an option, then click the already-active input again.
          Its focused style and state should return.
        </p>

        <Autocomplete filter={filter}>
          <SearchField className="search-field">
            <Label>Search commands</Label>
            <Input ref={inputRef} data-testid="autocomplete-input" placeholder="Type to filter" />
            <Text slot="description">Suggestions remain open for pointer navigation.</Text>
          </SearchField>
          <Menu aria-label="Suggestions" className="menu">
            <MenuItem id="open">Open file</MenuItem>
            <MenuItem id="rename">Rename symbol</MenuItem>
            <MenuItem id="format">Format document</MenuItem>
          </Menu>
        </Autocomplete>
      </section>

      <aside className="state-panel" data-testid="state-panel">
        <h2>Observed state</h2>
        <dl>
          <div>
            <dt>DOM focus</dt>
            <dd data-testid="active-element">{snapshot.activeElement}</dd>
          </div>
          <div>
            <dt>Input data-focused</dt>
            <dd data-testid="input-focused">{String(snapshot.inputFocused)}</dd>
          </div>
          <div>
            <dt>Active descendant</dt>
            <dd data-testid="active-descendant">{snapshot.activeDescendant ?? 'none'}</dd>
          </div>
          <div>
            <dt>Focused option</dt>
            <dd data-testid="focused-option">{snapshot.focusedOption ?? 'none'}</dd>
          </div>
        </dl>
      </aside>
    </main>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
