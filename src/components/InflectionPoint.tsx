import { type Component, Show, For } from 'solid-js';
import { setInflectionOn, inflecTents, flickerModeOn, isFlickerOpen } from '../store';

export const InflectionPoint: Component = () => {

    const backgroundColor = () => {
        if (flickerModeOn() && isFlickerOpen()) {
            return '#424242';
        } else if (flickerModeOn()) {
            return '#202020';
        }
        return 'transparent'
    };

    return (
      <div
        class='inflection'
        style={{
          'background-color': backgroundColor()
        }}>
        <Show 
        when={inflecTents()} 
        fallback={
            <button onClick={()=>{
                setInflectionOn(false);
            }}>Close</button>
        }
        >
          <For each={inflecTents()}>
          {(flash) =>
            <Show when={flash}>
              <div style={{ color: '#a9a9a9', flex: "1 1 0"}}>{flash!.textContents}</div>
            </Show>
          }
          </For>
        </Show>
      </div>
    );
};
