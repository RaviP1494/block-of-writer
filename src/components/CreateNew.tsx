import { type Component, createSignal } from "solid-js";
import { createNewStream, createNewChain, createNewViewSpace } from "../store";


interface CreateNewProps {
  of: string;
};


export const CreateNew: Component<CreateNewProps> = (props) => {
  const [createName, setCreateName] = createSignal('');

  const handleCreate = () => {
    props.of === 'streams' ? createNewStream(createName()) : null;
    props.of === 'chains' ? createNewChain(createName()) : null;
    props.of === 'viewspace' ? createNewViewSpace(createName()) : null;
    setCreateName('');
  };

  return (
      <div class="new-maker"> 
        <input type="text" placeholder="Name" value={createName()}
          onInput={(e) => setCreateName(e.currentTarget.value)}
          onKeyDown={(e) => {
            e.key === 'Enter'
              ? handleCreate()
              : null
          }}
        />
        <button onClick={() => handleCreate()}>
          New {props.of} </button>
      </div>
  );
};
