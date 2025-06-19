import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext';
import {
  Briefcase as BriefcaseBusiness,
  CheckCircle,
  Clock ,
  Bookmark,
} from 'lucide-react';

import Navbar from '../components/ProNavbar';
import { Job } from '../types';
import { getApiBaseUrl } from '../api/api';

const predefinedRoles = [
  'Python Developer',
  'Software Developer',
  'Web Designer',
  'UI/UX Designer',
  'ML Engineer'
];

const JobsPage: React.FC = () => {
  const { user } = useAuth();

  // Filters & Modes
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [customRoleMode, setCustomRoleMode] = useState<boolean>(false);
  const [customRoleInput, setCustomRoleInput] = useState<string>('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  // Data Stores
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [jobsByRole, setJobsByRole] = useState<Record<string, Job[]>>({});
  const [appliedJobs, setAppliedJobs] = useState<Job[]>([]);

  // Apply-Modal State
  const [showApplyModal, setShowApplyModal] = useState<boolean>(false);
  const [pendingJob, setPendingJob] = useState<Job | null>(null);
   const [errorMessage, setErrorMessage] = useState<string>('');

  // Loading Flags
  const [loading, setLoading] = useState(false);
  const [roleLoading, setRoleLoading] = useState(false);
  const [findLoading, setFindLoading] = useState(false);
  const [findCount, setFindCount] = useState<number>(0); 

  // UI State
  const [activeTab, setActiveTab] = useState<'recommended' | 'applied'>('recommended');
  const recommendedCount = customRoleMode
     ? findCount
     : selectedRoles.length > 0
     ? selectedRoles.reduce((sum, r) => sum + (jobsByRole[r]?.length || 0), 0)
     : recommendedJobs.length;

  const apiBase = getApiBaseUrl();

  // --- Fetch Helpers ---
  const fetchRecommendedJobs = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(
        `${apiBase}/recommended-jobs?user_id=${encodeURIComponent(user.id)}`
      );
      const data = await res.json();
      if (Array.isArray(data.recommended_jobs)) {
        setRecommendedJobs(
          data.recommended_jobs.map((j: any) => ({
            id: j.id,
            title: j.title,
            company: j.company,
            description: j.description,
            requirements: String(j.description)
                       .split(',')
                       .map((s) => s.trim())
                       .filter(Boolean),
            matchingSkills: j.matchingSkills,
            experienceRequired: j.experience_required,
            score: j.score,
            link: j.link,
            applied: !!j.applied,
          }))
          .filter((j: Job) => !j.applied)
        );
      }
    } catch {
      setRecommendedJobs([]);
    }
  };

  const fetchJobsByRole = async (role: string) => {
    setRoleLoading(true);
    try {
      const res = await fetch(
        `${apiBase}/jobs-by-role?job_role=${encodeURIComponent(role)}`
      );
      const data = await res.json();
      const list = Array.isArray(data.jobs)
        ? data.jobs.map((j: any) => ({
            id: j.id,
            title: j.title,
            company: j.company,
            description: j.description,
            requirements: String(j.description)
                       .split(',')
                       .map((s) => s.trim())
                       .filter(Boolean),
            matchingSkills: j.matchingSkills,
            experienceRequired: j.experience_required,
            score: j.score,
            link: j.link,
            applied: !!j.applied,
          }))
          .filter((j: Job) => !j.applied)
        : [];
      setJobsByRole((prev) => ({ ...prev, [role]: list }));
    } catch {
      setJobsByRole((prev) => ({ ...prev, [role]: [] }));
    } finally {
      setRoleLoading(false);
    }
  };

  const fetchAppliedJobs = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(
        `${apiBase}/applied-jobs?user_id=${encodeURIComponent(user.id)}`
      );
      const data = await res.json();
      if (Array.isArray(data.applied_jobs)) {
        setAppliedJobs(
          data.applied_jobs.map((j: any) => ({
            id: j._id,
            title: j.title,
            company: j.company,
            description: j.description,
            requirements: String(j.description)
                       .split(',')
                       .map((s) => s.trim())
                       .filter(Boolean),
            matchingSkills: j.matchingSkills,
            experienceRequired: j.experience_required,
            score: j.score,
            link: j.link,
            applied: true,
            appliedAt: j.applied_at ?? undefined,   // ← map server timestamp
          }))
        );
      }
    } catch {
      setAppliedJobs([]);
    }
  };

  const handleFindJobs = async () => {
  if (!user?.id) return;
  setFindLoading(true);

  // Clear out any role-based data so Find Jobs results stand alone:
  setSelectedRoles([]);
  setJobsByRole({});
  setRecommendedJobs([]);
  setActiveTab('recommended');

  try {
    // 1) Call your API
    const params = new URLSearchParams({
      user_id: user.id,
      job_role: customRoleInput.trim(),
    });
    if (locationFilter.trim()) {
      params.append('location', locationFilter.trim());
    }
    const res = await fetch(`${apiBase}/find-jobs?${params.toString()}`, {
      method: 'POST',
    });
    const data = await res.json();

    // 2) Grab the total count
    if (typeof data.jobs_found === 'number') {
      setFindCount(data.jobs_found);
    }

    // 3) Read from data.all_jobs first
    const raw: any[] = Array.isArray(data.all_jobs)
      ? data.all_jobs
      : Array.isArray(data.find_jobs)
      ? data.find_jobs
      : Array.isArray(data.jobs)
      ? data.jobs
      : [];

    // 4) Map into your Job type
    const list: Job[] = raw.map((j: any) => ({
      id: j._id,                             // use the Mongo _id
      title: j.title,
      company: j.company,
      description: j.description,
      // your API doesn’t return `requirements`, so let’s make an array out of description
      requirements: String(j.description)
                       .split(',')
                       .map((s) => s.trim())
                       .filter(Boolean),
      matchingSkills: [],                    // or parse this if your API provides it
      experienceRequired: j.experience_required,
      score: j.score,
      link: j.link,
      applied: false,
    }));

    setRecommendedJobs(list);
  } catch {
    setRecommendedJobs([]);
    setFindCount(0);
  } finally {
    setFindLoading(false);
  }
};


  // Lifecycle
  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    Promise.all([fetchRecommendedJobs(), fetchAppliedJobs()]).finally(() => setLoading(false));

    const pending = sessionStorage.getItem('pendingApplyJob');
    const confirmed = sessionStorage.getItem('applyConfirmed');
    if (pending && confirmed !== 'true') {
      setPendingJob(JSON.parse(pending));
      setShowApplyModal(true);
    }
  }, [user?.id]);

  useEffect(() => {
    const onFocus = () => {
      const pending = sessionStorage.getItem('pendingApplyJob');
      const confirmed = sessionStorage.getItem('applyConfirmed');
      if (pending && confirmed !== 'true') {
        setPendingJob(JSON.parse(pending));
        setShowApplyModal(true);
      }
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  // Handlers
  const handleRoleToggle = (role: string) => {
    setCustomRoleMode(false);
    setCustomRoleInput('');
    if (selectedRoles.includes(role)) {
      setSelectedRoles((prev) => prev.filter((r) => r !== role));
      setJobsByRole((prev) => {
        const c = { ...prev };
        delete c[role];
        return c;
      });
    } else {
      setSelectedRoles((prev) => [...prev, role]);
      fetchJobsByRole(role);
      setActiveTab('recommended');
    }
  };

  // 1) Toggle “Other Role” mode
const handleOtherClick = () => {
  if (customRoleMode) {
    // TURNING OFF: revert to role-based or original recommendations
    setCustomRoleMode(false);
    setCustomRoleInput('');

    setLoading(true);
    if (selectedRoles.length > 0) {
      // if any roles are still selected, re-fetch those
      Promise.all(selectedRoles.map(role => fetchJobsByRole(role)))
        .finally(() => setLoading(false));
    } else {
      // otherwise, go back to your original recommendations
      fetchRecommendedJobs().finally(() => setLoading(false));
    }
  } else {
    // TURNING ON: clear all filters so only Find Jobs will show
    setCustomRoleMode(true);
    setCustomRoleInput('');
    setSelectedRoles([]);
    setJobsByRole({});         // <-- clear any role-based lists
    setRecommendedJobs([]);    // <-- clear the original recs until user clicks Find
    setActiveTab('recommended');
  }
};

  const handleApplyLink = (job: Job) => {
    sessionStorage.setItem('pendingApplyJob', JSON.stringify(job));
    sessionStorage.setItem('applyConfirmed', 'false');
    window.open(job.link!, '_blank');
  };

  const confirmApply = async () => {
    if (!pendingJob || !user?.id) return;
    // const [errorMessage, setErrorMessage] = useState<string>('');

    try {
      const res = await fetch(
        `${apiBase}/apply-job?user_id=${encodeURIComponent(user.id)}&job_id=${encodeURIComponent(pendingJob.id)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appliedAt: new Date().toISOString() }),
        }
      );

      if (res.ok) {
        // Refresh only the Applied tab
        await fetchAppliedJobs();

        // If NOT in "Other Role" mode, re-fetch recommendations
        if (!customRoleMode) {
          await refreshRecommended();
        }
      }
       else {
       // extract server error message if any
      //  const errData = await res.json().catch(() => null);
       throw new Error('Application was already applied');
      }
    } catch (err : any) {
      setErrorMessage(err.message || 'Unknown error');
    } finally {
      sessionStorage.setItem('applyConfirmed', 'true');
      sessionStorage.removeItem('pendingApplyJob');
      setShowApplyModal(false);
      setPendingJob(null);
    setActiveTab('recommended');
  }
};




  const cancelApply = () => {
    sessionStorage.removeItem('pendingApplyJob');
    setShowApplyModal(false);
    setPendingJob(null);
  };

  // helper to re-run whatever “recommended” query is active
const refreshRecommended = async () => {
  if (customRoleMode) {
    // re‐do the custom Find Jobs
    await handleFindJobs();
  } else if (selectedRoles.length > 0) {
    // re‐do each selected‐role fetch
    await Promise.all(selectedRoles.map(r => fetchJobsByRole(r)));
  } else {
    // back to the “pure” server recommendations
    await fetchRecommendedJobs();
  }
};


  // --- Render ---

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-600">
        {roleLoading || findLoading ? 'Finding jobs…' : 'Loading jobs…'}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200">
      {/* ===== Overlay while finding jobs ===== */}
      {findLoading && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-20">
        <div
          className="
            bg-white rounded-lg shadow-md
            p-3 sm:p-4 md:p-6
            w-10/12 sm:w-2/3 md:w-1/2 lg:w-1/3
            max-w-xs
            text-center
          "
        >
          <Loader2 className="mx-auto mb-3 h-5 w-5 sm:h-6 sm:w-6 text-indigo-600 animate-spin" />
          <p className="text-base font-medium text-gray-900">
            Finding jobs…
          </p>
          <p className="mt-1 text-xs text-gray-600">
            This may take a minute.
          </p>
        </div>
      </div>
    )}

      <Navbar />
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Job Recommendations
        </h1>

        {/* Location Filter
        <div className="mb-4">
          <input
            type="text"
            placeholder="Location (optional)"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div> */}

        {/* Role Buttons */}
        <div className="mb-4 flex flex-wrap gap-2">
          {predefinedRoles.map((role) => (
            <button
              key={role}
              onClick={() => handleRoleToggle(role)}
              disabled={customRoleMode || findLoading}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                selectedRoles.includes(role)
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
              } ${
                customRoleMode || findLoading
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
            >
              {role}
            </button>
          ))}

          <button
            onClick={handleOtherClick}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              customRoleMode
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
            } ${findLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Other Role
          </button>
        </div>

        {/* Custom Role + Find Jobs */}
        {customRoleMode && (
          <div className="mb-6 flex gap-2 flex-col">
            <input
              type="text"
              placeholder="Enter Job Role"
              value={customRoleInput}
              onChange={(e) => setCustomRoleInput(e.target.value)}
              onKeyDown={(e) => {
                 // when Enter is pressed and there's text, kick off the search
                 if (e.key === 'Enter' && customRoleInput.trim().length > 0) {
                   handleFindJobs();
                 }
               }}
              className="w-full px-3 py-2 border rounded-md "
            />

            {/* Location Filter */}
        
          <input
            type="text"
            placeholder="Location (optional)"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
       

            {/* only show button once there’s at least one word */}
            {customRoleInput.trim().length > 0 && (
               <button
                 onClick={handleFindJobs}
                 disabled={findLoading}
                 className={`self-start px-4 py-2 bg-indigo-500 text-white rounded-md text-sm font-medium hover:bg-indigo-700 ${
                   findLoading ? 'opacity-50 cursor-not-allowed' : ''
                 }`}
               >
                 {findLoading ? 'Finding jobs…' : 'Find Jobs'}
               </button>
             )}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="hidden sm:block border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('recommended')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'recommended'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Recommended ({recommendedCount})
              </button>
              <button
                onClick={() => setActiveTab('applied')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'applied'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Applied ({appliedJobs.length})
              </button>
            </nav>
          </div>

          <div className="sm:hidden">
            <select
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 rounded-md"
              value={activeTab}
              onChange={(e) =>
                setActiveTab(e.target.value as 'recommended' | 'applied')
              }
            >
              <option value="recommended">
                Recommended ({recommendedCount})
              </option>
              <option value="applied">Applied ({appliedJobs.length})</option>
            </select>
          </div>
        </div>

        {/* Recommended Content */}
        {activeTab === 'recommended' ? (
          <div className="space-y-6">
            {selectedRoles.length > 0 ? (
              [...selectedRoles].reverse().map((role) => {
                const list = jobsByRole[role] || [];
                const filtered = list.filter((j) => !j.applied);
                return (
                  <div key={role}>
                    {selectedRoles.length > 1 && (
                      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                        {role}
                      </h2>
                    )}
                    {filtered.length > 0 ? (
                      filtered.map((job) => (
                        <JobCard
                          key={job.id}
                          job={job}
                          onApply={handleApplyLink}
                        />
                      ))
                    ) : (
                      <p className="text-gray-500 italic">
                        No jobs found for “{role}.”
                      </p>
                    )}
                  </div>
                );
              })
            ) : /** 3) All Recommendations */ recommendedJobs.length > 0 ? (
              recommendedJobs.filter((j) => !j.applied).map((job) => (
                <JobCard key={job.id} job={job} onApply={handleApplyLink} />
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                <BriefcaseBusiness className="mx-auto h-12 w-12" />
                <p className="mt-2">No recommended jobs available.</p>
              </div>
            )}
          </div>
        ) : (
          /** Applied Tab */
          <div className="space-y-6">
            {appliedJobs.length > 0 ? (
              appliedJobs.map((job) => (
                // Inside your Applied-tab map, replace the header block with this:
                 <div
                    key={job.id}
                    className="bg-white rounded-2xl shadow p-6 mb-6"
                    title={job.appliedAt ? `Applied on ${job.appliedAt}` : undefined}
                    onClick={() => window.open(job.link, '_blank')}
                    >
                    {/* HEADER ROW */}
                    <div className="flex justify-between items-center mb-4">
    {/* Job Title & Company */}
    <div>
      <h3 className="text-2xl font-semibold text-gray-900">{job.title}</h3>
      <p className="text-sm text-gray-500">{job.company}</p>
    </div>

    {/* Date/time pill */}
                          {job.appliedAt && (
                          <div className="inline-flex items-center space-x-1 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
                          <Clock className="h-4 w-4" />
        <span>
          {new Date(job.appliedAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}{' '}
          at{' '}
          {new Date(job.appliedAt).toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    )}
                    </div>
  

  {/* DESCRIPTION */}
  {Array.isArray(job.requirements) && job.requirements.length > 0 && (
  <>
    <p className="text-sm font-semibold text-gray-500 mb-2">Requirements :</p>
    <div className="flex flex-wrap gap-2 mb-3">
      {job.requirements.map((req, idx) => (
        <span
          key={idx}
          className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-900"
        >
          {req}
        </span>
      ))}
    </div>
  </>
)}
  <div className="flex items-center space-x-1 text-green-500 font-medium">
            <CheckCircle className="h-5 w-5" />
            <span>Applied</span>
          </div>
</div>

              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                <BriefcaseBusiness className="mx-auto h-12 w-12" />
                <p className="mt-2">You haven’t applied to any jobs yet.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Apply Confirmation Modal */}
      {showApplyModal && pendingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              Confirm Application
            </h2>
            <p className="mb-6 text-gray-600">
              Did you apply to {pendingJob.title} at {pendingJob.company}?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={cancelApply}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmApply}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Yes, Applied
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Error Dialog */}
      {errorMessage && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full text-center">
      <h2 className="text-lg font-semibold mb-4 text-red-600">
        Application Failed
      </h2>
      <p className="mb-6 text-gray-700">
        {errorMessage}
      </p>
      <button
        onClick={() => setErrorMessage('')}
        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
      >
        Dismiss
      </button>
    </div>
  </div>
)}

    </div>
    
  );
};

// import { Briefcase as BriefcaseIcon, MapPin, DollarSign, Clock } from 'lucide-react';
// import { CheckCircle, Bookmark } from 'lucide-react';

const JobCard: React.FC<{ job: Job; onApply: (job: Job) => void }> = ({
  job,
  onApply,
}) => {
  // const { user } = useAuth()
  // make sure you’re pointing at the right field (“skill” vs “skills”)
  // const userSkills: string[] = user?.skills ?? []

  return(
  
  <div className="relative bg-white rounded-2xl shadow p-6 mb-6">
    {/* Score Badge */}
    {job.score !== undefined && (
      <span className="absolute top-6 right-6 inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
        {job.score}% Match
      </span>
    )}

    {/* Title, Company & Experience */}
    <div className="mb-2">
      <h3 className="text-2xl font-semibold text-gray-900">{job.title}</h3>
      <p className="text-sm text-gray-500 mb-1">{job.company}</p>
      
    </div>


    {/* Divider */}
    <hr className="border-gray-200 mb-3" />

    {job.experienceRequired && (
        <p className="text-sm font-semibold text-gray-600 mb-4">
          <BriefcaseBusiness className="inline-block h-4 w-4 mr-1 align-text-bottom" />
          Experience  :&nbsp;&nbsp;&nbsp;&nbsp;{job.experienceRequired}
        </p>
      )}

    {/* Requirements */}
{Array.isArray(job.requirements) && job.requirements.length > 0 && (
  <>
    <p className="text-sm font-semibold text-gray-500 mb-2">Requirements :</p>
    <div className="flex flex-wrap gap-2 mb-3">
      {job.requirements.map((req, idx) => (
        <span
          key={idx}
          className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-900"
        >
          {req}
        </span>
      ))}
    </div>
  </>
)}


    {/* Apply Button */}
    {job.link && (
      <button
        onClick={() => onApply(job)}
        className="inline-flex items-center px-5 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition"
      >
        <Bookmark className="h-5 w-5 mr-2" /> Apply Now
      </button>
    )}
  </div>
  )
};




export default JobsPage;