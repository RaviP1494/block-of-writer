import { type Component } from 'solid-js';
import {
  userMode,
} from '../store';

export const NavBar: Component = () => {

  return (
    <div class='finger navbar'>
    {userMode()}
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
