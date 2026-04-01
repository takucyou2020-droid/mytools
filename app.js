// My Tools - Unified Homepage
// Service Worker Registration
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
        .then(reg => console.log('SW registered'))
        .catch(err => console.log('SW registration failed'));
}
