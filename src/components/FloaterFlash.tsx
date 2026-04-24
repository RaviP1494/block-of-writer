import { type Component, Show } from 'solid-js';
import { allFlashes } from '../store';
import { DisplayFlash } from './DisplayFlash';

interface FloaterFlashProps {
  id: number;
  clickAct?: string;
}

export const FloaterFlash: Component<FloaterFlashProps> = (props) => {
  const flash = () => allFlashes.find(f => f.id === props.id);

  return (
    <Show when={flash()}>
    <div class='floater-flash'>
      <DisplayFlash id={props.id}
      showTimes={() => true}
      isSpaced={() => true} />;
    </div>
    </Show>
  );
};
