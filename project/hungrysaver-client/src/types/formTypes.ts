// Donor form data structure
export interface DonationData {
  userId: string;
  initiative: string;
  location_lowercase: string;
  address: string;
  donorName: string;
  donorContact: string;
  details: {
    // Annamitra Seva fields
    foodType?: 'veg' | 'non-veg';
    quantity?: string;
    preparationTime?: string;
    
    // Vidya Jyothi fields
    amount?: string;
    purpose?: 'fees' | 'books' | 'uniform';
    childName?: string;
    childAge?: string;
    childGrade?: string;
    
    // Suraksha Setu fields
    itemType?: 'clothing' | 'books' | 'groceries';
    itemQuantity?: string;
    condition?: 'new' | 'used';
    
    // PunarAsha fields
    itemCategory?: 'electronics' | 'furniture';
    workingCondition?: boolean;
    estimatedValue?: string;
    
    // Raksha Jyothi fields
    emergencyType?: 'medical' | 'accident' | 'animal';
    urgencyLevel?: '1' | '2' | '3' | '4' | '5';
    
    // Jyothi Nilayam fields
    donationType?: 'full' | 'partial';
    donationAmount?: string;
    shelterPreference?: 'human' | 'animal' | 'both';
  };
  description: string;
  status: 'pending' | 'accepted' | 'picked' | 'delivered';
  createdAt: Date;
}

// Community request data structure
export interface RequestData {
  userId: string;
  initiative: string;
  location_lowercase: string;
  address: string;
  beneficiary: {
    name: string;
    contact: string;
  };
  details: {
    // Annamitra Community fields
    numberOfPeople?: string;
    dietaryRestrictions?: string;
    mealFrequency?: 'single' | 'daily';
    
    // Vidya Jyothi Community fields
    childName?: string;
    childAge?: string;
    schoolName?: string;
    className?: string;
    neededItems?: {
      fees: boolean;
      books: boolean;
      uniform: boolean;
    };
    
    // Suraksha Setu Community fields
    neededItemTypes?: string[];
    quantityRequired?: string;
    
    // PunarAsha Community fields
    requestedItems?: string[];
    purpose?: 'resale' | 'reuse';
    quantityNeeded?: string;
    
    // Raksha Jyothi Community fields
    emergencyDescription?: string;
    peopleAnimalsAffected?: string;
    immediateNeeds?: string;
    
    // Jyothi Nilayam Community fields
    shelterTypeNeeded?: 'human' | 'animal' | 'both';
    numberOfPeopleAnimals?: string;
    durationNeeded?: string;
  };
  urgency: 'low' | 'medium' | 'high';
  description: string;
  status: 'pending' | 'approved' | 'fulfilled';
  createdAt: Date;
}

export interface FormProps<T = unknown> {
  onSubmit: (data: T) => Promise<boolean>;
  loading?: boolean;
}

export interface Task {
  id: string;
  type: 'donation' | 'request';
  initiative: string;
  location: string;
  address: string;
  status: string;
  createdAt: Date | string | number;
  donorName?: string;
  donorContact?: string;
  beneficiaryName?: string;
  beneficiaryContact?: string;
  description: string;
  details?: Record<string, unknown>;
  assignedTo?: string;
}