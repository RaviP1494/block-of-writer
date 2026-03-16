// src/components/LooseLake.tsx
import { type Component, For, Show, Switch, Match, createMemo } from 'solid-js';
import { looseLakeDB, allSpurtsDB, allBurstsDB, allStreamsDB } from '../store';

export const LooseLake: Component = () => {

  return (
    <div style={{ 
      width: '50%', 
      "min-height": '150px', 
      border: '2px solid #b3e5fc', 
      "border-radius": '8px', 
      "background-color": '#e1f5fe', 
      padding: '20px',
      "margin-top": '20px',
      display: 'flex',
      "flex-wrap": 'wrap',
      gap: '15px',
      "align-items": 'center',
      "align-content": 'flex-start'
    }}>
      <div style={{ width: '100%', "font-family": 'monospace', color: '#0277bd', "margin-bottom": '10px', "font-weight": 'bold', "text-align":'center' }}>
        ~ Loose Lake ~
      </div>
      
      <For each={looseLakeDB()}>
        {(item) => {
          
          // 1. Fully Reactive Lookup: Constantly tracks the database for changes
          const entity = createMemo(() => {
            if (item.entityType === 'spurt') return allSpurtsDB.find(s => s.id === item.refId);
            if (item.entityType === 'burst') return allBurstsDB.find(b => b.id === item.refId);
            if (item.entityType === 'stream') return allStreamsDB.find(s => s.id === item.refId);
            return null;
          });

          return (
            // 2. Fallback Debugger: If the item is in the Lake but NOT in the database, it renders RED.
            <Show 
              when={entity()} 
              fallback={
                <div style={{ padding: '5px', background: 'red', color: 'white', "border-radius": '4px', "font-size": '10px' }}>
                  Ghost {item.entityType} ({item.refId})
                </div>
              }
            >
              <Switch>
                
                {/* SPURT SHAPE */}
                <Match when={item.entityType === 'spurt'}>
                  <div 
                    title={`Spurt: "${(entity() as any).spurTents.substring(0, 30)}..."`}
                    style={{
                      width: '15px', height: '15px', "border-radius": '50%',
                      "background-color": '#4040ff', color: '#a9a9a9', display: 'flex',
                      "justify-content": 'center', "align-items": 'center',
                      "font-size": '10px', cursor: 'pointer', "box-shadow": '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    S
                  </div>
                </Match>

                {/* BURST SHAPE */}
                <Match when={item.entityType === 'burst'}>
                  <div 
                    title={`Burst (${(entity() as any).contentIds.length} spurts)`}
                    style={{
                      padding: '5px 10px', "border-radius": '15px',
                      "background-color": '#a9a9a9', color: '#60f060', display: 'flex',
                      "justify-content": 'center', "align-items": 'center',
                      "font-size": '12px', cursor: 'pointer', "font-family": 'monospace',
                      "font-weight": "bold"
                    }}
                  >
                    B
                  </div>
                </Match>

              </Switch>
            </Show>
          );
        }}
      </For>
    </div>
  );
};
