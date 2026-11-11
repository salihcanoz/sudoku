'use strict';
if ('serviceWorker' in navigator && window.isSecureContext && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).catch(error => {
      console.warn('Sudoku offline support could not be enabled:', error);
    });
  });
}
