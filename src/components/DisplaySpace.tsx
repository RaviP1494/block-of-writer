import { type Component, Show, For } from "solid-js";
import { setShowStats, viewSpaces } from "../store";

interface DisplaySpaceProps {
  id: number
}

export const DisplaySpace: Component<DisplaySpaceProps> = (props) => {
  const space = () => viewSpaces.find((s) => s.id === props.id);

  return (
    <Show when={viewSpaces}>
        <div class='flex-wrap flex-top-down'>
          <For each={space()?.tentsInSpace}>
          {(ent) => (
            <div 
            onClick={()=>setShowStats(ent)}
            style={{
              'background-color': ent.entityType === 'stream'
                ? '#002080'
                : ent.entityType === 'flicker'
                ? '#802000'
                : '#808000',
                height: '100px',
                width: '100px'
          }}>
          {ent.refID}
          </div>)}
          </For>
        </div>
    </Show>
  );
};
