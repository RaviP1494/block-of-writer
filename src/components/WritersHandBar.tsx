import { type Component } from 'solid-js';
import {
  inflectionOn, setInflectionOn,
  flickerModeOn, setFlickerModeOn,
  setFlashDelayT, flashDelayT,
  setFlickerDelayT, flickerDelayT,
  backspaceDisabled, setBackspaceDisabled,
  inflecTents,
  outFlect,
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
        class={isActiveTimer() 
      ? 'finger timers inactivated' 
      : 'finger timers'}>
        <button
          class={isActiveTimer() 
      ? 'knuckle inactivated' 
      : 'knuckle'}>
          Adjust Timers
        </button>

        <div
          class='nail'>
          <div
            class='flex-down'>
            <button
              onClick={() => {
                if (inflecTents()
                  && inflecTents()!.length > 0) outFlect();
                setFlickerModeOn(!flickerModeOn())
              }}>
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
          <input type='checkbox'
            checked={backspaceDisabled()}
            onChange={() =>
              setBackspaceDisabled(!backspaceDisabled())} />
          <span>Disable Backspace</span>
        </div>
        <div
          class='checktog'>
          <input type='checkbox'
            checked={inflectionOn()}
            onChange={() =>{
              if (inflecTents() && inflecTents()!.length > 0) outFlect();
              setInflectionOn(!inflectionOn())
            }} />
          <span>Inflection Point</span>
        </div>
      </div>
    </div>


  );
};
