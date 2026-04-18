import { createSignal, type Component } from 'solid-js';
import {
  inflectionOn, setInflectionOn,
  flickerModeOn, setFlickerModeOn,
  backspaceDisabled, setBackspaceDisabled,
  userMode,
  manualSaveApp,
  loadSavedApp
} from '../store';
import { isActiveTimer } from './FocusWriter'

export const HandBar: Component = () => {
  const [flashT, setFlashT] = createSignal(2);
  const [flickerT, setFlickerT] = createSignal(6);

  const handleDelayChange = (timer: string, direction: boolean) => {
    if (timer === 'flash') {
      setFlashT((prev) => direction && prev + 0.5 < flickerT()
        ? prev + 0.5
        : (prev > 0.5) && !direction
          ? flashT() - 0.5
          : prev);
    } else {
      setFlickerT((prev) => !direction && prev > flashT()
        ? prev - 0.5
        : prev + 0.5);
    }
  }

  return (
    <div class={isActiveTimer() ? 'handbar inactivated' : 'handbar'}>

    <div class='finger cache-actions'>
    <div style={{'margin-bottom': '5px', 'border-bottom': '1px solid'}}>Browser Cache</div>
    <div>
    <button onClick={()=>manualSaveApp()}>Save to</button>
    <button onClick={()=>loadSavedApp()}>Load from</button>
    </div>
    </div>
        <div class='finger timers'>
          <button class='knuckle'>
            Adjust Timers
          </button>
          <div class='nail'>
          <div class='delay-set-holder'>
            <button onClick={() => setFlickerModeOn(!flickerModeOn())}>
              {flickerModeOn() ? 'Flicker On' : 'Flicker Off'}
            </button>
          </div>
          <div class='delay-set-holder'>
            <div>
              Flash Delay: 
            </div>
            <div class='delay-set'>
              <button class='minus'
                onClick={() =>
                  handleDelayChange('flash', false)}
              >
                -
              </button>
              <span>
                {flashT()}s
              </span>
              <button
                onClick={() =>
                  handleDelayChange('flash', true)}
                class='plus'>
                +
              </button>
            </div>
          </div>
          <div class='delay-set-holder'
            style={{ display: flickerModeOn() ? 'flex' : 'none' }}>
            <div>
              Flicker Delay: 
            </div>
            <div class='delay-set'>
              <button class='minus'
                onClick={() =>
                  handleDelayChange('flicker', false)}
                style={{ 'background-color': '#a05010' }}>
                -
              </button>
              <span>
                {flickerT()}s
              </span>
              <button class='plus'
                onClick={() => handleDelayChange('flicker', true)}>
                +
              </button>
            </div>
          </div>
          </div>
        </div>
        <div class='finger modes'>
          <div class='knuckle'>
          <div style={{'margin-bottom': '5px', 'border-bottom': '1px solid'}}>Mode:</div>
            <button style={{
              'flex-grow': '1'
            }}>
              {userMode()}
            </button>
          </div>
          <div class='nail'>
            <button class={userMode() === 'FocusWrite' ? 'hidden' : ''}>
              FocusWrite
            </button>
            <button class={userMode() === 'ReadWrite' ? 'hidden' : ''}>
              ReadWrite
            </button>
            <button class={userMode() === 'ReadArrange' ? 'hidden' : ''}>
              ReadArrange
            </button>
            <button class={userMode() === 'SparkScrape' ? 'hidden' : ''}>
              SparkScrape
            </button>
          </div>
        </div>
        <div class='finger toggles'>
        <div class='checktog'>
          <input type='checkbox'
            checked={backspaceDisabled()}
            onChange={() => setBackspaceDisabled(!backspaceDisabled())} />
          <span>Disable Backspace</span>
        </div>
        <div class='checktog'>
          <input type='checkbox'
            checked={inflectionOn()}
            onChange={() => setInflectionOn(!inflectionOn())} />
          <span>
            Inflection Point</span>
        </div>
    </div>

    </div>


  );
};
