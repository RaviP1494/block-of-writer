import { Match, Show, Switch, type Component } from "solid-js";
import { DisplayStream } from "./DisplayStream";
import { FloaterFlash } from "./FloaterFlash";
import { FloaterFlicker } from "./FloaterFlicker";
import { focusedStreamID, focusedEntity, chainTargetID } from "../store";

export interface ViewFocusedProps {
  innerClickMode?: string;
}

export const ViewFocused: Component<ViewFocusedProps> = (props) => {
  const viewed = () => focusedEntity()
    ? focusedEntity()
    : focusedStreamID() 
      ? { entityType: 'stream', refID: focusedStreamID() } 
      : null;

  const clickMode = () => props.innerClickMode ?? (chainTargetID() ? 'chain' : 'focus');

  return (
    <Show when={viewed()}>
      {(entity) =>
        <Switch fallback={<div class='mistake'>Nothing Here</div>}>
          <Match
            when=
            {entity()!.entityType
              === 'stream'}>
            <DisplayStream
              id= 
              {entity()!.refID}
              innerClickMode={clickMode()} 
              />
          </Match>

          <Match when=
            {entity()!.entityType
              === 'flicker'}>
            <FloaterFlicker
              id=
              {entity()!.refID}
              innerClickMode={clickMode()}
              />
          </Match>

          <Match
            when=
            {entity()!.entityType
              === 'flash'}>
            <FloaterFlash
              id=
              {entity()!.refID}
              innerClickMode={clickMode()}
              />
          </Match>
        </Switch>
      }
    </Show >
  )
}
