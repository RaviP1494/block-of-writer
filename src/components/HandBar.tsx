import { createSignal, type Component } from 'solid-js';
import {
  inflectionOn, setInflectionOn,
  flickerModeOn, setFlickerModeOn,
  backspaceDisabled, setBackspaceDisabled,
  userMode
} from '../store';
import { isActiveTimer } from './FocusWriter'

export const HandBar: Component = () => {
  const [showMenu, setShowMenu] = createSignal('menu');
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
      
        <div class='finger timers'>
          <button class='knuckle'>
            Adjust Timers
          </button>
          <div class='nail'>
          <div class='delay-set-holder'>
            <span>
              {flickerModeOn() ? 'Flashing Flickers' : 'Flashing SoloFlashes'}
            </span>
            <button onClick={() => setFlickerModeOn(!flickerModeOn())}>
              {flickerModeOn() ? 'No Flicker?' : 'Flicker?'}
            </button>
          </div>
          <div class='delay-set-holder'>
            <div>
              Delay To End Flash
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
              Delay To End Flicker
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
          <span>
            Disable Backspace</span>
          <input type='checkbox'
            checked={backspaceDisabled()}
            onChange={() => setBackspaceDisabled(!backspaceDisabled())} />
        </div>
        <div class='checktog'>
          <span>
            Inflection Point</span>
          <input type='checkbox'
            checked={inflectionOn()}
            onChange={() => setInflectionOn(!inflectionOn())} />
        </div>
    </div>

    </div>


  );
};
