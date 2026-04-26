import { Match, Show, Switch, type Component } from "solid-js";
import { focusedEntity } from "../store";
import { DisplayStream } from "./DisplayStream";
import { FloaterFlash } from "./FloaterFlash";
import { FloaterFlicker } from "./FloaterFlicker";

export interface ViewAnyItemProps {
  innerClickMode: string;
}

export const ViewAnyItem: Component<ViewAnyItemProps> = (props) => {

  return (
    <Show when={focusedEntity()}>
    <Switch>
    <Match 
    when=
      {focusedEntity()!.entityType 
        === 'stream'}>
    return <DisplayStream 
    id=
      {focusedEntity()!.refID} 
    innerClickMode=
      {props.innerClickMode} />
    </Match>

    <Match when=
      {focusedEntity()!.entityType 
        === 'flicker'}>
    return <FloaterFlicker 
    id=
      {focusedEntity()!.refID} 
    innerClickMode=
      {props.innerClickMode} />
    </Match>

    <Match 
    when=
      {focusedEntity()!.entityType 
        === 'flash'}>
    return <FloaterFlash 
    id=
      {focusedEntity()!.refID} 
    innerClickMode=
      {props.innerClickMode} />
    </Match>
    </Switch>
    </Show >
  )
}
