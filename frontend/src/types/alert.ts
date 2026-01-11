export interface Alert {
  _id: string;
  userId: string;
  type: string;
  description?: string;
  latitude: number;
  longitude: number;
  roadName?: string;
  fullAddress?: string;
  photo?: string;
  confirmations: number;
  denials: number;
  confidenceScore: number;
  confirmedBy: string[];
  deniedBy: string[];
  verified: boolean;
  status: 'ACTIVE' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
  createdAt: string;
  expiresAt?: string;
}

export interface CreateAlertDto {
  type: string;
  description?: string;
  latitude: number;
  longitude: number;
  roadName?: string;
  fullAddress?: string;
  photo?: File | string; // Can be File or string (for backward compatibility)
}

