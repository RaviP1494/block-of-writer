import { type Component, Show, For, createMemo } from 'solid-js';
import { allFlickers } from '../store';
import { DisplayFlash } from './DisplayFlash';

interface FloaterFlashProps {
  id: number;
  showTimes: () => boolean;
  isSpaced: () => boolean;
  clickAct?: string;
}

export const FloaterFlicker: Component<FloaterFlashProps> = (props) => {
  const flicker = () => allFlickers.find(f => f.id === props.id);
  const showTimes = createMemo(() => props.showTimes());
  const isSpaced = createMemo(() => props.isSpaced());

  return (
    <Show when={flicker()}>
      <div class='floater-flicker'>
        <For each={flicker()!.contentIDs}>
          {(flashID, index) => {
            const prevID = index() > 0 ? flicker()!.contentIDs[index() - 1] : null;
            return <DisplayFlash id={flashID}
              prevID={prevID}
              showTimes={() => showTimes()}
              isSpaced={() => isSpaced()} />;
          }}
        </For>
      </div>
    </Show>
  );
};
