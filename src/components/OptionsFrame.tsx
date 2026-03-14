// src/components/OptionsFrame.tsx
import { type Component, For } from 'solid-js';

export interface OptionItem {
  label: string;
  onClick: () => void;
}

interface OptionsFrameProps {
  options: OptionItem[];
  onClose: () => void;
}

export const OptionsFrame: Component<OptionsFrameProps> = (props) => {
  return (
    <div style={{
      position: 'absolute',
      top: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      "background-color": '#fff',
      border: '1px solid #ccc',
      "border-radius": '4px',
      padding: '4px',
      "box-shadow": '0 4px 8px rgba(0,0,0,0.1)',
      "z-index": 100,
      display: 'flex',
      "flex-direction": 'column',
      gap: '2px',
      "min-width": '80px'
    }}>
      <For each={props.options}>
        {(option) => (
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent clicks from bubbling up
              option.onClick();
              props.onClose();
            }}
            style={{
              padding: '6px 12px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              "text-align": 'center',
              "font-family": 'monospace',
              "font-size": '12px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {option.label}
          </button>
        )}
      </For>
    </div>
  );
};
