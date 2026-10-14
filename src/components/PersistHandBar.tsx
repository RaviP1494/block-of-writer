import { type Component } from 'solid-js';
import { saveSessionToFile, loadFromFile } from '../store';

export const PersistHandBar: Component = () => {
  return (
    <div class='cache-actions'>
      <button class='save'
        onClick={() => saveSessionToFile()}>
        Save
      </button>
      <div>Browser Cache</div>
      <button class='load'
        onClick={() => loadFromFile()}>
        Load
      </button>
    </div>
  );
}
