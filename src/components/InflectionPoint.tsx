import { type Component, Show, For } from 'solid-js';
import { setInflectionOn, inflecTents, flickerModeOn, isFlickerOpen, allFlashes, type Flash, type Flicker } from '../store';

export const InflectionPoint: Component = () => {

    const backgroundColor = () => {
        if (flickerModeOn() && isFlickerOpen()) {
            return '#424242';
        } else if (flickerModeOn()) {
            return '#202020';
        }
        if (inflecTents()) {
            return '#202020';
        }
        return 'transparent'
    };

    return (
        <Show 
        when={inflecTents()} 
        fallback={
            <div 
            style={{ 
              'text-align': 'center',
              'color': '#141414',
              border: '1px solid #ccc',
              "border-radius": '4px',
              padding: '8px',
              "background-color": backgroundColor(),
              transition: 'all 0.2s ease'
            }}>
            <button onClick={()=>{
                setInflectionOn(false);
            }}>Close</button>
            </div>
        }
        >
        {(holder) => (
            <Show 
            when={'contentIDs' in holder()} 
            fallback={
                <div
                style={{ 
                    'color': '#141414',
                    width: '100%',
                    height: 'fit-contents',
                    border: '1px solid #ccc',
                    "border-radius": '4px',
                    padding: '8px',
                    "background-color": backgroundColor(),
                    transition: 'background-color 0.2s ease',
                    "text-indent": "4ch"
                }}>
                {(holder() as Flash).textContents}
                </div>}
                >
                <div 
                style={{ 
                    width: '100%',
                    'color': '#141414',
                    display: 'flex', 
                    "flex-direction": 'column', 
                    border: '1px solid #ccc',
                    "border-radius": '4px',
                    padding: '8px',
                    "background-color": backgroundColor(),
                    transition: 'background-color 0.2s ease',
                    "text-indent": "4ch"
                }}>
                <For each={(holder() as Flicker).contentIDs}>
                {(flashID) => {
                    const flash = allFlashes.find(f => f.id === flashID);
                    return (
                        <Show when={flash}>
                        <div style={{ color: '#a9a9a9', flex: "1 1 0%"}}>{flash!.textContents}</div>
                        </Show>
                    );
                }}
                </For>
                    </div>
                </Show>
        )}
        </Show>
    );
};
