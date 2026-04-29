import { type Component } from 'solid-js';
import { manualSaveApp, loadSavedApp } from '../store';

export const PersistHandBar: Component = () => {
  return (
    <div class='cache-actions'>
      <button class='save'
        onClick={() => manualSaveApp()}>
        Save
      </button>
      <div>Browser Cache</div>
      <button class='load'
        onClick={() => loadSavedApp()}>
        Load
      </button>
    </div>
  );
}
