import { type Component, For, createSignal } from 'solid-js';
import { allStreams, writerTargetID, getStreamTSpan, streamWordCount, createNewStream, setWriterTargetID, focusedStreamID, setFocusedStreamID } from '../store/';


interface StreamListProps {
  clickDo: boolean;
};

export const StreamList: Component<StreamListProps> = (props) => {
  const [newStreamName, setNewStreamName] = createSignal("");

const handleCreateStream = () => {
    createNewStream(newStreamName().trim());
    setNewStreamName('');
  }

  const handleClick = (streamID: number) => {
    if (props.clickDo){
      writerTargetID() !== streamID 
        ? setWriterTargetID(streamID)
        : (focusedStreamID() !== streamID
           ? setFocusedStreamID(streamID)
           : setFocusedStreamID(0))
    }
  }

  return (
    <div class="streamlist-box">
      <div style={{
        'max-width': '100%',
        display: 'flex',
        'flex-wrap': 'wrap',
      }}>
        <input type="text" placeholder="Name for" value={newStreamName()}
          onInput={(e) => setNewStreamName(e.currentTarget.value)}
          onKeyDown={(e) => { e.key === 'Enter' ? handleCreateStream() : null }}
        />
        <button onClick={() => handleCreateStream()}
        class='new-stream-btn'>
          New Stream</button>
      </div>
      <button style={{
        'background-color': 
          writerTargetID() === 0 ? '#141414' : '#404040', 
        'max-height': '4ch',
          width: '100%'}}
        onClick={() => {
          handleClick(0);
        }}>
        Space
      </button>
    <div class="streamlist">
    <For each={[...allStreams]}>
    {(stream) => (
      <button class="streambtn"
      id={'stream' + stream.id.toString()}
      onClick={() => {handleClick(stream.id)}}
      style={{
        'background-color' : stream.id === writerTargetID() ? '#0040ff' : '#408080',
      }}>
        {stream.title}:{stream.id === writerTargetID() 
          ? '(' + streamWordCount(stream.id) + 'w)' 
          : '(' + getStreamTSpan(stream.id) + ')' }
      </button>
    )}
    </For>
      </div>
    </div>
  );
};
