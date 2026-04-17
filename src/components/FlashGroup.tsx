import { type Component, createMemo, createSignal, Show, For } from 'solid-js';
import { allStreams, allFlickers, allFlashes, updateStreamTitle,
  viewSpaces, type MultEnt} from '../store';

  interface FlashGroupProps {
  }

export const FlashGroup: Component = () => {
  const [spaced, setSpaced] = createSignal(false);
  const [flowUp, setFlowUp] = createSignal(false);
  return ();
}
