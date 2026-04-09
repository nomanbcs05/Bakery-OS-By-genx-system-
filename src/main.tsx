import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register Service Worker for PWA (only in production)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
} else if ('serviceWorker' in navigator) {
  // Unregister all service workers in development to avoid HMR interference
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const registration of registrations) {
      registration.unregister().then(() => {
        console.log('SW unregistered successfully');
        // Clear caches too
        if ('caches' in window) {
          caches.keys().then(names => {
            for (const name of names) caches.delete(name);
          });
        }
      });
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
