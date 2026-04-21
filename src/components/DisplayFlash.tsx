import { type Component, Show, createMemo } from "solid-js";
import { addToChain, allFlashes } from "../store";

interface DisplayFlashProps {
  id: number;
  showTimes: () => boolean;
  isSpaced: () => boolean;
  prevID?: number | null;
  clickDo?: string;
}

export const DisplayFlash: Component<DisplayFlashProps> = (props) => {
  const flash = () => allFlashes.find(f => f.id === props.id);
  const showTimes = createMemo(() => props.showTimes());
  const isSpaced = createMemo(() => props.isSpaced());

  const handleClick = () => {
    if(props.clickDo === 'chain'){
      addToChain(flash()!.id);
    }
  }

  return (
    <Show when={flash()}>
    <Show
          when={showTimes()}
          fallback={
            <span 
            onClick={()=>handleClick()}
            class={isSpaced() ? 'paragraph' : ''}
              title={(flash()!.tSpan / 1000).toString() + ' seconds'}>
              {flash()!.textContents}&nbsp;
            </span>
          }>
          <div style={{ color: '#800000', 'text-align': 'left', 'text-decoration': props.prevID ? 'overline' : 'underline' }}>
            {(() => {
              if (!props.prevID) {
                // First flash: Show absolute time
                const d = new Date(flash()!.createDT);
                const pad = (n: number) => n.toString().padStart(2, '0');
                const hours = pad(d.getHours() % 12);
                const suffix = d.getHours() > 12 ? 'PM' : 'AM'
                return `${hours}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${suffix}`;
              } else {
                const prevFlash = allFlashes.find(f => f.id === props.prevID);
                if (prevFlash) {
                  const prevEnd = prevFlash.createDT + prevFlash.tSpan;
                  const deltaMs = flash()!.createDT - prevEnd;
                  // Math.max prevents negative values if typing overlaps
                  const deltaSec = (Math.max(0, deltaMs) / 1000).toFixed(1);
                  console.log(prevFlash);
                  return `⊦${deltaSec}s`;
                }
                return '';
              }
            })()}
          </div>
          <div
            class='paragraph flash'
            title={(flash()!.tSpan / 1000).toString() + ' seconds'}
            onClick={()=>handleClick()}
            style={{ 'color': '#000000' }}>
            {flash()!.textContents}&nbsp
          </div>
        </Show>
    </Show>
  );
};
