import './style/index.css'
import { StrictMode } from 'react'
import ReactDOM  from 'react-dom/client'
import App from './App.tsx'
import { LanguageSelector } from './LanguageSelector.tsx';


/*window.addEventListener('DOMContentLoaded', async () => {
  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.register('service-worker.js');
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) window.location.reload();
  }

  // Cross-origin isolated context should now be ready
  console.log('crossOriginIsolated =', self.crossOriginIsolated);
});*/

ReactDOM.createRoot(document.getElementById("root")!).render(
  // <StrictMode>
<>
<App />
</>    
  // </StrictMode>
);
