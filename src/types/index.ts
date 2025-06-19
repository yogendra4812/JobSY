export interface User {
  id: string;
  name: string;
  email: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
}

export interface Experience {
  company: string;
  position: string;
  duration: string;
}

export interface Education {
  institution: string;
  degree: string;
  year: string;
}
// src/types.ts
// src/types.ts
export interface Job {
  id: string;
  title: string;
  company: string;
  description?: string;
  requirements?: string[];
  matchingSkills?: string[];
  // new fields:
  experienceRequired?: string;
  score?: number;
  link?: string;
  applied?: boolean;
  appliedAt?: string;   
}
