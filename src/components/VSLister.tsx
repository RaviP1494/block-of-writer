import { For, type Component } from 'solid-js';
import { activeViewSpaceID, setActiveViewSpaceID, viewSpaces } from '../store';

export const VSLister: Component = () => {

  return (
    <div>
    <select 
    onChange={(e) => console.log(e.currentTarget)}>
    <For each={viewSpaces}>
    {(vs) =>
    <option value={vs.id}>{vs.title}</option>
    }
    </For>
    </select>
    </div>
  );
}
