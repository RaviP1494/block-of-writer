import { type Component, For } from 'solid-js';
import { allStreams, writerTargetID, getStreamTSpan, streamWordCount } from '../store/';


interface StreamListProps {
  handleClick: (id:number) => void;
};


export const StreamList: Component<StreamListProps> = (props) => {

  return (
    <div class="streamlist">
    <For each={[...allStreams]}>
    {(stream) => (
      <button class="streambtn"
      onClick={() => {props.handleClick(stream.id)}}
      style={{
        'background-color' : stream.id === writerTargetID() ? '#be1410' : 'inherit',
      }}>
        {stream.title}:{stream.id === writerTargetID() 
          ? '(' + streamWordCount(stream.id) + ')w' 
          : '(' + getStreamTSpan(stream.id) + ')s' }
      </button>
    )}
    </For>
    </div>
  );
};
