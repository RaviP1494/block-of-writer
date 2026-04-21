import { type Component, Show, Match, Switch, For } from 'solid-js';
import {
  focusedStreamID,
  sparkChains,
  userMode
} from '../store';
import { DisplayStream } from './DisplayStream';


export const SideReader: Component = () => {
  // const renderSpace = () => {
  //   const activeSpace = createMemo(() => viewSpaces.find(vs => vs.id === activeViewSpaceID()));
  //   const nonStreams = () => activeSpace()?.tentsInSpace?.filter((e) => e.entityType === 'flicker' || e.entityType === 'flash') || [];
  //   return !activeSpace() ? ('null space')
  //     : (
  //       <Show when={activeSpace()}>
  //         <div class=''>
  //           <Show
  //             when={!isEditingTitle()}
  //             fallback={
  //               <EditTitle
  //                 initialValue={activeSpace()!.name ? activeSpace()!.name : 'null'}
  //                 onSave={(name: string) => {
  //                   updateSpaceName(activeSpace()!.id, name);
  //                   setIsEditingTitle(false);
  //                 }}
  //                 onCancel={() => setIsEditingTitle(false)} />
  //             }>
  //             <h2 onClick={() => setIsEditingTitle(true)}>
  //               {activeSpace()?.name}
  //             </h2>
  //           </Show>
  //         </div>
  //         <div class='stream'>
  //           <For each={nonStreams()}>
  //             {(ent) => {
  //               if (ent.entityType === 'flash') {
  //                 return (
  //                   <div
  //                     class='solo-flash'>
  //                     <span>
  //                       {allFlashes.find(
  //                         f => f.id === ent.refID)?.textContents || 'null'}
  //                     </span>
  //                   </div>);
  //               }
  //
  //               if (ent.entityType === 'flicker') {
  //                 return (<div class='solo-flicker'>
  //                   <For each={flickerFlashIDs(ent.refID)}>
  //                     {(flashID) => (
  //                       <span
  //                         class='inner-flash'>
  //                         {allFlashes.find(
  //                           f => f.id === flashID)?.textContents || 'null'}
  //                       </span>
  //                     )}
  //                   </For>
  //                 </div>
  //                 );
  //               }
  //
  //               return 'null space';
  //             }}
  //           </For>
  //         </div>
  //       </Show>
  //     );
  // };
  //


  return (
    <Switch>
      <Match when={userMode() === 'ReadWrite'}>
        <Show when={focusedStreamID()}>
          <DisplayStream id={focusedStreamID()} />
        </Show>
      </Match>
      <Match when={userMode() === 'SparkScrape'}>
        <For each={sparkChains}>
        {(stream) =>
          <DisplayStream id={stream.id} />
        }
        </For>
      </Match>
    </Switch>
  );
};


