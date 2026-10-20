import TimerWorker from '../workers/timerWorker?worker';
import { type Component, createSignal, onCleanup, Show } from 'solid-js';
import { spawnParticle, triggerDespawn, type PointTuple } from './AnimationOverlay';
import {
  type Flash, type Keymote, flashDelayT,
  flickerModeOn, flickerDelayT,
  backspaceDisabled, inflecTents,
  typingStartTime, setTypingStartTime,
  setIsFlickerOpen,
  inflectionOn,
  setInflectionOn,
  writerTargetID,
  addFlash,
  outFlect,
  focusedEntity,
  getStream,
  activeViewSpaceID,
  viewSpaces,
  textWordCount,
} from '../store';
import { spawnDots } from '../App';

export const [flashTimeLeft, setFlashTimeLeft] = createSignal(0);
export const [flickerTimeLeft, setFlickerTimeLeft] = createSignal(0);
export const [isActiveTimer, setIsActiveTimer] = createSignal(false);
export const [cursorIndex, setCursorIndex] = createSignal<number>(4);
export const [showTimeBars, setShowTimeBars] = createSignal<boolean>(true);
export const [hideTypedText, setHideTypedText] = createSignal<boolean>(false);

export const VALID_WRITER_KEYS: readonly string[] = [
  ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  ...'0123456789',
  ' ', '.', ',', '!', '?', ';', ':', "'", '"', '-', '_',
  '(', ')', '[', ']', '{', '}', '/', '\\', '&', '@', '#',
  '$', '%', '^', '*', '+', '=', '<', '>', '~', '`', '|'
];

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

const [currentText, setCurrentText] = createSignal("    ");

let currentLog: Keymote[] = [];
let lastKeyTime: number | null = null;
let reclaimedTSpan = 0;
let reclaimedCreateDT = 0;
let awaitingPostReclaimKey = false;
let activeFlushFn: (() => void) | null = null;
let focusTextareaFn: ((pos: number) => void) | null = null;

export const replayLogToBuffer = (log: Keymote[]): string => {
  let buf = "    ";
  for (const [ch, , pos] of log) {
    if (ch === '\b') {
      buf = buf.slice(0, pos) + buf.slice(pos + 1);
    } else {
      buf = buf.slice(0, pos) + ch + buf.slice(pos);
    }
  }
  return buf;
};

export const reclaimToWriter = (flash: Flash) => {
  // Edge case safeguard: if user already started typing a new flash, flush it first
  if (currentText().trim().length > 0 && activeFlushFn) {
    activeFlushFn();
  }

  const restoredBuffer =
    flash.log && flash.log.length > 0
      ? replayLogToBuffer(flash.log)
      : `    ${flash.textContents}`;

  currentLog = flash.log ? [...flash.log] : [];
  lastKeyTime = null;
  reclaimedTSpan = flash.tSpan;
  reclaimedCreateDT = flash.createDT;
  awaitingPostReclaimKey = true;

  setTypingStartTime(null);
  setCurrentText(restoredBuffer);
  setCursorIndex(restoredBuffer.length);
  focusTextareaFn?.(restoredBuffer.length);
};

export const FocusWriter: Component = () => {
  let textareaRef: HTMLTextAreaElement | undefined;
  const worker = new TimerWorker();

  // Collapses any multi-character highlight to a single caret point
  const syncCursorIndex = (el: HTMLTextAreaElement) => {
    const pos = el.selectionEnd ?? el.selectionStart ?? 0;
    if (el.selectionStart !== el.selectionEnd) {
      el.setSelectionRange(pos, pos);
    }
    setCursorIndex(pos);
  };

  focusTextareaFn = (pos: number) => {
    if (textareaRef) {
      textareaRef.focus();
      requestAnimationFrame(() => {
        textareaRef?.setSelectionRange(pos, pos);
        setCursorIndex(pos);
      });
    }
  };

  worker.onmessage = (e) => {
    if (e.data.type === 'tick') {
      setFlashTimeLeft(e.data.flashRemaining);
      setFlickerTimeLeft(e.data.flickerRemaining);
    } else if (e.data.type === 'flash_timeout') {
      initFlash();
    } else if (e.data.type === 'flicker_timeout') {
      if (spawnDots()) killMyParticle();
      setIsFlickerOpen(false);
      !inflectionOn() && outFlect();
      setIsActiveTimer(false);
    }
  };

  onCleanup(() => {
    if (activeFlushFn === initFlash) activeFlushFn = null;
    if (focusTextareaFn) focusTextareaFn = null;
    if (inflecTents() && inflecTents()!.length > 0) outFlect();
    worker.terminate();
  });

  const initFlash = () => {
    const text = currentText().trim();
    if (!text) return;

    const now = Date.now();
    const delayT = flashDelayT() * 1000;

    // If reclaimed and flushed immediately without new keystrokes, preserve original timing
    const effectiveCreateDT = awaitingPostReclaimKey
      ? reclaimedCreateDT
      : typingStartTime() || now;
    const effectiveTSpan = awaitingPostReclaimKey
      ? reclaimedTSpan
      : now - effectiveCreateDT;

    const newFlash: Flash = {
      id: 0,
      createDT: effectiveCreateDT,
      textContents: text,
      tSpan: effectiveTSpan,
      delayTSpan: delayT,
      log: currentLog.length > 0 ? [...currentLog] : null,
    };

    // Reset capture state for next flash
    currentLog = [];
    lastKeyTime = null;
    reclaimedTSpan = 0;
    reclaimedCreateDT = 0;
    awaitingPostReclaimKey = false;

    setFlashTimeLeft(0);
    addFlash(newFlash);
    if (text && spawnDots()) spawnMyParticle(effectiveTSpan / 1000, text);
    setCurrentText("    ");
    setCursorIndex(4);
    setTypingStartTime(null);
    worker.postMessage({ type: 'stop_flash' });
    if (!flickerModeOn()) setIsActiveTimer(false);
  };

  activeFlushFn = initFlash;

  const recordMutationAndResetTimer = (oldStr: string, newStr: string, caretAfter: number) => {
    if (oldStr === newStr) return;

    const now = Date.now();
    let delta = 0;

    if (awaitingPostReclaimKey) {
      // Solution 1 seam: 0ms gap between pre-reclaim and first post-reclaim keystroke
      delta = 0;
      setTypingStartTime(now - reclaimedTSpan);
      setIsActiveTimer(true);
      awaitingPostReclaimKey = false;
    } else if (!typingStartTime() || lastKeyTime === null) {
      delta = 0;
      setTypingStartTime(now);
      setIsActiveTimer(true);
    } else {
      delta = Math.max(0, now - lastKeyTime);
    }
    lastKeyTime = now;

    // Case 1: Pure insertion (single keystroke or multi-char IME input)
    const insLen = newStr.length - oldStr.length;
    if (
      insLen > 0 &&
      caretAfter >= insLen &&
      oldStr === newStr.slice(0, caretAfter - insLen) + newStr.slice(caretAfter)
    ) {
      const startPos = caretAfter - insLen;
      for (let i = 0; i < insLen; i++) {
        currentLog.push([newStr[startPos + i], i === 0 ? delta : 0, startPos + i]);
      }
    }
    // Case 2: Pure deletion (Backspace, Delete, or Ctrl + Backspace word delete)
    else if (
      newStr.length < oldStr.length &&
      newStr === oldStr.slice(0, caretAfter) + oldStr.slice(caretAfter + (oldStr.length - newStr.length))
    ) {
      const delLen = oldStr.length - newStr.length;
      for (let i = delLen - 1; i >= 0; i--) {
        currentLog.push(['\b', i === delLen - 1 ? delta : 0, caretAfter + i]);
      }
    }
    // Case 3: Fallback diff (e.g. mobile IME replacement)
    else {
      let prefixLen = 0;
      while (
        prefixLen < oldStr.length &&
        prefixLen < caretAfter &&
        oldStr[prefixLen] === newStr[prefixLen]
      ) {
        prefixLen++;
      }
      let suffixLen = 0;
      while (
        suffixLen < oldStr.length - prefixLen &&
        suffixLen < newStr.length - caretAfter &&
        oldStr[oldStr.length - 1 - suffixLen] === newStr[newStr.length - 1 - suffixLen]
      ) {
        suffixLen++;
      }
      const removedCount = oldStr.length - prefixLen - suffixLen;
      const insertedStr = newStr.slice(prefixLen, newStr.length - suffixLen);
      let firstEvent = true;

      for (let i = removedCount - 1; i >= 0; i--) {
        currentLog.push(['\b', firstEvent ? delta : 0, prefixLen + i]);
        firstEvent = false;
      }
      for (let i = 0; i < insertedStr.length; i++) {
        currentLog.push([insertedStr[i], firstEvent ? delta : 0, prefixLen + i]);
        firstEvent = false;
      }
    }

    worker.postMessage({
      type: 'reset',
      flashDelay: flashDelayT() * 1000,
      flickerDelay: flickerDelayT() * 1000,
    });
  };

  const handleEnterAction = () => {
    const text = currentText();
    if (text.trim()) {
      initFlash();
      if (flickerModeOn()) setIsActiveTimer(true);
    } else if (inflecTents()) {
      if (spawnDots()) killMyParticle();
      outFlect();
      setTypingStartTime(null);
      worker.postMessage({ type: 'stop' });
      setIsActiveTimer(false);
      setFlickerTimeLeft(0);
    } else {
      setTypingStartTime(null);
      worker.postMessage({ type: 'stop' });
      setIsActiveTimer(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const text = currentText();

    // Check Backspace lock first so Ctrl+Backspace cannot bypass it
    if (backspaceDisabled() && (e.key === 'Backspace' || e.key === 'Delete')) {
      e.preventDefault();
      if (text.trim().length > 0) initFlash();
      return;
    }

    // Block Shift+Navigation range selection
    if (
      e.shiftKey &&
      ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(e.key)
    ) {
      e.preventDefault();
      return;
    }

    // Handle Ctrl / Cmd / Alt shortcuts: Block Paste (V) and Select All (A), allow Ctrl+Backspace & Ctrl+Arrows
    if (e.ctrlKey || e.metaKey || e.altKey) {
      const lower = e.key.toLowerCase();
      if (lower === 'v' || lower === 'a') {
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      handleEnterAction();
      return;
    }

    // Allow Backspace, Delete, and Arrow keys; block unlisted keys
    if (
      !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Tab'].includes(e.key) &&
      !VALID_WRITER_KEYS.includes(e.key)
    ) {
      e.preventDefault();
    }
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
  const flashProgress = () => {
    const total = flashDelayT() * 1000;
    return total > 0 && isActiveTimer()
      ? Math.max(0, Math.min(1, flashTimeLeft() / total))
      : 0;
  };

  const flickerProgress = () => {
    const total = flickerDelayT() * 1000;
    return total > 0 && isActiveTimer() && flickerModeOn()
      ? Math.max(0, Math.min(1, flickerTimeLeft() / total))
      : 0;
  };

  const targetLabel = () => {
    const streamId = writerTargetID();
    if (streamId !== null) {
      const s = getStream(streamId);
      return s ? `Stream: ${s.title}` : 'Stream';
    }
    const vs = viewSpaces.find((v) => v.id === activeViewSpaceID());
    return vs ? `Space: ${vs.title} (Loose)` : 'Loose in Space';
  };

  return (
    <div
      data-timer-active={isActiveTimer() ? 'true' : 'false'}
      class='focus-writer'
      style={{
        '--flash-pct': `${(flashProgress() * 100).toFixed(1)}%`,
        '--flicker-pct': `${(flickerProgress() * 100).toFixed(1)}%`,
      }}
    >
      <div class="focus-writer__meta">

        <span class="focus-writer__target-badge">{targetLabel()}</span>
        <div class="focus-writer__toggles" role="group" aria-label="Writer view toggles">
          <button
            type="button"
            class="focus-writer__toggle-btn"
            aria-pressed={hideTypedText()}
            onClick={() => {
              setHideTypedText((prev) => !prev);
              textareaRef?.focus();
            }}
          >
          Invisible Ink
          </button>
          <button
            type="button"
            class="focus-writer__toggle-btn"
            aria-pressed={showTimeBars()}
            onClick={() => {
              setShowTimeBars((prev) => !prev);
              textareaRef?.focus();
            }}
          >
          {showTimeBars() ? 'Time Bars' : 'Time Bars'}
          </button>
          <button
            type="button"
            class="focus-writer__toggle-btn"
            aria-pressed={inflectionOn()}
            onClick={() => {
              setInflectionOn((prev) => !prev);
              textareaRef?.focus();
            }}
          >
            Inflection
          </button>
        </div>


        <span class="focus-writer__stats">
          {textWordCount(currentText())}w
          <Show when={backspaceDisabled()}>
            <span class="focus-writer__lock-badge" title="Backspace triggers Flash">
              No-BS
            </span>
          </Show>
        </span>
      </div>
        <div class="focus-writer__surface">
          <textarea
            ref={textareaRef}
            class="writers-block"
            classList={{ 'writers-block--hidden-text': hideTypedText() }}
            aria-label="Writing Input"
            spellcheck={false}
            autocorrect="off"
            autocapitalize="off"
            value={currentText()}
            onInput={(e) => {
              const el = e.currentTarget;
              const prevText = currentText();
              const val = el.value;

              // Catch mobile Return/Enter keys that bypass keydown via IME
              if (
                e.inputType === 'insertLineBreak' ||
                e.inputType === 'insertParagraph' ||
                val.includes('\n')
              ) {
                const cleaned = val.replace(/\n/g, '');
                if (cleaned !== prevText) {
                  recordMutationAndResetTimer(prevText, cleaned, el.selectionStart ?? cleaned.length);
                  setCurrentText(cleaned);
                }
                handleEnterAction();
                return;
              }

              // Catch mobile Backspace when backspaceDisabled() is active
              if (backspaceDisabled() && e.inputType?.startsWith('deleteContent')) {
                if (prevText.trim().length > 0) initFlash();
                else el.value = prevText;
                return;
              }

              const caretAfter = el.selectionStart ?? val.length;
              recordMutationAndResetTimer(prevText, val, caretAfter);
              setCurrentText(val);
              syncCursorIndex(el);
            }}
            onKeyUp={(e) => syncCursorIndex(e.currentTarget)}
            onClick={(e) => syncCursorIndex(e.currentTarget)}
            onMouseUp={(e) => syncCursorIndex(e.currentTarget)}
            onMouseMove={(e) => {
              if (e.buttons === 1) syncCursorIndex(e.currentTarget);
            }}
            onDblClick={(e) => {
              e.preventDefault();
              syncCursorIndex(e.currentTarget);
            }}
            onSelect={(e) => syncCursorIndex(e.currentTarget)}
            onPaste={(e) => e.preventDefault()}
            onDrop={(e) => e.preventDefault()}
            onKeyDown={(e) => { handleKeyDown(e) }}
            placeholder="Write on!"
            autofocus
          />

          <Show when={showTimeBars()}>
            <div class="focus-writer__timers" aria-hidden="true">
              <div class="focus-writer__timer-bar focus-writer__timer-bar--flash" />
              <Show when={flickerModeOn()}>
                <div class="focus-writer__timer-bar focus-writer__timer-bar--flicker" />
              </Show>
            </div>
          </Show>
        </div>
    </div>
  );
};
