import {
  type Component,
  createSignal,
  createEffect,
  onCleanup,
  For,
  Show,
  batch,
} from 'solid-js';
import { allFlashes, userMode } from '../store';
import { DisplayFlash } from './DisplayFlash';

export interface ReplayGroup {
  type: 'flashes' | 'flicker';
  flashIDs: number[];
  flickerID: number | null;
}

interface ReplayStep {
  delay: number;
  gIdx: number;
  fIdx: number;
  flashID: number;
  prevFlashID: number | null;
  charTyped: string;
  cursorPosition: number;
}

export interface ReplayController {
  status: () => 'idle' | 'playing' | 'paused';
  isReplaying: () => boolean;
  completedGroups: () => Array<{
    gIdx: number;
    completedFlashIDs: number[];
  }>;
  activeGroupIdx: () => number;
  activeFlashID: () => number | null;
  activePrevFlashID: () => number | null;
  beforeCaret: () => string;
  afterCaret: () => string;
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

export const createReplayController = (
  getGroups: () => ReplayGroup[],
  entityKey: () => number
): ReplayController => {
  const [status, setStatus] = createSignal<'idle' | 'playing' | 'paused'>('idle');
  const [completedGroups, setCompletedGroups] = createSignal<
    Array<{ gIdx: number; completedFlashIDs: number[] }>
  >([]);
  const [activeGroupIdx, setActiveGroupIdx] = createSignal<number>(-1);
  const [activeFlashID, setActiveFlashID] = createSignal<number | null>(null);
  const [activePrevFlashID, setActivePrevFlashID] = createSignal<number | null>(null);
  const [beforeCaret, setBeforeCaret] = createSignal<string>('');
  const [afterCaret, setAfterCaret] = createSignal<string>('');

  let steps: ReplayStep[] = [];
  let stepIdx = 0;
  let timerId: number | undefined;
  let stepStartTime = 0;
  let remainingDelay = 0;

  let curGIdx = -1;
  let curFIdx = -1;
  let curFlashID: number | null = null;
  let rawBuf = '    ';
  let caretPos = 4;

  const clearTimer = () => {
    if (timerId !== undefined) {
      window.clearTimeout(timerId);
      timerId = undefined;
    }
  };

  const stop = () => {
    clearTimer();
    steps = [];
    stepIdx = 0;
    curGIdx = -1;
    curFIdx = -1;
    curFlashID = null;
    rawBuf = '    ';
    caretPos = 4;
    batch(() => {
      setStatus('idle');
      setCompletedGroups([]);
      setActiveGroupIdx(-1);
      setActiveFlashID(null);
      setActivePrevFlashID(null);
      setBeforeCaret('');
      setAfterCaret('');
    });
  };

  // Stop automatically if the user switches entities or leaves Read mode
  createEffect((prevKey) => {
    const nextKey = entityKey();
    const mode = userMode();
    if ((prevKey !== undefined && prevKey !== nextKey) || mode !== 'Read') {
      if (status() !== 'idle') stop();
    }
    return nextKey;
  });

  onCleanup(() => clearTimer());

  const buildSteps = (): ReplayStep[] => {
    const groups = getGroups();
    const queue: ReplayStep[] = [];

    groups.forEach((group, gIdx) => {
      group.flashIDs.forEach((flashID, fIdx) => {
        const flash = allFlashes.find((f) => f.id === flashID);
        if (!flash) return;

        const prevFlashID = fIdx > 0 ? group.flashIDs[fIdx - 1] : null;
        let preFlashDelay = 0;

        if (gIdx === 0 && fIdx === 0) {
          preFlashDelay = 0;
        } else if (fIdx === 0 || group.type === 'flashes') {
          // Standard 2-second gap between flickers / groups
          preFlashDelay = 2000;
        } else if (prevFlashID !== null) {
          // Runtime gap between previous flash's end time and current flash's start time
          const prevFlash = allFlashes.find((f) => f.id === prevFlashID);
          if (prevFlash) {
            const prevEnd = prevFlash.createDT + prevFlash.tSpan;
            preFlashDelay = Math.max(0, flash.createDT - prevEnd);
          }
        }

        if (flash.log && flash.log.length > 0) {
          flash.log.forEach(([charTyped, tTypedRel, cursorPosition], kIdx) => {
            queue.push({
              delay:
                kIdx === 0
                  ? preFlashDelay + Math.max(0, tTypedRel)
                  : Math.max(0, tTypedRel),
              gIdx,
              fIdx,
              flashID,
              prevFlashID,
              charTyped,
              cursorPosition,
            });
          });
        } else if (flash.textContents.length > 0) {
          // Fallback for flashes created prior to log capture
          const chars = Array.from(flash.textContents);
          const perChar = Math.max(
            15,
            Math.round(flash.tSpan / Math.max(1, chars.length))
          );
          chars.forEach((ch, cIdx) => {
            queue.push({
              delay: cIdx === 0 ? preFlashDelay : perChar,
              gIdx,
              fIdx,
              flashID,
              prevFlashID,
              charTyped: ch,
              cursorPosition: 4 + cIdx,
            });
          });
        }
      });
    });

    return queue;
  };

  const commitCurrentFlashToCompleted = () => {
    if (curGIdx < 0 || curFlashID === null) return;
    const finishedGroup = curGIdx;
    const finishedFlash = curFlashID;
    setCompletedGroups((prev) => {
      const next = [...prev];
      const idx = next.findIndex((g) => g.gIdx === finishedGroup);
      if (idx === -1) {
        next.push({ gIdx: finishedGroup, completedFlashIDs: [finishedFlash] });
      } else if (!next[idx].completedFlashIDs.includes(finishedFlash)) {
        next[idx] = {
          ...next[idx],
          completedFlashIDs: [...next[idx].completedFlashIDs, finishedFlash],
        };
      }
      return next;
    });
  };

  const executeCurrentStep = () => {
    if (stepIdx >= steps.length) {
      stop();
      return;
    }

    const step = steps[stepIdx];

    if (step.gIdx !== curGIdx || step.fIdx !== curFIdx) {
      commitCurrentFlashToCompleted();
      curGIdx = step.gIdx;
      curFIdx = step.fIdx;
      curFlashID = step.flashID;
      rawBuf = '    ';
      caretPos = 4;

      // Ensure group container exists
      setCompletedGroups((prev) => {
        if (prev.some((g) => g.gIdx === step.gIdx)) return prev;
        return [...prev, { gIdx: step.gIdx, completedFlashIDs: [] }];
      });
    }

    if (step.charTyped === '\b') {
      rawBuf =
        rawBuf.slice(0, step.cursorPosition) +
        rawBuf.slice(step.cursorPosition + 1);
      caretPos = step.cursorPosition;
    } else {
      rawBuf =
        rawBuf.slice(0, step.cursorPosition) +
        step.charTyped +
        rawBuf.slice(step.cursorPosition);
      caretPos = step.cursorPosition + step.charTyped.length;
    }

    const leadingSpaces = rawBuf.match(/^ {0,4}/)?.[0].length ?? 0;
    const splitAt = Math.max(leadingSpaces, caretPos);

    batch(() => {
      setActiveGroupIdx(step.gIdx);
      setActiveFlashID(step.flashID);
      setActivePrevFlashID(step.prevFlashID);
      setBeforeCaret(rawBuf.slice(leadingSpaces, splitAt));
      setAfterCaret(rawBuf.slice(splitAt));
    });

    stepIdx++;
    if (stepIdx < steps.length) {
      remainingDelay = steps[stepIdx].delay;
      scheduleNext();
    } else {
      // Hold final frame briefly before returning to normal view
      remainingDelay = 450;
      stepStartTime = Date.now();
      timerId = window.setTimeout(() => stop(), remainingDelay);
    }
  };

  const scheduleNext = () => {
    clearTimer();
    stepStartTime = Date.now();
    timerId = window.setTimeout(() => {
      timerId = undefined;
      executeCurrentStep();
    }, remainingDelay);
  };

  const start = () => {
    stop();
    steps = buildSteps();
    if (steps.length === 0) return;
    stepIdx = 0;
    remainingDelay = steps[0].delay;
    batch(() => {
      setStatus('playing');
      setCompletedGroups([{ gIdx: steps[0].gIdx, completedFlashIDs: [] }]);
      setActiveGroupIdx(steps[0].gIdx);
      setActiveFlashID(steps[0].flashID);
      setActivePrevFlashID(steps[0].prevFlashID);
      setBeforeCaret('');
      setAfterCaret('');
    });
    scheduleNext();
  };

  const pause = () => {
    if (status() !== 'playing') return;
    clearTimer();
    const elapsed = Date.now() - stepStartTime;
    remainingDelay = Math.max(0, remainingDelay - elapsed);
    setStatus('paused');
  };

  const resume = () => {
    if (status() !== 'paused') return;
    setStatus('playing');
    if (stepIdx >= steps.length) {
      stop();
    } else {
      scheduleNext();
    }
  };

  return {
    status,
    isReplaying: () => status() !== 'idle',
    completedGroups,
    activeGroupIdx,
    activeFlashID,
    activePrevFlashID,
    beforeCaret,
    afterCaret,
    start,
    pause,
    resume,
    stop,
  };
};

export const ReplayHeaderControl: Component<{
  controller: ReplayController;
}> = (props) => {
  return (
    <Show when={userMode() === 'Read'}>
      <div class="stream-header__actions-center">
        <Show
          when={props.controller.isReplaying()}
          fallback={
            <button
              type="button"
              class="stream-icon-btn stream-replay-btn"
              onClick={() => props.controller.start()}
              title="Replay"
            >
              ⟲
            </button>
          }
        >
          <button
            type="button"
            class="stream-icon-btn stream-replay-btn stream-replay-btn--active"
            onClick={() =>
              props.controller.status() === 'playing'
                ? props.controller.pause()
                : props.controller.resume()
            }
            title={props.controller.status() === 'playing' ? 'Pause Replay' : 'Resume Replay'}
          >
            {props.controller.status() === 'playing' ? '⏸' : '⏵'}
          </button>
          <button
            type="button"
            class="stream-icon-btn stream-replay-btn stream-icon-btn--danger"
            onClick={() => props.controller.stop()}
            title="Stop Replay"
          >
            ⏹
          </button>
        </Show>
      </div>
    </Show>
  );
};

export const ReplayTextView: Component<{
  controller: ReplayController;
  showTimes: () => boolean;
  isSpaced: () => boolean;
}> = (props) => {
  const activeFlash = () =>
    allFlashes.find((f) => f.id === props.controller.activeFlashID());

  const formatActiveTimestamp = () => {
    const fl = activeFlash();
    if (!fl) return '';
    const prevID = props.controller.activePrevFlashID();
    if (!prevID) {
      const d = new Date(fl.createDT);
      const pad = (n: number) => n.toString().padStart(2, '0');
      const hours = pad(d.getHours() % 12);
      const suffix = d.getHours() > 12 ? 'PM' : 'AM';
      return `${hours}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${suffix}`;
    }
    const prevFlash = allFlashes.find((f) => f.id === prevID);
    if (prevFlash) {
      const prevEnd = prevFlash.createDT + prevFlash.tSpan;
      const deltaMs = fl.createDT - prevEnd;
      const deltaSec = (Math.max(0, deltaMs) / 1000).toFixed(1);
      return `⊦${deltaSec}s`;
    }
    return '';
  };

  return (
    <For each={props.controller.completedGroups()}>
      {(grp) => (
        <div class="paragraph">
          <For each={grp.completedFlashIDs}>
            {(flashID, index) => {
              const prevID = index() > 0 ? grp.completedFlashIDs[index() - 1] : null;
              return (
                <DisplayFlash
                  id={flashID}
                  prevID={prevID}
                  showTimes={props.showTimes}
                  isSpaced={props.isSpaced}
                  renderedBy="replay"
                />
              );
            }}
          </For>

          <Show when={props.controller.activeGroupIdx() === grp.gIdx && activeFlash()}>
            <Show
              when={props.showTimes()}
              fallback={
                <span
                  classList={{
                    paragraph: props.isSpaced(),
                    'replay-active-flash': true,
                  }}
                  style={{
                    'word-wrap': 'break-word',
                    'overflow-wrap': 'break-word',
                  }}
                >
                  {props.controller.beforeCaret()}
                  <span class="replay-caret" aria-hidden="true" />
                  {props.controller.afterCaret()}&nbsp;
                </span>
              }
            >
              <div
                class="flash-timestamp"
                style={{
                  'text-align': 'left',
                  'text-decoration': props.controller.activePrevFlashID()
                    ? 'overline'
                    : 'underline',
                }}
              >
                {formatActiveTimestamp()}
              </div>
              <div class="paragraph flash replay-active-flash">
                {props.controller.beforeCaret()}
                <span class="replay-caret" aria-hidden="true" />
                {props.controller.afterCaret()}&nbsp;
              </div>
            </Show>
          </Show>
        </div>
      )}
    </For>
  );
};
