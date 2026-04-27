import type {
  AdminDashboardData,
  DonorDashboardData,
  ListingDetail,
  ListingSummary,
  NgoDashboardData,
} from "@/lib/view-models";

const now = new Date("2026-04-24T08:00:00+05:30");
const plusHours = (hours: number) =>
  new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString();
const plusDays = (days: number) =>
  new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

const baseListings: ListingSummary[] = [
  {
    id: "mock-blankets",
    category: "Blankets",
    quantity: 6,
    quality: "good",
    description: "Freshly washed blankets packed and ready for same-day pickup.",
    status: "live",
    locality: "Mahim",
    city: "Mumbai",
    pincode: "400016",
    addressLine: null,
    landmark: "Near Mahim railway station",
    addressVisible: false,
    pickupWindowStart: plusHours(6),
    pickupWindowEnd: plusHours(12),
    imageUrl: null,
    distanceKm: 3.2,
    claimId: null,
    claimState: null,
    ngoName: null,
  },
  {
    id: "mock-books",
    category: "Books",
    quantity: 24,
    quality: "excellent",
    description: "School books and workbooks sorted by class level.",
    status: "locked",
    locality: "Bandra West",
    city: "Mumbai",
    pincode: "400050",
    addressLine: "St. Martin Lane, Bandra West",
    landmark: "Behind Linking Road market",
    addressVisible: true,
    pickupWindowStart: plusHours(3),
    pickupWindowEnd: plusHours(10),
    imageUrl: null,
    distanceKm: 1.8,
    claimId: "claim-books",
    claimState: "locked",
    ngoName: "Sahaara Community Trust",
  },
  {
    id: "mock-meals",
    category: "Packed Meals",
    quantity: 18,
    quality: "new",
    description: "Freshly packed veg meals from a housing society drive.",
    status: "picked_up",
    locality: "Dadar East",
    city: "Mumbai",
    pincode: "400014",
    addressLine: "Parel TT service road",
    landmark: "Near the flyover",
    addressVisible: true,
    pickupWindowStart: plusDays(-1),
    pickupWindowEnd: plusDays(-1),
    imageUrl: null,
    distanceKm: 4.4,
    claimId: "claim-meals",
    claimState: "completed",
    ngoName: "Aman Seva Foundation",
  },
];

export const demoCredentials = [
  {
    role: "donor",
    email: "donor@iva.app",
    password: "Password123!",
  },
  {
    role: "ngo",
    email: "ngo@iva.app",
    password: "Password123!",
  },
  {
    role: "admin",
    email: "admin@iva.app",
    password: "Password123!",
  },
] as const;

export const mockDonorDashboard: DonorDashboardData = {
  stats: [
    {
      label: "Live donations",
      value: "1",
      hint: "Visible to verified NGOs within radius",
    },
    {
      label: "Locked today",
      value: "1",
      hint: "Awaiting pickup confirmation",
    },
    {
      label: "Completed loop",
      value: "1",
      hint: "Donation and feedback finished",
    },
  ],
  listings: [baseListings[1], baseListings[0], baseListings[2]],
};

export const mockNgoDashboard: NgoDashboardData = {
  stats: [
    {
      label: "Nearby live listings",
      value: "1",
      hint: "Within your configured service radius",
    },
    {
      label: "Active locks",
      value: "1",
      hint: "Needs pickup completion",
    },
    {
      label: "Completed pickups",
      value: "1",
      hint: "Ready for feedback follow-up",
    },
  ],
  nearbyListings: [baseListings[0]],
  activeClaims: [baseListings[1], baseListings[2]],
};

export const mockAdminDashboard: AdminDashboardData = {
  stats: [
    {
      label: "Registered users",
      value: "3",
      hint: "Donor, NGO, and admin seed accounts",
    },
    {
      label: "Verified NGOs",
      value: "2",
      hint: "Mumbai-first onboarding in progress",
    },
    {
      label: "Open listings",
      value: "2",
      hint: "One live, one locked",
    },
  ],
  ngos: [
    {
      id: "ngo-sahaara",
      name: "Sahaara Community Trust",
      address: "Hill Road Outreach Centre",
      city: "Mumbai",
      pincode: "400050",
      ngoDarpanId: "MH/2026/0001111",
      registrationNumber: "MH-TRUST-48211",
      contactPhone: "+91 98765 43210",
      serviceRadiusKm: 8,
      verifiedStatus: "verified",
    },
    {
      id: "ngo-aman",
      name: "Aman Seva Foundation",
      address: "Parel Community Hub",
      city: "Mumbai",
      pincode: "400012",
      ngoDarpanId: "MH/2026/0001112",
      registrationNumber: "MH-SOC-48351",
      contactPhone: "+91 99887 66554",
      serviceRadiusKm: 10,
      verifiedStatus: "pending",
    },
  ],
  users: [
    {
      id: "user-donor",
      fullName: "Asha Mehta",
      role: "donor",
      city: "Mumbai",
      pincode: "400016",
    },
    {
      id: "user-ngo",
      fullName: "Rohan Patil",
      role: "ngo",
      city: "Mumbai",
      pincode: "400050",
    },
    {
      id: "user-admin",
      fullName: "IVA Ops",
      role: "admin",
      city: "Mumbai",
      pincode: "400001",
    },
  ],
  listings: [baseListings[0], baseListings[1], baseListings[2]],
};

export const mockListingDetails: Record<string, ListingDetail> = {
  "mock-blankets": {
    ...baseListings[0],
    latitude: 19.0415,
    longitude: 72.8397,
    feedback: [],
    canLock: true,
    canMarkPickedUp: false,
    canLeaveFeedback: false,
    targetFeedbackRole: "donor",
  },
  "mock-books": {
    ...baseListings[1],
    latitude: 19.0548,
    longitude: 72.8265,
    feedback: [],
    canLock: false,
    canMarkPickedUp: true,
    canLeaveFeedback: false,
    targetFeedbackRole: "donor",
  },
  "mock-meals": {
    ...baseListings[2],
    latitude: 19.0152,
    longitude: 72.8451,
    feedback: [
      {
        id: "feedback-ngo-1",
        authorLabel: "Aman Seva Foundation",
        rating: 5,
        comments: "Pickup was smooth and the donor had everything packed well.",
        createdAt: plusHours(-6),
        targetRole: "donor",
      },
      {
        id: "feedback-donor-1",
        authorLabel: "Asha Mehta",
        rating: 5,
        comments: "The NGO volunteer arrived on time and coordinated clearly.",
        createdAt: plusHours(-4),
        targetRole: "ngo",
      },
    ],
    canLock: false,
    canMarkPickedUp: false,
    canLeaveFeedback: true,
    targetFeedbackRole: "ngo",
  },
};
