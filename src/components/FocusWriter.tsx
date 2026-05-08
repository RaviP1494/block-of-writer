import TimerWorker from '../workers/timerWorker?worker';
import { type Component, createSignal, onCleanup, Show } from 'solid-js';
import { spawnParticle, triggerDespawn, type PointTuple } from './AnimationOverlay';
import {
  type Flash, flashDelayT,
  flickerModeOn, flickerDelayT,
  backspaceDisabled, inflecTents,
  typingStartTime, setTypingStartTime,
  setIsFlickerOpen,
  inflectionOn,
  writerTargetID,
  allStreams,
  viewSpaces,
  activeViewSpaceID,
  addFlash,
  outFlect,
  focusedEntity,
  setFocusedStreamID,
} from '../store';
import { InflectionPoint } from './InflectionPoint';
import { spawnDots } from '../App';
import { CreateNew } from './CreateNew';

export const [flashTimeLeft, setFlashTimeLeft] = createSignal(0);
export const [flickerTimeLeft, setFlickerTimeLeft] = createSignal(0);
export const [isActiveTimer, setIsActiveTimer] = createSignal(false);


const spawnMyParticle = (timeSpan: number, text: string) => {
  const gravEls = document.querySelectorAll<HTMLElement>('.grav-pt');
  const gravPts: PointTuple[] = [];
  gravEls.forEach((el) => {
    const rect = el?.getBoundingClientRect();
    gravPts.push([(rect!.top + rect!.bottom) / 2, 
      (rect!.left + rect!.right) / 2]);
  });
  spawnParticle(gravPts, text, timeSpan);
};

// Example: Arcing it to the StreamList to destroy it
const killMyParticle = () => {
  const targetElement = focusedEntity()?.entityType === 'stream'
    ? document.querySelector('.stream-title h1')
    : writerTargetID()
    ? document.querySelector(`#stream${writerTargetID()}`)
    : document.querySelector('.floater-circles');
  const targetRect = targetElement ? targetElement.getBoundingClientRect() : document.querySelector('.welcomer')?.getBoundingClientRect();
  const target: PointTuple = 
    [(targetRect!.top + targetRect!.bottom) / 2, 
      (targetRect!.left + targetRect!.right) / 2];
    triggerDespawn(target);
}

export const FocusWriter: Component = () => {
  const [currentText, setCurrentText] = createSignal("    ");

  const targetName = () => writerTargetID()
    ? allStreams.find(s => s.id === writerTargetID())?.title
    : activeViewSpaceID()
      ? 'float in ' + viewSpaces.find(vs => vs.id === activeViewSpaceID())?.title
      : 'none';

  const worker = new TimerWorker();

  worker.onmessage = (e) => {
    if (e.data.type === 'tick') {
      // Update our UI signals with the exact remaining milliseconds
      setFlashTimeLeft(e.data.flashRemaining);
      setFlickerTimeLeft(e.data.flickerRemaining);
    } else if (e.data.type === 'flash_timeout') {
      initFlash();
    } else if (e.data.type === 'flicker_timeout') {
      if(spawnDots()) killMyParticle();
      inflectionOn() ? setIsFlickerOpen(false) : outFlect();
      setIsActiveTimer(false);
    }
  };

  onCleanup(() => {
    if (inflecTents() && inflecTents()!.length > 0) outFlect();
    worker.terminate();
  });

  const initFlash = () => {
    const text = currentText().trim();
    if (!text) return;

    const now = Date.now();
    const start = typingStartTime() || now;
    const delayT = flashDelayT() * 1000;

    const newFlash: Flash = {
      id: 0,
      createDT: now,
      textContents: text,
      tSpan: now - start,
      delayTSpan: delayT
    };
    addFlash(newFlash);
    if (text && spawnDots()) spawnMyParticle((now-start)/1000, text);
    setCurrentText("    ");
    setTypingStartTime(null);
    worker.postMessage({ type: 'stop_flash' });
    if (!flickerModeOn()) setIsActiveTimer(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const text = currentText();
    if (backspaceDisabled() && e.key === 'Backspace') {
      e.preventDefault();
      if (text.trim().length > 0) initFlash();
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (text.trim()) {
        initFlash();
        if (flickerModeOn()) setIsActiveTimer(true);
      } else if (inflecTents()) {
        if(spawnDots()) killMyParticle();
        outFlect();
        setTypingStartTime(null);
        worker.postMessage({
          type: 'stop',
        });
        setIsActiveTimer(false);
        setFlickerTimeLeft(0);
      } else {
        setTypingStartTime(null);
        worker.postMessage({
          type: 'stop',
        });
        setIsActiveTimer(false);
      }
      return;
    }
    if([27,91,16,17,18,20].includes(e.keyCode)) return;
    if (!typingStartTime()) {
      setTypingStartTime(Date.now());
      setIsActiveTimer(true);
    }
    worker.postMessage({
      type: 'reset',
      flashDelay: flashDelayT() * 1000,
      flickerDelay: flickerDelayT() * 1000
    });
  };

  // createEffect(() => {
  //   if (textareaRef) {
  //     textareaRef.style.height = 'auto';
  //     textareaRef.style.height = textareaRef.scrollHeight + 'px';
  //     window.scrollTo({
  //       top: document.documentElement.scrollHeight,
  //       behavior: 'auto'
  //     });
  //   }
  // });

  return (
    <div class='focus-writer'>
      <CreateNew of='stream' />
      <textarea
        class='writers-block'
        value={currentText()}
        onInput={(e) => setCurrentText(e.currentTarget.value)}
        onPaste={(e) => e.preventDefault()}
        onKeyDown={(e) => { handleKeyDown(e) }}
        placeholder="oops"
        autofocus
      />
      <Show when={inflectionOn()}>
        <InflectionPoint />
      </Show>
      <div
        class='flex-down'
        style={{
          'max-width': '100%'
        }}>
        <div
          style={{
            'font-size': '1rch'
          }}>
          Sending To
        </div>
        <div
          class={writerTargetID() ? 'stream-targeted grav-pt' : 'null-targeted grav-pt'}
          style={{
            width: '150%',
            'text-align': 'center',
            'color': writerTargetID() ? '#00ff7f' : 'white',
            'font-family': '"Caveat", cursive',
            'font-size': '3rch',
          }}
          onClick={() => writerTargetID() && setFocusedStreamID(writerTargetID()!)}
          >
          {targetName()}
        </div>
      </div>
    </div>
  );
};
