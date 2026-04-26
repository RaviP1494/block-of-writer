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
    <Switch>
    <Match 
    when=
      {props.ent!.entityType 
        === 'stream'}>
    <DisplayStream 
    id=
      {props.ent!.refID} 
    innerClickMode=
      {props.innerClickMode} />
    </Match>

    <Match when=
      {props.ent!.entityType 
        === 'flicker'}>
    <FloaterFlicker 
    id=
      {props.ent!.refID} 
    innerClickMode=
      {props.innerClickMode} />
    </Match>

    <Match 
    when=
      {props.ent!.entityType 
        === 'flash'}>
    <FloaterFlash 
    id=
      {props.ent!.refID} 
    innerClickMode=
      {props.innerClickMode} />
    </Match>
    </Switch>
    </Show >
  )
}
