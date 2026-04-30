import { createMemo, For, Match, Switch, type Component } from "solid-js";
import { DisplayStream } from "./DisplayStream";
import { FloaterFlash } from "./FloaterFlash";
import { FloaterFlicker } from "./FloaterFlicker";
import { openFloaters } from "../store";

export interface ViewMultItemsProps {
  innerClickMode: string;
}

export const ViewMultItems: Component<ViewMultItemsProps> = (props) => {
  const items = createMemo(() => openFloaters.filter(f => f && f.refID !== 0));

  return (
    <div class='multi-reader'>
      <For each={items()}>
        {(entity) =>
          <Switch fallback={<div class='mistake'>Nothing Here</div>}>
            <Match
              when=
              {entity.entityType
                === 'stream'}>
              <DisplayStream
                id=
                {entity.refID}
                innerClickMode=
                {props.innerClickMode} />
            </Match>

            <Match when=
              {entity.entityType
                === 'flicker'}>
              <FloaterFlicker
                id=
                {entity.refID}
                innerClickMode=
                {props.innerClickMode} />
            </Match>

            <Match
              when=
              {entity.entityType
                === 'flash'}>
              <FloaterFlash
                id=
                {entity.refID}
                innerClickMode=
                {props.innerClickMode} />
            </Match>
          </Switch>
        }
      </For>
    </div>
  )
}
