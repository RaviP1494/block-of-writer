import TimerWorker from '../workers/timerWorker?worker';
import { type Component, createSignal, createEffect, onCleanup, Show } from 'solid-js';
import { spawnParticle, triggerDespawn, type PointTuple } from './AnimationOverlay';
import {
  type Flash, flashDelayT,
  flickerModeOn, flickerDelayT,
  backspaceDisabled, inflecTents,
  typingStartTime, setTypingStartTime,
  setIsWritersBlockEmpty,
  sendFlash, flickFlash,
  setIsFlickerOpen,
  inflectionOn,
  focusedStreamID,
  writerTargetID,
  allStreams,
  viewSpaces,
  activeViewSpaceID,
} from '../store';
import { InflectionPoint } from './InflectionPoint';
import { spawnDots } from '../App';

export const [flashTimeLeft, setFlashTimeLeft] = createSignal(0);
export const [flickerTimeLeft, setFlickerTimeLeft] = createSignal(0);
export const [isActiveTimer, setIsActiveTimer] = createSignal(false);

  // const textArea = document.querySelector('.focus-writer textarea');
  // const streamBtn = writerTargetID() ? document.querySelector(`#stream${writerTargetID()}`) : document.querySelector('.focus-left');
  //   const textRect = textArea?.getBoundingClientRect();
  //   const targetRect = streamBtn?.getBoundingClientRect();
  //   const topW = textRect?.top ? textRect.top : 10;
  //   const leftW = textRect?.left ? textRect.left : 10;
  //   const heightW = textRect?.height ? textRect.height : 10;
  //   const widthW = textRect?.width ? textRect.width : 10;
  //   const topS = targetRect?.top ? targetRect.top : 10;
  //   const leftS = targetRect?.left ? targetRect.left : 10;
  //   const widthS = targetRect?.width ? targetRect.width : 10;
  //   const targets: PointTuple[] = [];
  //   targets.push([topW, leftW]);
  //   targets.push([topS, leftS+widthS]);
  //   targets.push([topW + heightW, leftW + widthW]);
  //   targets.push([topW + heightW * 2, leftW]);
  // id: 1, speed: 5, radius: 8, density: 10
  // const speed = Math.floor(Math.random() * 6) + 3;
  // const radius = Math.floor(Math.random() * 3) + 1;

const spawnMyParticle = (timeSpan: number, text: string) => {
  // const textA = document.querySelector('.focus-writer textarea');
  // const streamList = document.querySelector('.streamlist');
  // const listRect = streamList?.getBoundingClientRect();

  // const startPt: PointTuple = 
  //   [listRect!.top + listRect!.height, 
  //     listRect!.left + listRect!.width];

  // const gravPt: PointTuple = 
  //   [(listRect!.top + listRect!.height) / 2, 
  //     (listRect!.left + listRect!.width) / 2];
  const newStreamBtn = document.querySelector('button.new-stream-btn');
  const newStrBtnRect = newStreamBtn?.getBoundingClientRect();
  // const txtARect = textA?.getBoundingClientRect();
  // const startPt:PointTuple = 
  //   [txtARect!.top + txtARect!.height, 
  //     (txtARect!.left + txtARect!.width) / 2];
  const gravPt: PointTuple = 
    [newStrBtnRect!.top + newStrBtnRect!.height / 2, 
      (newStrBtnRect!.left + newStrBtnRect!.width) / 2];

  spawnParticle(gravPt, text, timeSpan);
};

// Example: Arcing it to the StreamList to destroy it
const killMyParticle = () => {
  const targetElement = focusedStreamID() 
    ? document.querySelector('.stream-title h1')
    : writerTargetID()
    ? document.querySelector(`#stream${writerTargetID()}`)
    : document.querySelector('.streamlist');
  const targetRect = targetElement?.getBoundingClientRect();
  const target: PointTuple = 
    [targetRect!.top + targetRect!.height / 2, 
      (targetRect!.left + targetRect!.width) / 2];
    triggerDespawn(target);
}

export const FocusWriter: Component = () => {
  let textareaRef: HTMLTextAreaElement | undefined;
  const [currentText, setCurrentText] = createSignal("    ");
  // const [particlesSpawned, setParticlesSpawned] = createSignal(0);
  const targetName = () => writerTargetID()
    ? 'Stream: ' + allStreams.find(s => s.id === writerTargetID())?.title
    : activeViewSpaceID()
      ? 'Null Space of ' + viewSpaces.find(vs => vs.id === activeViewSpaceID())?.name
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
      setIsFlickerOpen(false);
      setIsActiveTimer(false);
    }
  };

  onCleanup(() => {
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
      delayTSpan: delayT // Convert UI seconds to MS
    };
    sendFlash(newFlash);
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

    if([27,91,16,17,18,20].includes(e.keyCode)) return;
    // 4. Valid character typed: start/reset timer
    if (!typingStartTime()) {
      setTypingStartTime(Date.now());
      setIsActiveTimer(true);
    }{/* else {
      
        const elapsedMS = Date.now() - typingStartTime()!;
        const expectedParticles = Math.floor(elapsedMS / 5000); 

      if (expectedParticles > particlesSpawned()) {
        console.log(expectedParticles + '<e a>' + particlesSpawned());
        spawnMyParticle(e.key);
        setParticlesSpawned(expectedParticles); 
      */}
      
    


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
      <div style={{
        'background-color': '#a9a9a9',
        color: 'black',
        'text-align': 'center'
      }}>Sending To {targetName()}
      </div>
      <textarea
        ref={textareaRef}
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
    </div>
  );
};
