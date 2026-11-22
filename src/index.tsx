/* @refresh reload */

import '@fontsource/syne-mono';
import '@fontsource/caveat';
import './index.css'
import { render } from 'solid-js/web'
import App from './App.tsx'

const root = document.getElementById('root')

render(() => <App />, root!)
