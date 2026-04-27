import { Match, Show, Switch, type Component } from "solid-js";
import { type MultEnt } from "../store";
import { DisplayStream } from "./DisplayStream";
import { FloaterFlash } from "./FloaterFlash";
import { FloaterFlicker } from "./FloaterFlicker";

export interface ViewAnyItemProps {
  ent: MultEnt | null;
  innerClickMode: string;
}

export const ViewAnyItem: Component<ViewAnyItemProps> = (props) => {

  return (
    <Show when={props.ent}>
    {(entity) =>
    <Switch>
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
