export type User = {
  id: string;
  email: string;
  name: string;
  isVip: boolean;
  avatar?: string;
  friends?: string[];
  account_id?: string;
};

export type Pet = {
  id: string;
  userId: string;
  name: string;
  species: 'dog' | 'cat' | 'other';
  breed: string;
  birthday: string;
  weight: number;
  avatar?: string;
  vaccines: Vaccine[];
};

export type Vaccine = {
  id: string;
  name: string;
  date: string;
  nextDueDate?: string;
};

export type Appointment = {
  id: string;
  userId: string;
  petId: string;
  title: string;
  date: string;
  time: string;
  location: string;
  notes?: string;
};

export type HealthRecord = {
  id: string;
  userId: string;
  petId: string;
  date: string;
  weight?: number;
  symptoms?: string;
  diagnosis?: string;
  treatment?: string;
};

export type AIAnalysis = {
  id: string;
  userId: string;
  petId: string;
  date: string;
  imageUrl?: string;
  result: string;
};

export type Comment = {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  date: string;
};

export type Post = {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  imageUrl?: string;
  likes: number;
  likedBy?: string[];
  comments: number;
  commentsList?: Comment[];
  date: string;
};

export type Message = {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  date: string;
};

export type Place = {
  id: string;
  name: string;
  type: 'hospital' | 'store' | 'hotel';
  region: string;
  address: string;
  rating: number;
  lat: number;
  lng: number;
};

export type Toast = {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
};

export type PaymentMethod = 'credit_card' | 'apple_pay' | 'line_pay' | 'jko_pay';

export type PaymentOrder = {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  createdAt: string;
  completedAt?: string;
  transactionId?: string;
};
