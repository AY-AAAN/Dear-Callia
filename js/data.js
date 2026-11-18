/* ==========================================================================
   Dear Callia – data.js
   Collections, FAQ and Terms content. This is the single source of truth –
   the page renders from it and nothing is duplicated in the HTML.

   BACKEND NOTE: DC.CollectionService is the only thing the UI calls to read
   collections. Re-implement list()/byId() with fetch() later; keep the shape.
   Each object mirrors a future `collections` table row.
   ========================================================================== */
(function () {
  'use strict';
  const DC = window.DC;

  DC.COLLECTIONS = [
    { id: 'literary-icons', no: '01', name: 'The Literary Icons', tone: 'gold', titles: 100, price: null,
      summary: '100 curated literary titles',
      includes: ['Timeless classics', 'Modern literary fiction', 'Award-winning authors', 'Essays and memoirs', 'Book club picks'],
      sample: [], moods: ['literary'] },
    { id: 'romance', no: '02', name: 'The Romance Collection', tone: 'rose', titles: 100, price: null,
      summary: '100 curated romance titles',
      includes: ['Contemporary romance', 'Sports romance', 'Historical romance', 'Romantic fantasy', 'BookTok favorites'],
      sample: ['Icebreaker, Hannah Grace', 'The Love Hypothesis, Ali Hazelwood', 'Book Lovers, Emily Henry', 'Twisted Love, Ana Huang', 'Better Than the Movies, Lynn Painter'],
      moods: ['love'] },
    { id: 'mystery', no: '03', name: 'The Mystery Files', tone: 'deep', titles: 100, price: null,
      summary: '100 curated mystery titles',
      includes: ['Detective fiction', 'Psychological thrillers', 'Cozy mysteries', 'Crime and suspense', 'Whodunit classics'],
      sample: [], moods: ['mystery'] },
    { id: 'enchanted-worlds', no: '04', name: 'The Enchanted Worlds', tone: 'mauve', titles: 100, price: null,
      summary: '100 curated fantasy titles',
      includes: ['Epic fantasy', 'Fairy tale retellings', 'Urban fantasy', 'Magical adventures', 'Dark academia fantasy'],
      sample: [], moods: ['magic'] },
    { id: 'coming-of-age', no: '05', name: 'The Coming-of-Age Shelf', tone: 'wine', titles: 100, price: null,
      summary: '100 curated coming-of-age titles',
      includes: ['Young adult', 'Friendship stories', 'Family and identity', 'Contemporary reads', 'Heart-healing reads'],
      sample: [], moods: ['grow'] }
  ];

  DC.KEYWORDS = {
    'literary-icons': 'literary classics classic memoir essays book club award winning modern fiction',
    'romance': 'romance love romantic booktok sports historical contemporary swoon',
    'mystery': 'mystery mysteries crime thriller detective cozy whodunit suspense psychological',
    'enchanted-worlds': 'fantasy magic magical fairy tale retelling urban epic dark academia adventure',
    'coming-of-age': 'young adult ya coming of age friendship family identity healing teen contemporary'
  };
  DC.SEARCH_CHIPS = ['love', 'fantasy', 'mystery', 'classics', 'young adult'];

  DC.MOODS = [
    { id: 'love',     label: 'Swoony love stories' },
    { id: 'mystery',  label: 'Twisty mysteries' },
    { id: 'magic',    label: 'Magic and fantasy' },
    { id: 'grow',     label: 'Growing up and healing' },
    { id: 'literary', label: 'Classics and literary fiction' }
  ];

  DC.CollectionService = {
    list() { return DC.COLLECTIONS.slice(); },
    byId(id) { return DC.COLLECTIONS.find(c => c.id === id) || null; },
    byMood(mood) { return DC.COLLECTIONS.find(c => c.moods.indexOf(mood) !== -1) || null; },
    price(c) { return c.price != null ? c.price : DC.CONFIG.defaultPrice; },
    nameParts(c) { const m = c.name.match(/^The\s+(.*)$/); return m ? { lead: 'The', rest: m[1] } : { lead: '', rest: c.name }; }
  };

  DC.HOW_TO_ORDER = [
    { t: 'Browse the catalog', d: 'Look through the five collections and see what is inside.' },
    { t: 'Click Order Now', d: 'The button opens our order form or Messenger.' },
    { t: 'Submit your order', d: 'Give your name, email and chosen collection.' },
    { t: 'Send payment', d: 'We reply with our GCash or LandBank details.' },
    { t: 'We verify payment', d: 'We confirm it before sending anything.' },
    { t: 'Receive your files', d: 'We send your Google Drive link by email or Messenger.' }
  ];

  /* Placeholder wording – edit freely. (Shown with a "Draft" tag while CONFIG.draftNotes is true.) */
  DC.FAQ = [
    { q: 'How do I order?', a: 'Choose a collection, tap Order Now and send us your name, email and the collection you want. We reply with our GCash or LandBank details.' },
    { q: 'Which payment methods do you accept?', a: 'GCash and LandBank. We will send you the account details after you submit your order.' },
    { q: 'When do I get my files?', a: 'Once we have confirmed your payment, we personally send your Google Drive download link by email or Facebook Messenger.' },
    { q: 'Can I see the full list of titles first?', a: 'Yes. Message us and we will send you every title in the collection before you order.' },
    { q: 'Can I order more than one collection?', a: 'Of course. Tick as many collections as you like on the order form and the total is added up for you.' },
    { q: 'Do I need an account?', a: 'No account needed. We only ask for your name, email and how you would like your files delivered.' },
    { q: 'What happens to my details?', a: 'Your details are used only to process and deliver your order.' }
  ];

  DC.TERMS = [
    { id: 'orders', label: 'Orders & payment', items: [
      'An order is complete once you have submitted the order form or messaged us your chosen collection.',
      'We reply with GCash or LandBank payment details. Please pay the exact total shown for your order.',
      'We confirm your payment before sending any files.'] },
    { id: 'delivery', label: 'Delivery', items: [
      'Files are delivered as a Google Drive link, sent by email or Facebook Messenger – whichever you choose when ordering.',
      'Please provide an email address or Messenger name that you check regularly.',
      'Delivery happens after payment is verified, so timing depends on when your payment is confirmed.'] },
    { id: 'refunds', label: 'Refunds', items: [
      'Because collections are digital files delivered by link, refunds are handled case by case.',
      'If a link does not work or a file will not open, message us and we will fix it.'] },
    { id: 'privacy', label: 'Privacy', items: [
      'Your details are used only to process and deliver your order.',
      'We do not sell your information.'] }
  ];
})();
