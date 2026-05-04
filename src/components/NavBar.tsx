import { For, type Component } from 'solid-js';
import {
    setUserMode,
  userMode,
} from '../store';

export const NavBar: Component = () => {

  const modes = ['WriteRead', 'Write'];

  return (
    <div class='finger navbar'>
    <div style={{
      color: '#ffffff',
      'font-family': '"Caveat", cursive'
    }}>Mode:</div>
    <div>
    <For each={modes}>
    {(mode:string) =>
    <button 
    onClick={()=>setUserMode(mode)}
    style={{
      'background-color': mode === userMode() ? 'green' : 'transparent'
    }}>{mode}</button>
    }
    </For>
    </div>
    </div>
  );
};
//   return (
//       <div 
//       class='finger navbar'>
//         <div class='knuckle'>
//           <button style={{
//             'flex-grow': '1'
//           }}>
//             {userMode()}
//           </button>
//         </div>
//         <div 
//         class='nail flex-wide'>
//           <button 
//           onClick={()=>setUserMode('Write')}
//           class={userMode() === 'ReadWrite' ? 'hidden' : ''}>
//             ReadWrite
//           </button>
//           <button 
//           onClick={()=>setUserMode('Read')}
//           class={userMode() === 'SparkScrape' ? 'hidden' : ''}>
//             SparkScrape
//           </button>
//         </div>
//       </div>
//   );
// };
