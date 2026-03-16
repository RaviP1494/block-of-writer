// src/App.tsx
import { onMount, type Component } from 'solid-js';
import { WriterSettings } from './components/WriterSettings';
import { WritersBlock } from './components/WritersBlock';
import { Spurtgatory } from './components/Spurtgatory';
import { StreamView } from './components/Stream';
import { setAllStreamsDB, setCurrentTargetStreamId, setCurrentViewedStreamId } from './store';
import { StreamSelector } from './components/StreamSelector';
import { AnimationOverlay } from './components/AnimationOverlay';
import { LooseLake } from './components/LooseLake';

const App: Component = () => {

  // Initialize a default target stream for Stage 1 testing
  onMount(() => {
    const initStreamId = 1;
    setAllStreamsDB([{ 
      id: initStreamId, 
      title: "Start Up Stream", 
      createDT: Date.now(), 
      readMode: 'TextReadMode', 
      contentIds: [] 
    }]);
    setCurrentTargetStreamId(initStreamId);
    setCurrentViewedStreamId(initStreamId);
  });

  return (

    <div style={{ "min-height": '100vh', display: 'flex', "flex-direction": 'column', padding: '20px' }}>
    <AnimationOverlay />
      {/* Top Section: 3-Column Grid */}
      <div style={{ 
        display: 'grid', 
        "grid-template-columns": '1fr auto 1fr', 
        gap: '20px', 
        "align-items": 'start' 
      }}>
        
        {/* Left: Empty for now (ReferenceBlock goes here later) */}
        <div>
          <LooseLake />
        </div>

        {/* Center: Engine */}
        <div style={{ display: 'flex', "flex-direction": 'column' }}>
          <WriterSettings />
          <WritersBlock />
        </div>

        {/* Right: Spurtgatory */}
        <div style={{ display: 'flex', "justify-content": 'flex-start' }}>
          <Spurtgatory />
        </div>

      </div>

      {/* Bottom Section: Stream Output */}
      <div style={{ "margin-top": '40px' }}>
        <StreamSelector />
        <StreamView />
      </div>

      {/* Global Styles for Stream Hover Highlighting */}
      <style>{`
        .spurt-highlight {
          transition: background-color 0.2s ease;
          border-radius: 2px;
        }
        .spurt-highlight:hover {
          background-color: #e0f7fa;
          cursor: help;
        }
      `}</style>
    </div>
  );
};

export default App;
