// Default settings, categories and seed services for a fresh install.
// Everything here can be changed later from the admin panel.

export const DEFAULT_SETTINGS = {
  brandA: 'WizeFF',
  brandB: 'TopUp',
  seoTitle: 'WizeFF TopUp',
  seoDesc: 'Fast, safe and reliable game top-up, social media and mobile recharge service.',
  logo: '', // '/img/<id>' uploaded from admin
  themeColor: '#0f766e',
  tagline: { bn: 'দ্রুত • নিরাপদ • বিশ্বস্ত', en: 'Fast • Safe • Reliable' },
  currency: '৳',
  referralBonus: 10, // credited to referrer when a referred user's first deposit is approved
  minDeposit: 20,
  depositMethods: [
    { id: 'bkash', label: 'bKash', number: '', type: 'Personal', color: '#e2136e' },
    { id: 'nagad', label: 'Nagad', number: '', type: 'Personal', color: '#ec1c24' },
  ],
  whatsapp: '',
};

export const DEFAULT_CATS = [
  { id: 'topup', name: { bn: 'গেম টপ-আপ', en: 'Game Top-Up' }, order: 0 },
  { id: 'smm', name: { bn: 'সোশ্যাল মিডিয়া', en: 'Social Media' }, order: 1 },
  { id: 'recharge', name: { bn: 'মোবাইল রিচার্জ', en: 'Mobile Recharge' }, order: 2 },
];

// Field types the form builder supports: text, number, phone, date, select, textarea
export const DEFAULT_SERVICES = [
  {
    id: 'ff-diamond',
    cat: 'topup',
    icon: 'diamond',
    color: '#2f9e6e',
    active: true,
    featured: true,
    order: 0,
    name: { bn: 'ফ্রি ফায়ার ডায়মন্ড', en: 'Free Fire Diamond' },
    sub: { bn: 'প্লেয়ার আইডি দিয়ে ডায়মন্ড টপ-আপ', en: 'Diamond top-up by Player ID' },
    note: { bn: 'সঠিক প্লেয়ার আইডি দিন। ভুল আইডির দায় কোম্পানি নেবে না।', en: 'Enter the correct Player ID. Wrong ID is not our responsibility.' },
    price: 0, // 0 = price comes from the chosen package option
    fields: [
      { key: 'player_id', type: 'number', required: true, label: { bn: 'প্লেয়ার আইডি', en: 'Player ID' }, ph: 'XXXXXXXXX' },
      { key: 'package', type: 'select', required: true, label: { bn: 'প্যাকেজ', en: 'Package' },
        options: [
          { label: '25 💎', price: 22 }, { label: '50 💎', price: 40 }, { label: '115 💎', price: 85 },
          { label: '240 💎', price: 170 }, { label: '610 💎', price: 420 }, { label: '1240 💎', price: 820 },
        ] },
    ],
  },
  {
    id: 'ff-membership',
    cat: 'topup',
    icon: 'crown',
    color: '#e0a92f',
    active: true,
    featured: true,
    order: 1,
    name: { bn: 'ফ্রি ফায়ার মেম্বারশিপ', en: 'Free Fire Membership' },
    sub: { bn: 'উইকলি ও মান্থলি মেম্বারশিপ', en: 'Weekly & monthly membership' },
    note: { bn: '', en: '' },
    price: 0,
    fields: [
      { key: 'player_id', type: 'number', required: true, label: { bn: 'প্লেয়ার আইডি', en: 'Player ID' }, ph: 'XXXXXXXXX' },
      { key: 'package', type: 'select', required: true, label: { bn: 'মেম্বারশিপ', en: 'Membership' },
        options: [
          { label: 'Weekly x1', price: 160 }, { label: 'Monthly x1', price: 790 },
          { label: 'Weekly Lite', price: 40 },
        ] },
    ],
  },
  {
    id: 'fb-likes',
    cat: 'smm',
    icon: 'thumb',
    color: '#2b6fe0',
    active: true,
    featured: true,
    order: 2,
    name: { bn: 'ফেসবুক লাইক', en: 'Facebook Likes' },
    sub: { bn: 'পোস্ট/প্রোফাইল লাইক', en: 'Post / profile likes' },
    note: { bn: 'পোস্ট পাবলিক রাখুন।', en: 'Keep the post public.' },
    price: 0,
    fields: [
      { key: 'link', type: 'text', required: true, label: { bn: 'পোস্ট লিংক', en: 'Post link' }, ph: 'https://...' },
      { key: 'quantity', type: 'select', required: true, label: { bn: 'পরিমাণ', en: 'Quantity' },
        options: [ { label: '500', price: 60 }, { label: '1K', price: 110 }, { label: '2K', price: 200 }, { label: '5K', price: 450 } ] },
    ],
  },
  {
    id: 'recharge',
    cat: 'recharge',
    icon: 'phone',
    color: '#8b5cf6',
    active: true,
    featured: false,
    order: 3,
    name: { bn: 'মোবাইল রিচার্জ', en: 'Mobile Recharge' },
    sub: { bn: 'সকল অপারেটর ফ্লেক্সিলোড', en: 'All operators flexiload' },
    note: { bn: '', en: '' },
    price: 0,
    fields: [
      { key: 'operator', type: 'select', required: true, label: { bn: 'অপারেটর', en: 'Operator' },
        options: [ { label: 'GP' }, { label: 'Robi' }, { label: 'Airtel' }, { label: 'Banglalink' }, { label: 'Teletalk' } ] },
      { key: 'number', type: 'phone', required: true, label: { bn: 'মোবাইল নম্বর', en: 'Mobile number' }, ph: '01XXXXXXXXX' },
      { key: 'amount', type: 'number', required: true, label: { bn: 'এমাউন্ট (৳)', en: 'Amount (৳)' }, ph: '20 - 1000', min: 20, max: 1000, priceFromValue: true },
    ],
  },
];

export const DEFAULT_NOTICES = [
  { id: 'n1', type: 'info', ts: Date.now(),
    title: { bn: 'স্বাগতম', en: 'Welcome' },
    body: { bn: 'অর্ডার করার আগে ওয়ালেটে ব্যালেন্স যোগ করুন। যেকোনো সমস্যায় সাপোর্টে যোগাযোগ করুন।',
      en: 'Add balance to your wallet before ordering. Contact support for any problem.' } },
  { id: 'n2', type: 'urgent', ts: Date.now(),
    title: { bn: 'ডেলিভারি সময়', en: 'Delivery time' },
    body: { bn: 'টপ-আপ: তাৎক্ষণিক – ৩০ মিনিট। এসএমএম: ১-৬ ঘণ্টা।', en: 'Top-up: instant – 30 min. SMM: 1-6 hours.' } },
];
