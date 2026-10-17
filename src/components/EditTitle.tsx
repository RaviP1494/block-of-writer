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
      onBlur={() => props.onSave(value())}
      class="wb-edit-title-input"
    />
  );
};
