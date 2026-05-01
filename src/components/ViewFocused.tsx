import { Match, Show, Switch, type Component } from "solid-js";
import { DisplayStream } from "./DisplayStream";
import { FloaterFlash } from "./FloaterFlash";
import { FloaterFlicker } from "./FloaterFlicker";
import { focusedStreamID, focusedEntity } from "../store";


export const ViewFocused: Component = () => {
  const viewed = () => focusedEntity()
    ? focusedEntity()
    : focusedStreamID() 
      ?{entityType: 'stream', refID: focusedStreamID()} 
      : null;

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
              innerClickMode='focus' 
              />
          </Match>

          <Match when=
            {entity()!.entityType
              === 'flicker'}>
            <FloaterFlicker
              id=
              {entity()!.refID}
              innerClickMode= 'focus'
              />
          </Match>

          <Match
            when=
            {entity()!.entityType
              === 'flash'}>
            <FloaterFlash
              id=
              {entity()!.refID}
              innerClickMode= 'focus'
              />
          </Match>
        </Switch>
      }
    </Show >
  )
}
