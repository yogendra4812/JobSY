/* src/api/api.ts */

export const API_BASE = 'https://jobsy-backend.onrender.com';

export function getApiBaseUrl(): string {
  return API_BASE;
}
async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) {
    const err = typeof data.detail === 'string'
      ? data.detail
      : data.error || JSON.stringify(data);
    throw new Error(err);
  }
  return data;
}

// === Auth ===
export interface AuthResponse {
  message: string;
  user_id: string;
}

export async function registerApi(
  full_name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  return request<AuthResponse>(
    `${API_BASE}/user-register`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name, email, password }),
    }
  );
}

export async function loginApi(
  email: string,
  password: string
): Promise<AuthResponse> {
  return request<AuthResponse>(
    `${API_BASE}/user-login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }
  );
}

// === Profile ===
export interface Profile {
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  skills: string[];
  experience: Array<{ position?: string; company?: string; duration?: string }>;
  education: Array<{ degree?: string; institution?: string; year?: string; score?: string }>;
}

export async function fetchProfile(
  userId: string
): Promise<Profile> {
  const url = new URL(`${API_BASE}/profile`);
  url.searchParams.append('user_id', userId);
  return request<Profile>(url.toString());
}

// === Resume Parsing ===
export interface ParseResumeResponse {
  message: string;
  parsed_data: any;
}

export async function parseResume(
  file: File,
  userId: string
): Promise<ParseResumeResponse> {
  const formData = new FormData();
  formData.append('file', file);
  const url = new URL(`${API_BASE}/get-parse-resume`);
  url.searchParams.append('user_id', userId);

  const res = await fetch(url.toString(), {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) {
    const err = data.detail || data.error || JSON.stringify(data);
    throw new Error(err);
  }
  return data;
}

// === Jobs ===
export interface Job {
  id: string;
  user_id: string;
  title: string;
  company?: string;
  job_description?: string;
  requirements?: string[];
  applied?: boolean;
}

export async function findJobs(
  userId: string,
  jobRole: string,
  location?: string
): Promise<{ message: string; jobs_found?: number; all_jobs?: Job[] }> {
  const url = new URL(`${API_BASE}/find-jobs`);
  url.searchParams.append('user_id', userId);
  url.searchParams.append('job_role', jobRole);
  if (location) url.searchParams.append('location', location);
  return request(url.toString());
}

export async function fetchRecommendedJobs(
  userId: string
): Promise<{ message: string; jobs_returned: number; recommended_jobs: Job[] }> {
  const url = new URL(`${API_BASE}/recommended-jobs`);
  url.searchParams.append('user_id', userId);
  return request(url.toString());
}

export async function fetchJobsByRole(
  jobRole: string
): Promise<{ job_role: string; count: number; jobs: Job[] }> {
  const url = new URL(`${API_BASE}/jobs-by-role`);
  url.searchParams.append('job_role', jobRole);
  return request(url.toString());
}

export async function fetchAppliedJobs(
  userId: string
): Promise<{ applied_jobs: Job[] }> {
  const url = new URL(`${API_BASE}/applied-jobs`);
  url.searchParams.append('user_id', userId);
  return request(url.toString());
}

export async function applyJob(
  userId: string,
  jobId: string
): Promise<{ message: string }> {
  const url = new URL(`${API_BASE}/apply-job`);
  url.searchParams.append('user_id', userId);
  url.searchParams.append('job_id', jobId);
  return request(url.toString(), { method: 'PUT' });
}

export async function fetchAllJobs(
  userId: string
): Promise<Job[] | { message: string }> {
  const url = new URL(`${API_BASE}/get-all-jobs`);
  url.searchParams.append('user_id', userId);
  return request(url.toString());
}
