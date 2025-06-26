import {
  Calendar,
  Video,
  CreditCard,
  User,
  FileText,
  ShieldCheck,
} from "lucide-react";

// JSON data for features
export const features = [
  {
    icon: <User className="h-6 w-6 text-blue-400" />,
    title: "Set Up Your Profile",
    description:
      "Sign up and build your profile to receive tailored healthcare suggestions and seamless service access.",
  },
  {
    icon: <Calendar className="h-6 w-6 text-blue-400" />,
    title: "Schedule Appointments",
    description:
      "Explore doctor profiles, check real-time availability, and book appointments at your convenience.",
  },
  {
    icon: <Video className="h-6 w-6 text-blue-400" />,
    title: "Consult via Video",
    description:
      "Connect with verified doctors over secure, high-quality video calls—anytime, from anywhere.",
  },
  {
    icon: <CreditCard className="h-6 w-6 text-blue-400" />,
    title: "Flexible Credit System",
    description:
      "Choose from affordable credit packages to manage your consultations efficiently and cost-effectively.",
  },
  {
    icon: <ShieldCheck className="h-6 w-6 text-blue-400" />,
    title: "Trusted Medical Experts",
    description:
      "Our platform features thoroughly verified doctors, ensuring professional and reliable healthcare.",
  },
  {
    icon: <FileText className="h-6 w-6 text-blue-400" />,
    title: "Complete Health Records",
    description:
      "Easily access your medical history, doctor notes, and consultation summaries in one place.",
  },
];


// JSON data for testimonials
export const testimonials = [
  {
    initials: "SP",
    name: "Amit Goswami",
    role: "Patient",
    quote:
      "The video consultations were a lifesaver—quick, easy, and no need to miss work or travel to a clinic.",
  },
  {
    initials: "DR",
    name: "Dr. Sunil Taneja",
    role: "Cardiologist",
    quote:
      "This platform has transformed how I practice. I can consult more patients and deliver care without the limitations of location.",
  },
  {
    initials: "JT",
    name: "Alok Gupta",
    role: "Patient",
    quote:
      "I love the credit system—one package covered my family’s needs, and we’ve consulted specialists without any hassle.",
  },
];


// JSON data for credit system benefits
export const creditBenefits = [
  "Each consultation requires <strong class='text-blue-400'>2 credits</strong> regardless of duration",
  "Credits <strong class='text-blue-400'>never expire</strong> - use them whenever you need",
  "On signup you get <strong class='text-blue-400'>2 free credits</strong> for booking appointments",
  "You can cancel your appointments <strong class='text-blue-400'>without penalties</strong>",
];