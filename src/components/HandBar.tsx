import { createSignal, type Component } from 'solid-js';
import {
  inflectionOn, setInflectionOn,
  flickerModeOn, setFlickerModeOn,
  backspaceDisabled, setBackspaceDisabled,
  userMode
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

      <div class='mode-selection choice-fun'>
        <button class='choice-bringer'>
          {userMode()}
        </button>
        <div class='choices'>
          <button class={userMode() === 'FocusWrite' ? 'hidden' : 'choice'}>
            FocusWrite
          </button>
          <button class={userMode() === 'ReadWrite' ? 'hidden' : 'choice'}>
            ReadWrite
          </button>
          <button class={userMode() === 'ReadArrange' ? 'hidden' : 'choice'}>
            ReadArrange
          </button>
          <button class={userMode() === 'SparkScrape' ? 'hidden' : 'choice'}>
            SparkScrape
          </button>
        </div>
      </div>

      <div class='choice-fun'>
        <div class='choice-bringer'>
          <button>
            Adjust Timers
          </button>
        </div>
        <div class='choices focus-inflection-point'>
          <div>
            <span>
              {flickerModeOn() ? 'Flicker-' : 'Solo-'}
            </span>
            Flashing
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

      <div class='choice-fun'>
        <button class='choice-bringer'>
          Options
        </button>
        <div class='choices'>
          <div class='checktog'>
            <input type='checkbox'
              checked={backspaceDisabled()}
              onChange={() => setBackspaceDisabled(!backspaceDisabled())} />
            <span style={{ 'font-family': "'Caveat', cursive" }}>
              Disable Backspace</span>
          </div>
          <div class='checktog'>
            <input type='checkbox'
              checked={inflectionOn()}
              onChange={() => setInflectionOn(!inflectionOn())} />
            <span>
              Inflection Point
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};
