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
    <input
      ref={inputRef}
      type="text"
      value={value()}
      onInput={(e) => setValue(e.currentTarget.value)}
      onKeyDown={handleKeyDown}
      onBlur={() => props.onSave(value())} // Save if they click outside the box
      style={{
        "font-size": '1.2em', 
        "font-weight": 'bold',
        margin: '0.83em 0',
        padding: '0',
        
        color: 'inherit',
        "text-shadow": 'inherit',
        "text-align": "center",
        "background-color": 'transparent',
        
        border: 'none',
        "border-bottom": '2px dashed #90b0f0', // Subtle hint that it's an input
        outline: 'none',
        "box-sizing": 'border-box'
      }}
    />
  );
};
