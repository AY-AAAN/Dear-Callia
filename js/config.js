/* ==========================================================================
   Dear Callia – config.js
   Everything you will likely want to edit lives here. No code changes needed.
   ========================================================================== */
window.DC = window.DC || {};

DC.CONFIG = {
  brand: 'Dear Callia',
  currency: '₱',
  defaultPrice: 299,                // used by every collection unless it sets its own price

  /* ---- Ordering ---- */
  // If you have a Google Form / Tally / Typeform order form, paste its link here.
  // The "Open the order form" button will use it. Leave '' to use the built-in demo form on this page.
  externalOrderFormUrl: 'https://forms.gle/m7B7vsFYN9o4WjdT8',
  email: 'dearcallia.ebook@gmail.com',

  /* ---- Payment details shown AFTER an order is submitted (placeholders – replace!) ---- */
  payment: {
    gcash: { name: 'Dear Callia', number: '0900 000 0000' },
    landbank:  { name: 'Dear Callia', number: '0900 000 0000' }
  },

  /* ---- Social links (edit URLs; remove a line to hide it) ---- */
  social: [
    { name: 'Facebook',  url: 'https://www.facebook.com/people/dear-callia/61596042453958/' },
    { name: 'Instagram', url: 'https://www.instagram.com/dearcallia_' },
    
  ],

  /* Shows a small "Draft" tag on FAQ / Terms text that was written as a placeholder.
     Set to false once you have replaced it with your own wording. */
  draftNotes: true
};
