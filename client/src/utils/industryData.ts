export interface IndustryOption {
  value: string;
  label: string;
}

export const INDUSTRIES: IndustryOption[] = [
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

export const CLIENT_TYPES: Record<string, IndustryOption[]> = {
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
    { value: 'portrait', label: 'Portrait & Headshots' },
    { value: 'event', label: 'Events & Weddings' },
    { value: 'commercial', label: 'Commercial / Product' },
    { value: 'video', label: 'Videography' },
  ],
  'pet-services': [
    { value: 'grooming', label: 'Grooming' },
    { value: 'dog-walking', label: 'Dog Walking' },
    { value: 'boarding', label: 'Boarding & Sitting' },
    { value: 'training', label: 'Pet Training' },
  ],
};

export function getClientTypes(industry: string): IndustryOption[] {
  return CLIENT_TYPES[industry] ?? CLIENT_TYPES['cleaning'];
}
