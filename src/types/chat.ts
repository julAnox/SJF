export interface Message {
  id: string;
  senderId: string;
  content: string;
  type: 'text' | 'resume' | 'coverLetter' | 'jobOffer';
  timestamp: string;
  metadata?: {
    resumeId?: string;
    jobId?: string;
    salary?: {
      min: number;
      max: number;
    };
  };
}

export interface Chat {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  lastMessage: string;
  unread: number;
  timestamp: string;
  type: 'application' | 'offer' | 'general';
  status: 'active' | 'closed' | 'blocked';
}

export interface ChatParticipant {
  id: string;
  name: string;
  avatar: string;
  role: 'applicant' | 'employer';
}

export interface ApplicationData {
  resumeId: string;
  coverLetter: string;
  jobId: string;
}

export interface OfferData {
  position: string;
  company: string;
  salaryRange: {
    min: number;
    max: number;
  };
  description: string;
  requirements: string;
  benefits: string;
  resumeId: string;
}