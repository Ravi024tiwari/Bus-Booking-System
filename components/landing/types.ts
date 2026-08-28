export interface BusTrip {
  id: string;
  operator: string;
  type: string;
  rating: number;
  reviews: number;
  departure: string;
  duration: string;
  arrival: string;
  from: string;
  to: string;
  price: number;
  seatsLeft: number;
  amenities: string[];
}

export interface ServiceItem {
  id: string;
  tag: string;
  category: 'All' | 'Intercity' | 'Local' | 'Operator' | 'Charter';
  title: string;
  desc: string;
  image: string;
  action: string;
}

export interface TestimonialItem {
  name: string;
  location: string;
  avatar: string;
  rating: number;
  comment: string;
}

export const BRAND_NAME = 'TripGo';

export const POPULAR_CITIES = [
  'Delhi',
  'Jaipur',
  'Dehradun',
  'Agra',
  'Haridwar',
  'Chandigarh',
  'Manali',
  'Shimla',
  'Bangalore',
  'Hyderabad',
  'Mumbai',
  'Pune'
];

export const MOCK_BUSES: BusTrip[] = [
  {
    id: "BUS-101",
    operator: "TripGo SmartBus Electric",
    type: "AC Multi-Axle Sleeper (2+1)",
    rating: 4.8,
    reviews: 420,
    departure: "20:30",
    duration: "5h 30m",
    arrival: "02:00",
    from: "Delhi",
    to: "Jaipur",
    price: 850,
    seatsLeft: 8,
    amenities: ["Wifi", "Charging", "Water", "Live GPS", "Blanket"]
  },
  {
    id: "BUS-102",
    operator: "TripGo Royal Volvo Premium",
    type: "Volvo 9600 Multi-Axle AC Sleeper",
    rating: 4.9,
    reviews: 890,
    departure: "22:00",
    duration: "5h 15m",
    arrival: "03:15",
    from: "Delhi",
    to: "Jaipur",
    price: 1150,
    seatsLeft: 4,
    amenities: ["Wifi", "CCTV", "Snacks", "Live GPS", "Reading Light"]
  },
  {
    id: "BUS-103",
    operator: "TripGo Intercity Express",
    type: "BharatBenz AC Seater (2+2)",
    rating: 4.7,
    reviews: 310,
    departure: "06:00",
    duration: "5h 45m",
    arrival: "11:45",
    from: "Delhi",
    to: "Jaipur",
    price: 620,
    seatsLeft: 16,
    amenities: ["Charging", "Water", "Live GPS"]
  }
];

export const SERVICES_DATA: ServiceItem[] = [
  {
    id: "intercity",
    tag: "Intercity Trips",
    category: "Intercity",
    title: "Intercity Long Haul",
    desc: "Travel across cities with comfortable AC sleepers and multi-axle luxury Volvos.",
    image: "/images/bus1.jpg",
    action: "Book Now"
  },
  {
    id: "local",
    tag: "Local Trips",
    category: "Local",
    title: "Local & Regional Trips",
    desc: "Short rides, big convenience. Perfect for daily commutes and nearby destinations.",
    image: "/images/volvo.png",
    action: "Book Now"
  },
  {
    id: "operator",
    tag: "Operator Services",
    category: "Operator",
    title: "Fleet & Operator Services",
    desc: "For bus operators to manage live bus fleets, driver telemetry, schedules, and revenue.",
    image: "/images/admin_banner.jpeg",
    action: "Learn More"
  },
  {
    id: "charter",
    tag: "Charter Booking",
    category: "Charter",
    title: "Private Charter & Events",
    desc: "Book entire buses for weddings, corporate group outings, and special tours.",
    image: "/images/bus2.jpg",
    action: "Enquire Now"
  }
];

export const TESTIMONIALS_DATA: TestimonialItem[] = [
  {
    name: "Ravi Sharma",
    location: "Bangalore",
    avatar: "/images/rohit-avatar.jpg",
    rating: 5,
    comment: "Booking on TripGo is super easy and convenient. Great experience every time! The live GPS tracking saved me from waiting in the rain."
  },
  {
    name: "Neha Iyer",
    location: "Chennai",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    rating: 5,
    comment: "Live tracking feature is amazing. I always know where my bus is. Highly recommended! The automatic seat release queue gave me instant refunds."
  },
  {
    name: "Arjun Patel",
    location: "Ahmedabad",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    rating: 5,
    comment: "Affordable prices and comfortable buses. My go-to app for all bus bookings. Super clean Volvo multi-axle sleeper buses."
  }
];
