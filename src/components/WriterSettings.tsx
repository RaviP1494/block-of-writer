// src/components/WriterSettings.tsx
import { type Component, Show } from 'solid-js';
import { 
  tSpurtDelay, setTSpurtDelay, 
  delayTDelta, setDelayTDelta,
  spurtgatoryEnabled, setSpurtgatoryEnabled,
  isWritersBlockEmpty, createNewStream,
  backspaceDisabled, setBackspaceDisabled,
  burstModeEnabled, setBurstModeEnabled,
  tBurstDelay, setTBurstDelay
} from '../store';

export const WriterSettings: Component = () => {
  
  const changeDelta = (amount: number) => {
    setDelayTDelta(prev => Math.max(0.25, prev + amount)); // Min delta 0.25s
  };

  // Math.round is used to avoid floating point precision issues
  const changeSpurtDelay = (amount: number) => {
    setTSpurtDelay(prev => Math.max(0, Math.round((prev + amount) * 1000) / 1000));
  };

  const changeBurstDelay = (amount: number) => {
    setTBurstDelay(prev => Math.max(0, Math.round((prev + amount) * 1000) / 1000));
  };

  return (
    <div style={{ 
      display: 'flex', 
      gap: '20px', 
      "margin-bottom": '0px', 
      "flex-direction": "column-reverse",
      "justify-content": "center",
      "align-items": "center",
      opacity: isWritersBlockEmpty() ? 1 : 0.5,
      "pointer-events": isWritersBlockEmpty() ? 'auto' : 'none' 
    }}>

      {/* tSpurtDelay Controls */}
      <div>
        <button onClick={() => changeSpurtDelay(-delayTDelta())}>[-]</button>
        <span style={{ margin: '0 10px' }}>Delay: {tSpurtDelay()}s</span>
        <button onClick={() => changeSpurtDelay(delayTDelta())}>[+]</button>
      </div>

      {/* delayTDelta Controls */}
      <div>
        <button onClick={() => changeDelta(-0.25)}>[-]</button>
        <span style={{ margin: '0 10px' }}>Delta: {delayTDelta()}s</span>
        <button onClick={() => changeDelta(0.25)}>[+]</button>
      </div>

      {/* tBurstDelay Controls */}
      <Show when={burstModeEnabled()}>
        <div>
          <button onClick={() => changeBurstDelay(-delayTDelta())}>[-]</button>
          <span style={{ margin: '0 10px' }}>Delta: {tBurstDelay()}s</span>
          <button onClick={() => changeBurstDelay(delayTDelta())}>[+]</button>
        </div>
      </Show>

      {/* Burst Mode Toggle */}
      <label>
        <input 
          type="checkbox" 
          checked={burstModeEnabled()} 
          onChange={(e) => setBurstModeEnabled(e.target.checked)} 
        />
        Burst Mode
      </label>

      {/* Spurtgatory Toggle */}
      <label>
        <input 
          type="checkbox" 
          checked={spurtgatoryEnabled()} 
          onChange={(e) => setSpurtgatoryEnabled(e.target.checked)} 
        />
        Last Looker
      </label>

      {/* Backspace Toggle */}
      <label>
        <input 
          type="checkbox" 
          checked={backspaceDisabled()} 
          onChange={(e) => setBackspaceDisabled(e.target.checked)} 
        />
        Hard Mode
      </label>

      <button 
        onClick={createNewStream} 
        style={{"margin-left": "10px"}}
        >
        New Stream
      </button>
      
    </div>
  );
};
