// src/components/WriterSettings.tsx
import { type Component } from 'solid-js';
import { 
  tSpurtDelay, setTSpurtDelay, 
  delayTDelta, setDelayTDelta,
  spurtgatoryEnabled, setSpurtgatoryEnabled,
  isWritersBlockEmpty, createNewStream
} from '../store';

export const WriterSettings: Component = () => {
  
  const changeDelta = (amount: number) => {
    setDelayTDelta(prev => Math.max(0.25, prev + amount)); // Min delta 0.25s
  };

  const changeDelay = (amount: number) => {
    // Math.round is used to avoid floating point precision issues
    setTSpurtDelay(prev => Math.max(0, Math.round((prev + amount) * 1000) / 1000));
  };

  return (
    <div style={{ 
      display: 'flex', 
      gap: '20px', 
      "margin-bottom": '10px', 
      "justify-content": "center",
      "align-items": "center",
      opacity: isWritersBlockEmpty() ? 1 : 0.5,
      "pointer-events": isWritersBlockEmpty() ? 'auto' : 'none' 
    }}>
      
      {/* delayTDelta Controls */}
      <div>
        <button onClick={() => changeDelta(-0.25)}>[-]</button>
        <span style={{ margin: '0 10px' }}>Delta: {delayTDelta()}s</span>
        <button onClick={() => changeDelta(0.25)}>[+]</button>
      </div>

      {/* tSpurtDelay Controls */}
      <div>
        <button onClick={() => changeDelay(-delayTDelta())}>[-]</button>
        <span style={{ margin: '0 10px' }}>Delay: {tSpurtDelay()}s</span>
        <button onClick={() => changeDelay(delayTDelta())}>[+]</button>
      </div>

      {/* Spurtgatory Toggle */}
      <label>
        <input 
          type="checkbox" 
          checked={spurtgatoryEnabled()} 
          onChange={(e) => setSpurtgatoryEnabled(e.target.checked)} 
        />
        Spurtgatory
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
