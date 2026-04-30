import { Match, Show, Switch, type Component } from "solid-js";
import { DisplayStream } from "./DisplayStream";
import { FloaterFlash } from "./FloaterFlash";
import { FloaterFlicker } from "./FloaterFlicker";
import { focusedEntity } from "../store";

export interface ViewFocusedProps {
  innerClickMode: string;
}

export const ViewFocused: Component<ViewFocusedProps> = (props) => {
  const focus = () => focusedEntity();

  return (
    <Show when={focus()}>
    {(entity) =>
    <Switch fallback={<div class='mistake'>Nothing Here</div>}>
    <Match 
    when=
      {entity()!.entityType 
        === 'stream'}>
    <DisplayStream 
    id=
      {entity()!.refID} 
    innerClickMode=
      {props.innerClickMode} />
    </Match>

    <Match when=
      {entity()!.entityType 
        === 'flicker'}>
    <FloaterFlicker 
    id=
      {entity()!.refID} 
    innerClickMode=
      {props.innerClickMode} />
    </Match>

    <Match 
    when=
      {entity()!.entityType 
        === 'flash'}>
    <FloaterFlash 
    id=
      {entity()!.refID} 
    innerClickMode=
      {props.innerClickMode} />
    </Match>
    </Switch>
    }
    </Show >
  )
}
