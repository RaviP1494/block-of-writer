import TimerWorker from '../workers/timerWorker?worker';
import { type Component, createSignal, createEffect, onCleanup, Show } from 'solid-js';
import { StreamList } from './StreamList';
import { spawnParticle, triggerDespawn, type PointTuple } from './AnimationOverlay';
import {
  type Flash, flashDelayT,
  flickerModeOn, flickerDelayT,
  backspaceDisabled, inflecTents,
  typingStartTime, setTypingStartTime,
  setIsWritersBlockEmpty,
  writerTargetID,
  sendFlash, flickFlash,
  setIsFlickerOpen,
  inflectionOn
} from '../store';
import { InflectionPoint } from './InflectionPoint';

export const [flashTimeLeft, setFlashTimeLeft] = createSignal(0);
export const [flickerTimeLeft, setFlickerTimeLeft] = createSignal(0);
export const [isActiveTimer, setIsActiveTimer] = createSignal(false);


const spawnMyParticle = () => {
  const textArea = document.querySelector('.focus-writer textarea');
  const streamBtn = writerTargetID() ? document.querySelector(`#stream${writerTargetID()}`) : document.querySelector('.focus-left');
    const textRect = textArea?.getBoundingClientRect();
    const targetRect = streamBtn?.getBoundingClientRect();
    const topW = textRect?.top ? textRect.top : 10;
    const leftW = textRect?.left ? textRect.left : 10;
    const heightW = textRect?.height ? textRect.height : 10;
    const widthW = textRect?.width ? textRect.width : 10;
    const topS = targetRect?.top ? targetRect.top : 10;
    const leftS = targetRect?.left ? targetRect.left : 10;
    const widthS = targetRect?.width ? targetRect.width : 10;
    const targets: PointTuple[] = [];
    targets.push([topW, leftW]);
    targets.push([topS, leftS+widthS]);
    targets.push([topW + heightW, leftW + widthW]);
    targets.push([topW + heightW * 2, leftW]);
  // id: 1, speed: 5, radius: 8, density: 10
  const density = Math.floor(Math.random() * 10);
  const speed = Math.floor(Math.random() * 5)+5;
  const radius = Math.floor(Math.random() * 4) + 3;
  spawnParticle(1, speed, radius, density, targets);
};

// Example: Arcing it to the StreamList to destroy it
const killMyParticle = () => {
  const bg = document.querySelector('.background-one');
    const rect = bg!.getBoundingClientRect();
    const target: PointTuple = [rect.top + rect.height, rect.left + rect.width / 2];
    triggerDespawn(target);
}

export const FocusWriter: Component = () => {
  let textareaRef: HTMLTextAreaElement | undefined;
  const [currentText, setCurrentText] = createSignal("    ");
  const worker = new TimerWorker();

  worker.onmessage = (e) => {
    if (e.data.type === 'tick') {
      // Update our UI signals with the exact remaining milliseconds
      setFlashTimeLeft(e.data.flashRemaining);
      setFlickerTimeLeft(e.data.flickerRemaining);
    } else if (e.data.type === 'flash_timeout') {
      initFlash();
    } else if (e.data.type === 'flicker_timeout') {
      setIsFlickerOpen(false);
      setIsActiveTimer(false);
    }
  };

  onCleanup(() => {
    worker.terminate();
  });


  const initFlash = () => {
    killMyParticle()
    const text = currentText().trim();
    if (!text) return;

    const now = Date.now();
    const start = typingStartTime() || now;

    const newFlash: Flash = {
      id: 0,
      createDT: now,
      textContents: text,
      tSpan: now - start,
      delayTSpan: flashDelayT() * 1000 // Convert UI seconds to MS
    };

    sendFlash(newFlash);
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
      if (text.trim().length > 0) {
        initFlash();
        if (flickerModeOn()) setIsActiveTimer(true);
      } else if (inflecTents()) {
        flickFlash();
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

    // 3. Ignore control keys (Shift, Ctrl, etc.)
    if (e.key.length !== 1) return;
    spawnMyParticle();
    // 4. Valid character typed: start/reset timer
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

  createEffect(() => {
    if (textareaRef) {
      textareaRef.style.height = 'auto';
      textareaRef.style.height = textareaRef.scrollHeight + 'px';
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'auto'
      });
    }
    setIsWritersBlockEmpty(currentText().trim().length === 0);
  });



  return (
    <div class='focus-writer'>


      <StreamList clickDo={true} />

      <textarea
        ref={textareaRef}
        value={currentText()}
        onInput={(e) => setCurrentText(e.currentTarget.value)}
        onPaste={(e) => e.preventDefault()}
        onKeyDown={(e) => { handleKeyDown(e) }}
        placeholder="oops"
      />
      <Show when={inflectionOn()}>
        <InflectionPoint />
      </Show>
    </div>
  );
};
