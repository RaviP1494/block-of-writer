import { Match, Show, Switch, type Component } from "solid-js";
import { DisplayStream } from "./DisplayStream";
import { FloaterFlash } from "./FloaterFlash";
import { FloaterFlicker } from "./FloaterFlicker";
import { focusedStreamID, focusedEntity, chainTargetID } from "../store";

export interface FocusViewerProps {
  innerClickMode?: string;
}

export const FocusViewer: Component<FocusViewerProps> = (props) => {
  const viewed = () => focusedEntity()
    ? focusedEntity()
    : focusedStreamID() 
      ? { entityType: 'stream', refID: focusedStreamID() } 
      : null;

  const clickMode = () => props.innerClickMode ?? (chainTargetID() ? 'chain' : 'focus');

  return (
    <Show
      when={viewed()}
      fallback={
        <div class="wb-reader-empty">
          Select a stream or floating item above to review.
        </div>
      }
    >
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
