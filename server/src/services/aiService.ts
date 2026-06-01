import { AISuggestionResponse } from './aiTypes';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse: (buf: Buffer) => Promise<{ text: string }> = require('pdf-parse');

export { AISuggestionResponse };
export type { SuggestedItem } from './aiTypes';

// ---------------------------------------------------------------------------
// Industry → ClientType → Template
// ---------------------------------------------------------------------------
type IndustryTemplates = Record<string, AISuggestionResponse>;

const ALL_TEMPLATES: Record<string, IndustryTemplates> = {

  cleaning: {
    residential: {
      items: [
        { description: 'Standard Home Cleaning (2–3 bed)', quantity: 1, unit: 'session', unit_price: 180, amount: 180 },
        { description: 'Kitchen Deep Clean', quantity: 1, unit: 'session', unit_price: 65, amount: 65 },
        { description: 'Bathroom Sanitization & Scrub', quantity: 2, unit: 'room', unit_price: 35, amount: 70 },
        { description: 'Interior Window Cleaning', quantity: 8, unit: 'window', unit_price: 8, amount: 64 },
      ],
      notes: 'Thank you for choosing us! We strive to leave your home spotless every visit.',
      terms: 'Payment due within 14 days. 24-hour cancellation notice required.',
    },
    commercial: {
      items: [
        { description: 'Commercial Floor Cleaning & Mopping', quantity: 2500, unit: 'sqft', unit_price: 0.12, amount: 300 },
        { description: 'Restroom Sanitization Service', quantity: 4, unit: 'unit', unit_price: 45, amount: 180 },
        { description: 'Reception & Common Area Clean', quantity: 1, unit: 'session', unit_price: 120, amount: 120 },
        { description: 'Trash Removal & Bin Liners', quantity: 1, unit: 'visit', unit_price: 40, amount: 40 },
        { description: 'High-touch Surface Disinfection', quantity: 1, unit: 'session', unit_price: 60, amount: 60 },
      ],
      notes: 'Professional commercial cleaning to keep your workspace safe and presentable.',
      terms: 'Net 30. Regular service discounts available for weekly contracts.',
    },
    office: {
      items: [
        { description: 'Office Desk & Workstation Wipe-down', quantity: 20, unit: 'unit', unit_price: 8, amount: 160 },
        { description: 'Breakroom & Kitchen Cleaning', quantity: 1, unit: 'session', unit_price: 75, amount: 75 },
        { description: 'Carpet Vacuuming & Spot Treatment', quantity: 1, unit: 'session', unit_price: 90, amount: 90 },
        { description: 'Glass Partition & Door Cleaning', quantity: 1, unit: 'session', unit_price: 55, amount: 55 },
        { description: 'Waste Collection & Recycling Sort', quantity: 1, unit: 'visit', unit_price: 30, amount: 30 },
      ],
      notes: 'We work around your office hours to minimize disruption to your team.',
      terms: 'Payment due upon receipt. Recurring billing available monthly.',
    },
    'post-construction': {
      items: [
        { description: 'Post-Construction Dust Removal', quantity: 1, unit: 'session', unit_price: 320, amount: 320 },
        { description: 'Paint Splatter & Adhesive Removal', quantity: 1, unit: 'session', unit_price: 150, amount: 150 },
        { description: 'Window & Frame Detail Clean', quantity: 12, unit: 'window', unit_price: 15, amount: 180 },
        { description: 'Floor Scrub & Polish (Hard Floors)', quantity: 800, unit: 'sqft', unit_price: 0.25, amount: 200 },
        { description: 'Debris Removal & Haul Away', quantity: 1, unit: 'session', unit_price: 120, amount: 120 },
      ],
      notes: 'Specialized post-construction cleanup to make your new space move-in ready.',
      terms: '50% deposit required. Balance due upon job completion.',
    },
    'move-out': {
      items: [
        { description: 'Full Property Move-Out Clean', quantity: 1, unit: 'session', unit_price: 280, amount: 280 },
        { description: 'Oven & Appliance Interior Clean', quantity: 3, unit: 'unit', unit_price: 45, amount: 135 },
        { description: 'Carpet Steam Cleaning', quantity: 3, unit: 'room', unit_price: 60, amount: 180 },
        { description: 'Wall Scuff & Mark Removal', quantity: 1, unit: 'session', unit_price: 80, amount: 80 },
        { description: 'Final Inspection Touch-up', quantity: 1, unit: 'session', unit_price: 50, amount: 50 },
      ],
      notes: 'Move-out cleaning guaranteed to meet landlord/property manager standards.',
      terms: 'Full payment required before service. Satisfaction guaranteed or we re-clean free.',
    },
  },

  plumbing: {
    emergency: {
      items: [
        { description: 'Emergency Callout Fee', quantity: 1, unit: 'session', unit_price: 120, amount: 120 },
        { description: 'Labour – Emergency Rate', quantity: 2, unit: 'hour', unit_price: 130, amount: 260 },
        { description: 'Drain Unblocking (Hydro-jet)', quantity: 1, unit: 'session', unit_price: 180, amount: 180 },
        { description: 'Parts & Materials', quantity: 1, unit: 'unit', unit_price: 60, amount: 60 },
      ],
      notes: 'Emergency response completed. All work carried out to industry standards.',
      terms: 'Payment due upon job completion. Emergency rates apply outside standard hours.',
    },
    installation: {
      items: [
        { description: 'Bathroom Fixture Installation', quantity: 2, unit: 'unit', unit_price: 220, amount: 440 },
        { description: 'Labour – Installation', quantity: 4, unit: 'hour', unit_price: 95, amount: 380 },
        { description: 'Pipework & Fittings (Materials)', quantity: 1, unit: 'unit', unit_price: 150, amount: 150 },
        { description: 'Waste & Supply Connection', quantity: 1, unit: 'session', unit_price: 80, amount: 80 },
      ],
      notes: 'All installations tested and certified. Manufacturer warranties apply.',
      terms: '50% deposit on booking. Balance due on completion. Net 7.',
    },
    maintenance: {
      items: [
        { description: 'Annual Boiler Service & Safety Check', quantity: 1, unit: 'session', unit_price: 150, amount: 150 },
        { description: 'Pressure Test & System Flush', quantity: 1, unit: 'session', unit_price: 90, amount: 90 },
        { description: 'Radiator Bleed & Balance', quantity: 6, unit: 'unit', unit_price: 15, amount: 90 },
        { description: 'Filter Replacement', quantity: 2, unit: 'unit', unit_price: 35, amount: 70 },
      ],
      notes: 'Routine maintenance completed. Next service recommended in 12 months.',
      terms: 'Payment due within 14 days. Annual maintenance contracts available.',
    },
    commercial: {
      items: [
        { description: 'Commercial Plumbing Inspection', quantity: 1, unit: 'session', unit_price: 200, amount: 200 },
        { description: 'Labour – Commercial Rate', quantity: 6, unit: 'hour', unit_price: 110, amount: 660 },
        { description: 'Grease Trap Service', quantity: 1, unit: 'session', unit_price: 250, amount: 250 },
        { description: 'Backflow Prevention Test', quantity: 1, unit: 'unit', unit_price: 120, amount: 120 },
        { description: 'Parts & Fittings', quantity: 1, unit: 'unit', unit_price: 180, amount: 180 },
      ],
      notes: 'Commercial plumbing services completed to regulatory standards.',
      terms: 'Net 30. Compliance certificates issued upon full payment.',
    },
  },

  electrical: {
    residential: {
      items: [
        { description: 'Callout & Diagnostic Fee', quantity: 1, unit: 'session', unit_price: 100, amount: 100 },
        { description: 'Labour – Standard Rate', quantity: 3, unit: 'hour', unit_price: 90, amount: 270 },
        { description: 'Socket / Light Fitting Installation', quantity: 4, unit: 'unit', unit_price: 70, amount: 280 },
        { description: 'Electrical Safety Certificate (EICR)', quantity: 1, unit: 'unit', unit_price: 180, amount: 180 },
      ],
      notes: 'All electrical work completed to current wiring regulations.',
      terms: 'Payment due within 14 days. Certificates issued upon full payment.',
    },
    commercial: {
      items: [
        { description: 'Commercial Site Survey', quantity: 1, unit: 'session', unit_price: 250, amount: 250 },
        { description: 'Labour – Commercial Rate', quantity: 8, unit: 'hour', unit_price: 110, amount: 880 },
        { description: 'Consumer Unit / Panel Upgrade', quantity: 1, unit: 'unit', unit_price: 1200, amount: 1200 },
        { description: 'Cable & Containment (Materials)', quantity: 1, unit: 'unit', unit_price: 350, amount: 350 },
        { description: 'Testing & Commissioning', quantity: 1, unit: 'session', unit_price: 200, amount: 200 },
      ],
      notes: 'Commercial installation compliant with local electrical codes.',
      terms: 'Net 30. 30% deposit required prior to work commencing.',
    },
    installation: {
      items: [
        { description: 'EV Charger Installation', quantity: 1, unit: 'unit', unit_price: 800, amount: 800 },
        { description: 'Labour – Installation', quantity: 4, unit: 'hour', unit_price: 90, amount: 360 },
        { description: 'Smart Lighting System Setup', quantity: 1, unit: 'session', unit_price: 400, amount: 400 },
        { description: 'Cable & Accessories (Materials)', quantity: 1, unit: 'unit', unit_price: 200, amount: 200 },
      ],
      notes: 'Installation completed and tested. User guide provided.',
      terms: 'Full payment due upon completion. 12-month workmanship warranty.',
    },
    repair: {
      items: [
        { description: 'Fault Finding & Diagnosis', quantity: 1, unit: 'session', unit_price: 110, amount: 110 },
        { description: 'Labour – Repair', quantity: 2, unit: 'hour', unit_price: 90, amount: 180 },
        { description: 'Replacement Parts', quantity: 1, unit: 'unit', unit_price: 85, amount: 85 },
        { description: 'Safe Isolation & Re-energisation', quantity: 1, unit: 'session', unit_price: 50, amount: 50 },
      ],
      notes: 'Fault identified and repaired. System tested safe before handover.',
      terms: 'Payment due upon completion. 6-month guarantee on repair work.',
    },
  },

  landscaping: {
    residential: {
      items: [
        { description: 'Lawn Mowing & Edge Trimming', quantity: 1, unit: 'visit', unit_price: 65, amount: 65 },
        { description: 'Hedge Trimming & Shaping', quantity: 1, unit: 'session', unit_price: 90, amount: 90 },
        { description: 'Weed Control & Bed Maintenance', quantity: 1, unit: 'session', unit_price: 70, amount: 70 },
        { description: 'Debris Clearance & Green Waste Removal', quantity: 1, unit: 'visit', unit_price: 55, amount: 55 },
      ],
      notes: 'Garden maintained to the highest standard. See you next visit!',
      terms: 'Payment due within 7 days. Recurring service discounts available.',
    },
    commercial: {
      items: [
        { description: 'Commercial Grounds Maintenance', quantity: 1, unit: 'visit', unit_price: 250, amount: 250 },
        { description: 'Lawn Treatment & Fertilisation', quantity: 5000, unit: 'sqft', unit_price: 0.08, amount: 400 },
        { description: 'Shrub & Hedge Maintenance', quantity: 1, unit: 'session', unit_price: 180, amount: 180 },
        { description: 'Litter & Debris Clearance', quantity: 1, unit: 'visit', unit_price: 80, amount: 80 },
        { description: 'Seasonal Planting & Bedding', quantity: 1, unit: 'session', unit_price: 300, amount: 300 },
      ],
      notes: 'Commercial grounds maintained to agreed specification.',
      terms: 'Net 30. Monthly contract invoicing available.',
    },
    'landscape-design': {
      items: [
        { description: 'Garden Design Consultation', quantity: 1, unit: 'session', unit_price: 200, amount: 200 },
        { description: 'Planting & Bedding Installation', quantity: 1, unit: 'session', unit_price: 600, amount: 600 },
        { description: 'Turf Laying (Supply & Lay)', quantity: 80, unit: 'sqft', unit_price: 4.5, amount: 360 },
        { description: 'Paving / Pathway Work', quantity: 1, unit: 'session', unit_price: 800, amount: 800 },
        { description: 'Tree Planting & Staking', quantity: 3, unit: 'unit', unit_price: 120, amount: 360 },
      ],
      notes: 'Full landscape installation as per agreed design brief.',
      terms: '50% deposit on booking. Balance due on project completion.',
    },
    maintenance: {
      items: [
        { description: 'Seasonal Garden Clear-up', quantity: 1, unit: 'session', unit_price: 250, amount: 250 },
        { description: 'Tree Pruning & Crown Reduction', quantity: 2, unit: 'unit', unit_price: 180, amount: 360 },
        { description: 'Stump Grinding', quantity: 1, unit: 'unit', unit_price: 200, amount: 200 },
        { description: 'Mulching (Supply & Apply)', quantity: 1, unit: 'session', unit_price: 120, amount: 120 },
      ],
      notes: 'Seasonal maintenance completed. Garden ready for the coming season.',
      terms: 'Payment due within 14 days.',
    },
  },

  'personal-training': {
    'one-on-one': {
      items: [
        { description: 'Personal Training Session (60 min)', quantity: 4, unit: 'session', unit_price: 75, amount: 300 },
        { description: 'Initial Fitness Assessment', quantity: 1, unit: 'session', unit_price: 80, amount: 80 },
        { description: 'Personalised Training Programme', quantity: 1, unit: 'unit', unit_price: 60, amount: 60 },
      ],
      notes: 'Great work this month! Keep pushing towards your goals.',
      terms: 'Payment due before sessions begin. 24-hour cancellation policy applies.',
    },
    'group-training': {
      items: [
        { description: 'Group Training Session (per person)', quantity: 8, unit: 'session', unit_price: 25, amount: 200 },
        { description: 'Programme Design (Group Plan)', quantity: 1, unit: 'unit', unit_price: 80, amount: 80 },
        { description: 'Nutritional Guidance Handout', quantity: 1, unit: 'unit', unit_price: 30, amount: 30 },
      ],
      notes: 'Group sessions are high-energy and results-driven. See you next week!',
      terms: 'Block booking required. No refunds after sessions commence.',
    },
    online: {
      items: [
        { description: 'Monthly Online Coaching Subscription', quantity: 1, unit: 'month', unit_price: 150, amount: 150 },
        { description: 'Custom Training Plan (4-week)', quantity: 1, unit: 'unit', unit_price: 80, amount: 80 },
        { description: 'Weekly Check-in & Programme Update', quantity: 4, unit: 'session', unit_price: 20, amount: 80 },
      ],
      notes: 'All plans delivered via app. Support available Mon–Fri.',
      terms: 'Monthly subscription billed in advance. Cancel anytime with 7 days notice.',
    },
    nutrition: {
      items: [
        { description: 'Nutrition Consultation (90 min)', quantity: 1, unit: 'session', unit_price: 120, amount: 120 },
        { description: 'Custom Meal Plan (4-week)', quantity: 1, unit: 'unit', unit_price: 90, amount: 90 },
        { description: 'Monthly Nutrition Coaching', quantity: 1, unit: 'month', unit_price: 100, amount: 100 },
      ],
      notes: 'Nutrition plan tailored to your goals and lifestyle.',
      terms: 'Payment due upon delivery of plan. 14-day money-back guarantee.',
    },
  },

  tutoring: {
    academic: {
      items: [
        { description: '1:1 Tutoring Session (60 min)', quantity: 4, unit: 'session', unit_price: 60, amount: 240 },
        { description: 'Initial Assessment & Baseline Test', quantity: 1, unit: 'session', unit_price: 50, amount: 50 },
        { description: 'Study Materials & Worksheets', quantity: 1, unit: 'unit', unit_price: 20, amount: 20 },
      ],
      notes: 'Excellent progress this month! Focused on key exam topics.',
      terms: 'Monthly invoicing. 48-hour cancellation notice required.',
    },
    'exam-prep': {
      items: [
        { description: 'Exam Preparation Session (90 min)', quantity: 6, unit: 'session', unit_price: 80, amount: 480 },
        { description: 'Mock Exam & Marking', quantity: 2, unit: 'unit', unit_price: 60, amount: 120 },
        { description: 'Revision Pack & Past Papers', quantity: 1, unit: 'unit', unit_price: 35, amount: 35 },
      ],
      notes: 'Intensive exam preparation. Practice papers provided for home study.',
      terms: 'Block booking billed in advance. No refunds after programme starts.',
    },
    'music-arts': {
      items: [
        { description: 'Music Lesson (45 min)', quantity: 4, unit: 'session', unit_price: 50, amount: 200 },
        { description: 'Theory & Sight-reading Practice', quantity: 2, unit: 'session', unit_price: 40, amount: 80 },
        { description: 'Sheet Music / Course Materials', quantity: 1, unit: 'unit', unit_price: 25, amount: 25 },
      ],
      notes: 'Great progress on technique and repertoire this month!',
      terms: 'Monthly billing in advance. Lessons missed with less than 24hr notice are charged.',
    },
    languages: {
      items: [
        { description: 'Language Lesson (60 min)', quantity: 4, unit: 'session', unit_price: 55, amount: 220 },
        { description: 'Conversation Practice Session', quantity: 2, unit: 'session', unit_price: 45, amount: 90 },
        { description: 'Learning Materials & Flashcard Pack', quantity: 1, unit: 'unit', unit_price: 20, amount: 20 },
      ],
      notes: 'Language learning is a journey — you are making great strides!',
      terms: 'Payment due monthly in advance.',
    },
  },

  'it-support': {
    residential: {
      items: [
        { description: 'Home Tech Support (Remote)', quantity: 1, unit: 'hour', unit_price: 70, amount: 70 },
        { description: 'Virus Removal & Security Clean-up', quantity: 1, unit: 'session', unit_price: 120, amount: 120 },
        { description: 'Software Setup & Configuration', quantity: 1, unit: 'session', unit_price: 80, amount: 80 },
        { description: 'Data Backup & Transfer', quantity: 1, unit: 'session', unit_price: 90, amount: 90 },
      ],
      notes: 'All issues resolved. System running smoothly. Contact us if anything comes up.',
      terms: 'Payment due upon completion.',
    },
    'small-business': {
      items: [
        { description: 'On-site IT Support (per hour)', quantity: 3, unit: 'hour', unit_price: 110, amount: 330 },
        { description: 'Network Setup & Configuration', quantity: 1, unit: 'session', unit_price: 300, amount: 300 },
        { description: 'Cloud Migration / Data Transfer', quantity: 1, unit: 'session', unit_price: 250, amount: 250 },
        { description: 'User Account Setup & Training', quantity: 5, unit: 'unit', unit_price: 40, amount: 200 },
      ],
      notes: 'Your systems are now configured and optimised for your team.',
      terms: 'Net 14. Monthly support retainer packages available.',
    },
    maintenance: {
      items: [
        { description: 'Monthly Managed IT Support', quantity: 1, unit: 'month', unit_price: 400, amount: 400 },
        { description: 'Security Updates & Patch Management', quantity: 1, unit: 'month', unit_price: 100, amount: 100 },
        { description: 'Backup Monitoring & Verification', quantity: 1, unit: 'month', unit_price: 80, amount: 80 },
      ],
      notes: 'Monthly managed services as per your support agreement.',
      terms: 'Billed monthly in advance. 30-day cancellation notice required.',
    },
    project: {
      items: [
        { description: 'IT Project Consultation', quantity: 2, unit: 'hour', unit_price: 130, amount: 260 },
        { description: 'Server / Infrastructure Setup', quantity: 1, unit: 'session', unit_price: 600, amount: 600 },
        { description: 'System Migration & Testing', quantity: 1, unit: 'session', unit_price: 400, amount: 400 },
        { description: 'Documentation & Handover Training', quantity: 1, unit: 'session', unit_price: 150, amount: 150 },
      ],
      notes: 'Project completed to specification. Documentation provided.',
      terms: '50% deposit required. Balance due on project delivery. Net 14.',
    },
  },

  photography: {
    wedding: {
      items: [
        { description: 'Full-day Wedding Photography Coverage', quantity: 1, unit: 'day', unit_price: 1500, amount: 1500 },
        { description: 'Second Shooter', quantity: 1, unit: 'day', unit_price: 400, amount: 400 },
        { description: 'Edited Photo Gallery (online delivery)', quantity: 1, unit: 'unit', unit_price: 200, amount: 200 },
        { description: 'Premium Wedding Album (30 pages)', quantity: 1, unit: 'unit', unit_price: 450, amount: 450 },
      ],
      notes: 'Thank you for trusting us to capture your special day.',
      terms: '50% deposit on booking. Balance due 14 days before event. No refunds on deposits.',
    },
    portrait: {
      items: [
        { description: 'Portrait Session (90 min)', quantity: 1, unit: 'session', unit_price: 200, amount: 200 },
        { description: 'Photo Editing & Retouching (10 images)', quantity: 10, unit: 'unit', unit_price: 15, amount: 150 },
        { description: 'Digital Download Package', quantity: 1, unit: 'unit', unit_price: 80, amount: 80 },
      ],
      notes: 'Your images will be ready within 7–10 business days.',
      terms: 'Payment due on the day of session. Downloads released upon full payment.',
    },
    commercial: {
      items: [
        { description: 'Commercial Product / Brand Shoot (half day)', quantity: 1, unit: 'session', unit_price: 700, amount: 700 },
        { description: 'Post-Production & Editing (per image)', quantity: 20, unit: 'unit', unit_price: 25, amount: 500 },
        { description: 'Location / Studio Hire', quantity: 1, unit: 'day', unit_price: 200, amount: 200 },
        { description: 'Usage License (12 months)', quantity: 1, unit: 'unit', unit_price: 300, amount: 300 },
      ],
      notes: 'Images delivered in full resolution via secure gallery link.',
      terms: 'Net 14. Licensing terms as agreed. All rights reserved until full payment received.',
    },
    events: {
      items: [
        { description: 'Event Photography Coverage (4 hrs)', quantity: 1, unit: 'session', unit_price: 600, amount: 600 },
        { description: 'Edited Highlights Gallery (50 images)', quantity: 1, unit: 'unit', unit_price: 150, amount: 150 },
        { description: 'Travel & Mileage', quantity: 40, unit: 'mile', unit_price: 0.65, amount: 26 },
      ],
      notes: 'Gallery will be available within 5 business days.',
      terms: 'Full payment required 7 days before the event.',
    },
  },

  'pet-services': {
    grooming: {
      items: [
        { description: 'Full Groom (Bath, Cut & Blow Dry)', quantity: 1, unit: 'session', unit_price: 70, amount: 70 },
        { description: 'Nail Clipping & Filing', quantity: 1, unit: 'unit', unit_price: 15, amount: 15 },
        { description: 'Ear Cleaning', quantity: 1, unit: 'unit', unit_price: 10, amount: 10 },
        { description: 'De-shedding Treatment', quantity: 1, unit: 'session', unit_price: 25, amount: 25 },
      ],
      notes: 'Your pet was a star today! Looking and smelling great.',
      terms: 'Payment due on collection. Appointment cancellations require 24-hour notice.',
    },
    'dog-walking': {
      items: [
        { description: 'Solo Dog Walk (60 min)', quantity: 5, unit: 'session', unit_price: 18, amount: 90 },
        { description: 'Weekend Solo Walk', quantity: 2, unit: 'session', unit_price: 22, amount: 44 },
        { description: 'GPS Walk Report (weekly)', quantity: 4, unit: 'unit', unit_price: 5, amount: 20 },
      ],
      notes: 'Weekly walk summary attached. Your dog is happy and well-exercised!',
      terms: 'Monthly billing. Payment due by the 1st of each month.',
    },
    boarding: {
      items: [
        { description: 'Overnight Pet Boarding', quantity: 5, unit: 'night', unit_price: 45, amount: 225 },
        { description: 'Daily Activity Update (photos/video)', quantity: 5, unit: 'unit', unit_price: 5, amount: 25 },
        { description: 'Special Diet / Medication Admin', quantity: 5, unit: 'day', unit_price: 8, amount: 40 },
      ],
      notes: 'Your pet had a wonderful stay! All meals, walks and cuddles accounted for.',
      terms: 'Full payment required before boarding commences.',
    },
    'mobile-vet': {
      items: [
        { description: 'Mobile Vet Consultation (home visit)', quantity: 1, unit: 'session', unit_price: 90, amount: 90 },
        { description: 'Vaccination (per injection)', quantity: 2, unit: 'unit', unit_price: 35, amount: 70 },
        { description: 'Flea & Tick Treatment', quantity: 1, unit: 'unit', unit_price: 25, amount: 25 },
        { description: 'Health Certificate', quantity: 1, unit: 'unit', unit_price: 40, amount: 40 },
      ],
      notes: 'Your pet is in great health. Next check-up recommended in 12 months.',
      terms: 'Payment due at time of visit. Prescription items billed separately.',
    },
  },

};

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------
export function getIndustries(): { value: string; label: string }[] {
  return [
    { value: 'cleaning', label: 'Cleaning Services' },
    { value: 'plumbing', label: 'Plumbing' },
    { value: 'electrical', label: 'Electrical' },
    { value: 'landscaping', label: 'Landscaping & Garden' },
    { value: 'personal-training', label: 'Personal Training' },
    { value: 'tutoring', label: 'Tutoring & Coaching' },
    { value: 'it-support', label: 'IT Support' },
    { value: 'photography', label: 'Photography & Video' },
    { value: 'pet-services', label: 'Pet Services' },
  ];
}

export function getClientTypes(industry: string): { value: string; label: string }[] {
  const map: Record<string, { value: string; label: string }[]> = {
    cleaning: [
      { value: 'residential', label: 'Residential' },
      { value: 'commercial', label: 'Commercial' },
      { value: 'office', label: 'Office' },
      { value: 'post-construction', label: 'Post-Construction' },
      { value: 'move-out', label: 'Move-Out' },
    ],
    plumbing: [
      { value: 'emergency', label: 'Emergency Callout' },
      { value: 'installation', label: 'Installation' },
      { value: 'maintenance', label: 'Maintenance' },
      { value: 'commercial', label: 'Commercial' },
    ],
    electrical: [
      { value: 'residential', label: 'Residential' },
      { value: 'commercial', label: 'Commercial' },
      { value: 'installation', label: 'Installation' },
      { value: 'repair', label: 'Repair & Fault Finding' },
    ],
    landscaping: [
      { value: 'residential', label: 'Residential' },
      { value: 'commercial', label: 'Commercial Grounds' },
      { value: 'landscape-design', label: 'Landscape Design' },
      { value: 'maintenance', label: 'Seasonal Maintenance' },
    ],
    'personal-training': [
      { value: 'one-on-one', label: '1-on-1 Training' },
      { value: 'group-training', label: 'Group Training' },
      { value: 'online', label: 'Online Coaching' },
      { value: 'nutrition', label: 'Nutrition Coaching' },
    ],
    tutoring: [
      { value: 'academic', label: 'Academic Tutoring' },
      { value: 'exam-prep', label: 'Exam Preparation' },
      { value: 'music-arts', label: 'Music & Arts' },
      { value: 'languages', label: 'Languages' },
    ],
    'it-support': [
      { value: 'residential', label: 'Home / Residential' },
      { value: 'small-business', label: 'Small Business' },
      { value: 'maintenance', label: 'Managed Services' },
      { value: 'project', label: 'Project Work' },
    ],
    photography: [
      { value: 'wedding', label: 'Wedding' },
      { value: 'portrait', label: 'Portrait / Family' },
      { value: 'commercial', label: 'Commercial / Brand' },
      { value: 'events', label: 'Events' },
    ],
    'pet-services': [
      { value: 'grooming', label: 'Grooming' },
      { value: 'dog-walking', label: 'Dog Walking' },
      { value: 'boarding', label: 'Boarding / Sitting' },
      { value: 'mobile-vet', label: 'Mobile Vet' },
    ],
  };
  return map[industry] ?? map['cleaning'];
}

function getTemplate(industry: string, clientType: string): AISuggestionResponse {
  const industryTemplates = ALL_TEMPLATES[industry] ?? ALL_TEMPLATES['cleaning'];
  const types = Object.keys(industryTemplates);
  return industryTemplates[clientType] ?? industryTemplates[types[0]];
}

function filterOutExisting(template: AISuggestionResponse, existingItems: string[]): AISuggestionResponse {
  if (existingItems.length === 0) return template;
  const lower = existingItems.map(s => s.toLowerCase());
  const filtered = template.items.filter(
    item => !lower.some(e => item.description.toLowerCase().includes(e) || e.includes(item.description.toLowerCase()))
  );
  return { ...template, items: filtered.length > 0 ? filtered : template.items.slice(0, 3) };
}

// ---------------------------------------------------------------------------
// Optional Claude API enhancement
// ---------------------------------------------------------------------------
async function tryClaudeSuggestions(
  industry: string,
  clientType: string,
  existingItems: string[],
  notes: string
): Promise<AISuggestionResponse | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'your_anthropic_api_key_here') return null;

  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const anthropic = new Anthropic({ apiKey });

    const prompt = `You are an expert invoicing assistant for a ${industry} business.
Suggest 4-5 line items for a ${clientType} invoice.
Existing items to avoid duplicating: ${existingItems.join(', ') || 'none'}.
Additional context: ${notes || 'standard service'}.

Return ONLY valid JSON — no markdown, no explanation:
{"items":[{"description":"...","quantity":1,"unit":"session","unit_price":0,"amount":0}],"notes":"...","terms":"..."}`;

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '';
    const parsed = JSON.parse(text) as AISuggestionResponse;
    parsed.items = parsed.items.map(i => ({ ...i, amount: i.quantity * i.unit_price }));
    return parsed;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export async function suggestLineItems(
  industry: string,
  existingItems: string[],
  clientType: string,
  notes: string
): Promise<AISuggestionResponse & { source: 'ai' | 'templates' }> {
  const claude = await tryClaudeSuggestions(industry, clientType, existingItems, notes);
  if (claude) return { ...claude, source: 'ai' };

  const template = filterOutExisting(getTemplate(industry, clientType), existingItems);
  return { ...template, source: 'templates' };
}

// ---------------------------------------------------------------------------
// Local document text extraction (no API needed)
// ---------------------------------------------------------------------------

function toIsoDate(raw: string): string {
  if (!raw) return '';
  raw = raw.trim();
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  // MM/DD/YYYY or DD/MM/YYYY or MM-DD-YYYY
  const slash = raw.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
  if (slash) {
    const [, a, b, c] = slash;
    const year = c.length === 2 ? `20${c}` : c;
    // If first part > 12 it must be DD/MM
    const month = parseInt(a) > 12 ? b.padStart(2, '0') : a.padStart(2, '0');
    const day   = parseInt(a) > 12 ? a.padStart(2, '0') : b.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  // Month name formats: "Jan 15 2024", "15 January 2024", "January 15, 2024"
  const months: Record<string, string> = {
    jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',
    jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12',
  };
  const named = raw.match(/(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})|([A-Za-z]{3,})\s+(\d{1,2}),?\s*(\d{4})/);
  if (named) {
    const [, d1, m1, y1, m2, d2, y2] = named;
    const m = months[(m1 || m2).toLowerCase().slice(0, 3)];
    if (m) return `${y1 || y2}-${m}-${(d1 || d2).padStart(2, '0')}`;
  }
  return '';
}

function parseAmount(s: string): number {
  return parseFloat(s.replace(/[$£€,\s]/g, '')) || 0;
}

function extractText(lines: string[], patterns: RegExp[]): string {
  for (const line of lines) {
    for (const p of patterns) {
      const m = line.match(p);
      if (m) return (m[1] || '').trim();
    }
  }
  return '';
}

function parseInvoiceText(raw: string): Record<string, unknown> {
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
  const full  = lines.join('\n');

  // ── Type ──────────────────────────────────────────────────────────────────
  const type = /\breceipt\b/i.test(full) ? 'receipt' : 'invoice';

  // ── Document number ───────────────────────────────────────────────────────
  const number = extractText(lines, [
    /(?:invoice|receipt|inv|rec|order|no\.?|number|#)\s*[:#]?\s*([A-Z0-9][A-Z0-9\-\/]{1,25})/i,
    /^([A-Z]{2,6}-\d{3,})/i,
  ]);

  // ── Dates ─────────────────────────────────────────────────────────────────
  const issue_date = toIsoDate(extractText(lines, [
    /(?:invoice\s+date|date\s+issued|issued?|date)\s*[:\-]?\s*([\d\/\-\.]+(?:\s+\w+)?(?:\s+\d{4})?)/i,
  ]));
  const due_date = toIsoDate(extractText(lines, [
    /(?:due\s*date|payment\s*due|pay\s*by|due\s*by|due)\s*[:\-]?\s*([\d\/\-\.]+(?:\s+\w+)?(?:\s+\d{4})?)/i,
  ]));
  const paid_date = toIsoDate(extractText(lines, [
    /(?:paid|payment\s*date|date\s*paid)\s*[:\-]?\s*([\d\/\-\.]+(?:\s+\w+)?(?:\s+\d{4})?)/i,
  ]));

  // ── Client info ───────────────────────────────────────────────────────────
  let client_name = '', client_company = '', client_address = '', client_city = '', client_state = '', client_zip = '';

  // Look for a "Bill To" block
  const billTo = full.match(/(?:bill(?:ed)?\s+to|sold\s+to|client|customer|to)\s*[:\n]\s*([\s\S]{0,300}?)(?=\n{2,}|from\s*:|invoice\s+#|date\s*:|total|subtotal|$)/i);
  if (billTo) {
    const bLines = billTo[1].split('\n').map(l => l.trim()).filter(Boolean);
    if (bLines[0]) client_name    = bLines[0];
    if (bLines[1]) client_company = bLines[1];
    if (bLines[2]) client_address = bLines[2];
    if (bLines[3]) {
      const cityLine = bLines[3];
      const zipMatch = cityLine.match(/,?\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)\s*$/);
      if (zipMatch) {
        client_state = zipMatch[1];
        client_zip   = zipMatch[2];
        client_city  = cityLine.replace(zipMatch[0], '').trim().replace(/,$/, '');
      } else {
        client_city = cityLine;
      }
    }
  }

  // ── Contact details ───────────────────────────────────────────────────────
  const client_email = (full.match(/[\w.+\-]+@[\w\-]+\.[a-z]{2,}/i) || [])[0] || '';
  const client_phone = (full.match(/(?:\+?\d{1,3}[\s\-]?)?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4}/) || [])[0] || '';

  // ── Line items ────────────────────────────────────────────────────────────
  const skipLine = /^(subtotal|sub-total|total|tax|vat|gst|hst|discount|balance|amount\s*due|payment|paid|thank\s+you|notes?|terms?)/i;
  const items: Array<{description:string; quantity:number; unit:string; unit_price:number; amount:number}> = [];

  for (const line of lines) {
    if (skipLine.test(line)) continue;

    // Pattern: description  qty  unitPrice  amount  (4 columns)
    const m4 = line.match(/^(.{4,55}?)\s{2,}(\d+(?:\.\d+)?)\s{1,}[\$£€]?([\d,]+(?:\.\d{2})?)\s{1,}[\$£€]?([\d,]+(?:\.\d{2})?)$/);
    if (m4 && !skipLine.test(m4[1])) {
      items.push({ description: m4[1].trim(), quantity: parseFloat(m4[2]), unit: 'unit', unit_price: parseAmount(m4[3]), amount: parseAmount(m4[4]) });
      continue;
    }

    // Pattern: description  amount  (2 columns — common in simple receipts)
    const m2 = line.match(/^(.{4,60}?)\s{2,}[\$£€]?([\d,]+\.\d{2})$/);
    if (m2 && !skipLine.test(m2[1])) {
      const amt = parseAmount(m2[2]);
      items.push({ description: m2[1].trim(), quantity: 1, unit: 'unit', unit_price: amt, amount: amt });
    }
  }

  // ── Tax rate ──────────────────────────────────────────────────────────────
  let tax_rate = 0;
  const taxRateMatch = full.match(/tax\s*[\(\[]?([\d.]+)\s*%/i);
  if (taxRateMatch) tax_rate = parseFloat(taxRateMatch[1]);

  // ── Notes & Terms ─────────────────────────────────────────────────────────
  const notes = extractText(lines, [/^notes?\s*[:\-]\s*(.+)/i]);
  const terms = extractText(lines, [/^(?:payment\s+)?terms?\s*[:\-]\s*(.+)/i]);

  return {
    type, number,
    issue_date, due_date, paid_date,
    client_name, client_email, client_phone,
    client_address, client_city, client_state, client_zip,
    client_company,
    items,
    tax_rate, discount_type: 'none', discount_value: 0, amount_paid: 0,
    notes, terms, footer_text: '',
  };
}

const PARSE_PROMPT = `You are an expert at reading invoices and receipts. Extract every piece of information visible.

Return ONLY valid JSON — no markdown fences, no explanation:
{
  "type": "invoice" or "receipt",
  "number": "document number or empty string",
  "issue_date": "YYYY-MM-DD or empty string",
  "due_date": "YYYY-MM-DD or empty string",
  "paid_date": "YYYY-MM-DD or empty string",
  "client_name": "bill-to person name or empty string",
  "client_email": "email or empty string",
  "client_phone": "phone or empty string",
  "client_address": "street address or empty string",
  "client_city": "city or empty string",
  "client_state": "state/province or empty string",
  "client_zip": "postal code or empty string",
  "client_company": "company name if different from client_name or empty string",
  "items": [{ "description": "...", "quantity": 1, "unit": "hour/session/item/unit", "unit_price": 0.00, "amount": 0.00 }],
  "tax_rate": 0,
  "discount_type": "none",
  "discount_value": 0,
  "amount_paid": 0,
  "notes": "notes or empty string",
  "terms": "payment terms or empty string",
  "footer_text": "footer text or empty string",
  "brand_primary_color": "#hexcolor of the main brand color used in headings/borders/lines, or empty string",
  "brand_secondary_color": "#hexcolor slightly darker variant of the brand color, or empty string",
  "brand_accent_color": "#hexcolor light tint/background color used as a section fill, or empty string"
}
Rules: extract ALL line items; dates as YYYY-MM-DD; if document says paid/receipt set type to receipt; empty string for anything unreadable; brand colors must be valid 6-digit hex (#rrggbb) or empty string.`;

const COLOR_PROMPT = `Look at this document image. Identify the brand colors used in headings, borders, table headers, or decorative elements.
Return ONLY valid JSON — no markdown, no explanation:
{"primary":"#hexcolor","secondary":"#hexcolor","accent":"#hexcolor"}
- primary: the dominant brand/accent color (headers, lines, borders)
- secondary: a slightly darker or complementary shade
- accent: a light tint used as section backgrounds
Use empty string "" for any color you cannot confidently determine. Colors must be valid 6-digit hex (#rrggbb).`;

async function parseWithGroq(imageBase64: string, mimeType: string): Promise<Record<string, unknown>> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_groq_api_key_here') throw new Error('no_key');

  const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
  const headers  = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` };

  let body: Record<string, unknown>;

  if (mimeType === 'application/pdf') {
    // Extract text from PDF, then use a text model
    const pdfText  = (await pdfParse(Buffer.from(imageBase64, 'base64'))).text;
    body = {
      model: 'llama-3.3-70b-versatile',
      temperature: 0,
      max_tokens: 2048,
      messages: [{ role: 'user', content: `${PARSE_PROMPT}\n\nDocument text:\n${pdfText}` }],
    };
  } else {
    // Use vision model for images
    body = {
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      temperature: 0,
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
          { type: 'text', text: PARSE_PROMPT },
        ],
      }],
    };
  }

  const res = await fetch(GROQ_URL, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as Record<string, unknown>;
    const msg = ((err.error as Record<string, unknown> | undefined)?.message ?? res.statusText) as string;
    throw new Error(`Groq error: ${msg}`);
  }

  const result  = await res.json() as Record<string, unknown>;
  const choices  = result.choices as Array<Record<string, unknown>>;
  const raw      = ((choices?.[0]?.message as Record<string, unknown>)?.content as string) ?? '';
  const jsonText = raw.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim();
  return JSON.parse(jsonText);
}

async function localOcrFallback(imageBase64: string, mimeType: string): Promise<Record<string, unknown>> {
  let text = '';
  if (mimeType === 'application/pdf') {
    text = (await pdfParse(Buffer.from(imageBase64, 'base64'))).text;
  } else {
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('eng');
    const result = await worker.recognize(Buffer.from(imageBase64, 'base64'));
    text = result.data.text;
    await worker.terminate();
  }
  return parseInvoiceText(text);
}

export async function extractColorsFromImage(
  imageBase64: string,
  mimeType: string
): Promise<{ primary: string; secondary: string; accent: string } | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_groq_api_key_here') return null;

  try {
    const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        temperature: 0,
        max_tokens: 120,
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
            { type: 'text', text: COLOR_PROMPT },
          ],
        }],
      }),
    });
    if (!res.ok) return null;
    const result = await res.json() as Record<string, unknown>;
    const choices = result.choices as Array<Record<string, unknown>>;
    const raw = ((choices?.[0]?.message as Record<string, unknown>)?.content as string) ?? '';
    const jsonText = raw.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(jsonText) as { primary: string; secondary: string; accent: string };
    const isHex = (s: unknown) => typeof s === 'string' && /^#[0-9A-Fa-f]{6}$/.test(s);
    return {
      primary: isHex(parsed.primary) ? parsed.primary : '',
      secondary: isHex(parsed.secondary) ? parsed.secondary : '',
      accent: isHex(parsed.accent) ? parsed.accent : '',
    };
  } catch {
    return null;
  }
}

export async function parseReceiptFromImage(
  imageBase64: string,
  mimeType: string
): Promise<Record<string, unknown>> {
  // Try Groq (free, global) → fall back to local OCR
  try {
    return await parseWithGroq(imageBase64, mimeType);
  } catch (err) {
    const msg = (err as Error).message;
    if (!msg.startsWith('no_key')) console.error('Groq parse error:', msg);
  }
  return localOcrFallback(imageBase64, mimeType);
}

export async function smartDescriptionEnhance(rawDescription: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'your_anthropic_api_key_here') return rawDescription;

  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const anthropic = new Anthropic({ apiKey });
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 60,
      messages: [{ role: 'user', content: `Make this service description more professional (10 words max, return only the text): "${rawDescription}"` }],
    });
    const text = msg.content[0].type === 'text' ? msg.content[0].text.trim() : rawDescription;
    return text.replace(/^["']|["']$/g, '');
  } catch {
    return rawDescription;
  }
}
