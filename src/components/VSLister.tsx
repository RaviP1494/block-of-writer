import { createSignal, For, Show, type Component } from 'solid-js';
import { activeViewSpaceID, createNewViewSpace, setActiveViewSpaceID, updateSpaceName, viewSpaces } from '../store';
import { EditTitle } from './EditTitle';

export const VSLister: Component = () => {
  const [isSelecting, setIsSelecting] = createSignal(false);
  const [isEditingTitle, setIsEditingTitle] = createSignal(false);
  const activeVS = () => viewSpaces.find(vs => vs.id === activeViewSpaceID())
  return (
    <div
      class={isSelecting() ? 'space-selector' : 'space-displayer'}
      onMouseLeave={() => setIsSelecting(false)}>
      <Show when={isEditingTitle()}
        fallback={

          <Show when={isSelecting()}

            fallback={
              <div>
              <button 
              onClick={() => setIsEditingTitle(true)}
              style={{
                'background-color': 'transparent',
              }}
              >✎</button>
              <button
                onClick={() => setIsSelecting(true)}>
                {activeVS()?.title}
              </button>
              <button 
              style={{
                'background-color': 'transparent',
              }}
              onClick={()=>createNewViewSpace()}>
              +
                </button>
              </div>

            }>
            <For each={viewSpaces.filter(vs => vs.id !== activeViewSpaceID())}>
              {(vs) =>
                <button onClick={(e) => {
                  setActiveViewSpaceID(vs.id);
                  if(viewSpaces.length > 1) setIsSelecting(false);
                  e.stopPropagation();
                }}>{vs.title}</button>
              }
            </For>
          </Show>
        }>
        <EditTitle
          initialValue={activeVS()!.title}
          onSave={(title: string) => {
            updateSpaceName(activeVS()!.id, title);
            setIsEditingTitle(false);
          }}
          onCancel={() => setIsEditingTitle(false)} />
      </Show>
    </div>
  );
}
