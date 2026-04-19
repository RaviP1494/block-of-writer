import { type Component } from 'solid-js';
import { NavBar } from './NavBar';
import { manualSaveApp, loadSavedApp } from '../store';

export const WelcomeTitle: Component = () => {
  return (
    <div class='welcomer flex-top-down'>
      <div class='cache-actions'>
        <button
          onClick={() => manualSaveApp()}>
          Save
        </button>
        <div>Browser Cache</div>
        <button
          onClick={() => loadSavedApp()}>
          Load
        </button>
      </div>
      <h1 style={{margin: '5px 10px'}}>Writer's Block</h1>
      <NavBar />
    </div>
  );
}
