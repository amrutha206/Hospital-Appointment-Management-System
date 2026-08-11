(function(){
  document.addEventListener('DOMContentLoaded', () => {
    if(document.body.dataset.page !== 'login') return;
    // Login wiring lives in appointments.js so the shared auth state and redirects stay in one place.
  });
})();
