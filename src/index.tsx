/* @refresh reload */

import '@fontsource/syne-mono';
import '@fontsource/caveat';
import './index.css'
import { render } from 'solid-js/web'
import App from './App.tsx'
import { initAnalytics } from './analytics'

initAnalytics()

const root = document.getElementById('root')

render(() => <App />, root!)
