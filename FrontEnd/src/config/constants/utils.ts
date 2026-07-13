import { RenewPlan } from "@/types/frontend";
import { CSSProperties } from "react";
import { io, Socket } from "socket.io-client";

export const WHITELIST_REDUCER = [
  "account.isAuthenticated",
  "account.isRefreshToken",
  "timer",
  "cart",
  "background",
];

export const roleColors: Record<string, string> = {
  ADMIN: "red",
  USER: "blue",
  STAFF: "purple",
  PROVIDER: "orange",
};

export const roleColorsDark: Record<string, string> = {
  ADMIN: "#ff4d4f",
  USER: "#1677ff",
  STAFF: "#722ed1",
  PROVIDER: "#ffa940",
};

export const roleGradients: Record<string, string> = {
  ADMIN: "linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)",
  USER: "linear-gradient(135deg, #1677ff 0%, #69b1ff 100%)",
  STAFF: "linear-gradient(135deg, #722ed1 0%, #b37feb 100%)",
  PROVIDER: "linear-gradient(135deg, #ffa940 0%, #ffd666 100%)",
};

export const statusColors: Record<string, string> = {
  REJECTED: "error",
  PENDING: "blue",
  PACKAGING: "purple",
  DELIVERING: "cyan",
  APPROVED: "green",
  SUCCESS: "green",
  FAILED: "volcano",
  CANCELLED: "red",
  REFUNDED: "gold",
};

export const paymentRefColors: Record<string, string> = {
  LOCAL: "lime",
  VNPAY: "geekblue",
  CREDIT_CARD: "magenta",
};

export const PaymentMethod = {
  COD: "COD",
  CREDIT_CARD: "CREDIT_CARD",
  VNPAY: "VNPAY",
};

export const paymentMethodLabels: Record<string, string> = {
  COD: "Cash on Delivery (COD)",
  CREDIT_CARD: "Credit Card",
  VNPAY: "VNPay",
};

export const socket: Socket = io(import.meta.env.VITE_BACKEND_URL, {
  transports: ["websocket"],
  autoConnect: false,
});

export const SUGGESTIONS = {
  ANON: [
    "Show mouse category products",
    "Find products under $1000",
    "What products are on discount?",
    "How do I register an account?",
  ],
  USER: [
    "Show my latest orders",
    "Find my highest order",
    "Show products with highest rating",
    "Find products with available stock",
  ],
  PROVIDER: [
    "Show my products",
    "Show overdue products",
    "Find my newest products",
    "Show provider revenue dashboard",
  ],
  ADMIN: [
    "Find newest users",
    "Show pending orders",
    "Find product with latest due date",
    "Show highest revenue orders",
  ],
  STAFF: [
    "Find users registered today",
    "Show failed orders",
    "Find products updated today",
    "Show latest orders",
  ],
};

export const DARKTHEME = {
  bg: "#121212",
  bgSecondary: "#1a1a1a",
  card: "#1f1f1f",
  border: "#2d2d2d",
  header: "rgba(32,32,32,0.9)",
};

export const hideScrollbar: CSSProperties = {
  overflowY: "auto",
  scrollbarWidth: "none",
  msOverflowStyle: "none",
};

export const PLANS: RenewPlan[] = [
  {
    id: "3",
    months: 3,
    price: 9.99,
    description: "Ideal for testing new products or short-term campaigns.",
    features: [
      "Perfect for seasonal inventory",
      "Low upfront cost",
      "Renew anytime",
    ],
  },
  {
    id: "6",
    months: 6,
    price: 17.99,
    badge: "Popular",
    description: "A balanced plan for growing stores with consistent sales.",
    features: [
      "Save more than monthly renewals",
      "Great for fast-selling products",
      "Priority renewal reminders",
    ],
  },
  {
    id: "12",
    months: 12,
    price: 29.99,
    badge: "Best Value",
    description: "Keep your products active all year while maximizing savings.",
    features: [
      "Lowest yearly cost",
      "Ideal for evergreen products",
      "Priority support included",
    ],
  },
  {
    id: "24",
    months: 24,
    price: 49.99,
    badge: "Ultimate",
    description:
      "The longest coverage with the biggest savings for established businesses.",
    features: [
      "Maximum long-term savings",
      "Best for top-selling products",
      "VIP support & renewal reminders",
    ],
  },
];
