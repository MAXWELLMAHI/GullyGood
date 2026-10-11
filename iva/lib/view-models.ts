import type {
  AppRole,
  ClaimStatus,
  DonationStatus,
  ItemQuality,
  NgoVerificationStatus,
} from "@/lib/roles";

export type DashboardStat = {
  label: string;
  value: string;
  hint: string;
};

export type FeedbackEntry = {
  id: string;
  authorLabel: string;
  rating: number;
  comments: string | null;
  createdAt: string;
  targetRole: AppRole;
};

export type ChatEntry = {
  id: string;
  senderRole: Extract<AppRole, "donor" | "ngo">;
  senderName: string;
  message: string;
  sharedPhone: string | null;
  createdAt: string;
};

export type ListingSummary = {
  id: string;
  category: string;
  quantity: number;
  quality: ItemQuality;
  description: string | null;
  status: DonationStatus;
  locality: string;
  city: string;
  pincode: string;
  addressLine: string | null;
  landmark: string | null;
  addressVisible: boolean;
  pickupWindowStart: string;
  pickupWindowEnd: string;
  imageUrl: string | null;
  distanceKm?: number | null;
  matchScore?: number | null;
  ngoRatingAverage?: number | null;
  ngoCompletionRate?: number | null;
  claimId?: string | null;
  claimState?: ClaimStatus | null;
  ngoName?: string | null;
};

export type ListingDetail = ListingSummary & {
  latitude: number;
  longitude: number;
  feedback: FeedbackEntry[];
  chatEnabled: boolean;
  chatParticipantName: string | null;
  chatParticipantPhone: string | null;
  chatMessages: ChatEntry[];
  canLock: boolean;
  canMarkPickedUp: boolean;
  canLeaveFeedback: boolean;
  targetFeedbackRole: AppRole;
};

export type DonorDashboardData = {
  stats: DashboardStat[];
  listings: ListingSummary[];
};

export type NgoDashboardData = {
  stats: DashboardStat[];
  nearbyListings: ListingSummary[];
  activeClaims: ListingSummary[];
};

export type NgoDirectoryEntry = {
  id: string;
  name: string;
  address: string;
  city: string;
  pincode: string;
  ngoDarpanId: string | null;
  registrationNumber: string | null;
  contactPhone: string | null;
  serviceRadiusKm: number;
  acceptedCategories: string[];
  dailyPickupCapacity: number;
  ratingAverage: number | null;
  completionRate: number | null;
  verifiedStatus: NgoVerificationStatus;
};

export type UserDirectoryEntry = {
  id: string;
  fullName: string | null;
  role: AppRole;
  city: string | null;
  pincode: string | null;
};

export type AdminDashboardData = {
  stats: DashboardStat[];
  ngos: NgoDirectoryEntry[];
  users: UserDirectoryEntry[];
  listings: ListingSummary[];
};
