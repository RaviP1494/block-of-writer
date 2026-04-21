import { type Component, Switch, Match } from 'solid-js';
import { showStats, allFlashes, allStreams, allFlickers, setShowStats } from '../store';


export const DisplayStats: Component = () => {
  const flash = () => allFlashes.find(f=>f.id===showStats()?.refID);
  const flicker = () => allFlickers.find(f=>f.id===showStats()?.refID);
  const stream = () => allStreams.find(s=>s.id===showStats()?.refID);

  return (
    <Switch>
    <Match when={flash()}>
    <div 
    style={{color: '#ff0000'}}
    onClick={()=> setShowStats(null)}
    class='flex-top-down'>
    <div>ID: {flash()?.id}</div>
    <div>createDT: {flash()?.createDT}</div>
    <div>textContents: {flash()?.textContents}</div>
    <div>tSpan: {flash()?.tSpan}</div>
    <div>delayTSpan: {flash()?.delayTSpan}</div>
    </div>
    </Match>
    <Match when={flicker()}>
    <div 
    class='flex-top-down'>
    <div>ID: {flicker()?.id}</div>
    <div>createDT: {flicker()?.createDT}</div>
    <div>delayTSpan: {flicker()?.delayTSpan}</div>
    </div>
    </Match>
    <Match when={stream()}>
    <div 
    class='flex-top-down'>
    <div>ID: {stream()?.id}</div>
    <div>Title: {stream()?.title}</div>
    <div>createDT: {stream()?.createDT}</div>
    </div>
    </Match>
    </Switch>
  );
}
