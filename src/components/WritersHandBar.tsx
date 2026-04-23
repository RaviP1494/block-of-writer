import { type Component } from 'solid-js';
import {
  inflectionOn, setInflectionOn,
  flickerModeOn, setFlickerModeOn,
  setFlashDelayT, flashDelayT,
  setFlickerDelayT, flickerDelayT,
  backspaceDisabled, setBackspaceDisabled,
} from '../store';
import { isActiveTimer } from './FocusWriter'

export const WritersHandBar: Component = () => {

  const handleDelayChange = (
    timer: string, 
    direction: boolean
  ) => {
    if (timer === 'flash') {
      setFlashDelayT(
        () => direction && flashDelayT() + 0.5 < flickerDelayT()
        ? flashDelayT() + 0.5
        : (flashDelayT() > 0.5) && !direction
          ? flashDelayT() - 0.5
          : flashDelayT());
    } else {
      setFlickerDelayT(
        () => !direction && flickerDelayT() - flashDelayT()
        ? flickerDelayT() - 0.5
        : flickerDelayT() + 0.5);
    }
  }

  return (
    <div class={isActiveTimer() 
      ? 'writers-handbar inactivated' 
      : 'writers-handbar'}>
      <div
        class='finger timers'>
        <button
          class='knuckle'>
          Adjust Timers
        </button>

        <div
          class='nail'>
          <div
            class='flex-down'>
            <button
              onClick={() => setFlickerModeOn(!flickerModeOn())}>
              {flickerModeOn() ? 'Flicker On' : 'Flicker Off'}
            </button>
          </div>
          <div
            class='delay-set-holder'>
            <div>
              Flash Delay:
            </div>
            <div
              class='delay-set'>
              <button
                class='minus'
                onClick={() =>
                  handleDelayChange('flash', false)}
              >
                -
              </button>
              <span>
                {flashDelayT()}s
              </span>
              <button
                onClick={() =>
                  handleDelayChange('flash', true)}
                class='plus'>
                +
              </button>
            </div>
          </div>
          <div
            class='delay-set-holder'
            style={{
              display: flickerModeOn()
                ? 'flex'
                : 'none'
            }}>
            <div>
              Flicker Delay:
            </div>
            <div
              class='delay-set'>
              <button
                class='minus'
                onClick={() =>
                  handleDelayChange('flicker', false)}
                style={{
                  'background-color': '#a05010'
                }}>
                -
              </button>
              <span>
                {flickerDelayT()}s
              </span>
              <button
                class='plus'
                onClick={() =>
                  handleDelayChange('flicker', true)}>
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        class='toggles'>
        <div
          class='checktog'>
          <span>Disable Backspace</span>
          <input type='checkbox'
            checked={backspaceDisabled()}
            onChange={() =>
              setBackspaceDisabled(!backspaceDisabled())} />
        </div>
        <div
          class='checktog'>
          <span>
            Inflection Point</span>
          <input type='checkbox'
            checked={inflectionOn()}
            onChange={() =>
              setInflectionOn(!inflectionOn())} />
        </div>
      </div>
    </div>


  );
};
