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
    <div class="streamlist">
      <div style={{
        width: '100%',
        display: 'flex',
      }}>
        <input type="text" placeholder="Title" value={newStreamName()}
          onInput={(e) => setNewStreamName(e.currentTarget.value)}
          onKeyDown={(e) => { e.key === 'Enter' ? handleCreateStream() : null }}
        />
        <button onClick={() => handleCreateStream()}
        style={{
          'background-color': '#408040',
        'flex-grow': '1'}}>
          New Stream</button>
      </div>
    <For each={[...allStreams]}>
    {(stream) => (
      <button class="streambtn"
      id={'stream' + stream.id.toString()}
      onClick={() => {handleClick(stream.id)}}
      style={{
        'background-color' : stream.id === writerTargetID() ? '#0040ff' : '#408080',
      }}>
        {stream.title}:{stream.id === writerTargetID() 
          ? '(' + streamWordCount(stream.id) + ')w' 
          : '(' + getStreamTSpan(stream.id) + ')s' }
      </button>
    )}
    </For>
      <button style={{
        'background-color': writerTargetID() === 0 ? '#141414' : '#404040', 
          width: '100%'}}
        onClick={() => {
          handleClick(0);
        }}>
        Space
      </button>
    </div>
  );
};
