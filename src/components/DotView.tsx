import { type Component, Match, Switch, Show } from 'solid-js';
import { type MultEnt, streamWordCount, flickerWordCount, getFlash, textWordCount } from '../store';

interface DotViewProps {
  ent: MultEnt | null;
}


export const DotView: Component<DotViewProps> = (props) => {
  return (
    <Show when={props.ent}>
    <svg 
      style={{ 
        width: '250px', 
        height: '250px', 
      }}
    >
    <Switch>
      <Match when={props.ent!.entityType === 'stream'}>
        <circle
        cx='50%'
        cy='50%'
        r={5+Math.sqrt(streamWordCount(props.ent!.refID))}
        fill='rgb(255,255,255)'
        />
      </Match>
      <Match when={props.ent!.entityType === 'flicker'}>
        <circle
        cx='50%'
        cy='50%'
        r={5+Math.sqrt(flickerWordCount(props.ent!.refID)!)}
        />
      </Match>
      <Match when={props.ent!.entityType === 'flash'}>
        <circle
        cx='50%'
        cy='50%'
        r={5+Math.sqrt(textWordCount(getFlash(props.ent!.refID)!.textContents))}
        />
      </Match>
    </Switch>
    </svg>
    </Show>
  );
};
