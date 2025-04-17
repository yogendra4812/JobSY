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
export interface Job {
  id: string;                   // we’ll map Mongo’s _id → id
  title: string;
  company: string;
  location: string;
  salary?: string;
  postedDate?: string;
  description?: string;
  requirements?: string[];
  matchingSkills?: string[];
  applied?: boolean;            // <— add this
}
