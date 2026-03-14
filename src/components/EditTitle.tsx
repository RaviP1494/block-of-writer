import { createSignal, onMount, type Component } from 'solid-js';

interface EditTitleProps {
  initialValue: string;
  onSave: (newValue: string) => void;
  onCancel: () => void;
}

export const EditTitle: Component<EditTitleProps> = (props) => {
  const [value, setValue] = createSignal(props.initialValue);
  let inputRef: HTMLInputElement | undefined;

  onMount(() => {
    if (inputRef) {
      inputRef.focus();
      inputRef.select(); // This highlights the entire text immediately
    }
  });

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      props.onSave(value());
    } else if (e.key === 'Escape') {
      props.onCancel();
    }
  };

  return (
    <div style={{ 
      display: 'inline-block', 
      border: '2px solid #aaa', 
      "border-radius": '4px', 
      padding: '2px 4px',
      "margin-bottom": '10px',
      "background-color": '#fff'
    }}>
      <input
        ref={inputRef}
        type="text"
        value={value()}
        onInput={(e) => setValue(e.currentTarget.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => props.onSave(value())} // Save if they click outside the box
        style={{
          "font-family": 'monospace',
          "font-size": '24px', // Matches standard h2 size
          "font-weight": 'bold',
          border: 'none',
          outline: 'none',
          width: '100%',
          "background-color": 'transparent'
        }}
      />
    </div>
  );
};
