import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, type Location } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Briefcase as BriefcaseBusiness,
  CheckCircle,
  Bookmark,
} from 'lucide-react';
import Navbar from '../components/ProNavbar';
import { Job } from '../types';

interface LocationState {
  pendingApply?: boolean;
  job?: Job;
}

const predefinedRoles = [
  'Python Developer',
  'Software Developer',
  'Web Designer',
  'UI/UX Designer'
];

const JobsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as Location & { state?: LocationState };

  const [locationFilter, setLocationFilter] = useState<string>('');
  const [customRoleMode, setCustomRoleMode] = useState<boolean>(false);
  const [customRoleInput, setCustomRoleInput] = useState<string>('');

  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [recommendedJobsByRole, setRecommendedJobsByRole] = useState<Record<string, Job[]>>({});
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [findingJobs, setFindingJobs] = useState(false);
  const [activeTab, setActiveTab] = useState<'recommended' | 'applied'>('recommended');

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [pendingJob, setPendingJob] = useState<Job | null>(null);

  const apiBase = 'https://jobsy-uye6.onrender.com';

  // Compute how many recommendation jobs are currently shown
  const recommendedCount = selectedRoles.length > 0
    ? selectedRoles.reduce(
        (sum, role) => sum + (recommendedJobsByRole[role]?.length || 0),
        0
      )
    : recommendedJobs.length;

  // --- FETCH FUNCTIONS ---

  const fetchRecommendedJobs = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(
        `${apiBase}/recommended-jobs?user_id=${encodeURIComponent(user.id)}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.id}`
          }
        }
      );
      const data = await res.json();
      if (Array.isArray(data.recommended_jobs)) {
        setRecommendedJobs(data.recommended_jobs.map((j: any) => ({
          id: j.id,
          title: j.title,
          company: j.company,
          description: j.description,
          requirements: j.requirements,
          matchingSkills: j.matchingSkills,
          experienceRequired: j.experience_required,
          score: j.score,
          link: j.link,
          applied: !!j.applied
        })));
      } else {
        setRecommendedJobs([]);
      }
    } catch {
      setRecommendedJobs([]);
    }
  };

  const fetchJobsByRole = async (role: string) => {
    try {
      setFindingJobs(true);
      const res = await fetch(
        `${apiBase}/jobs-by-role?job_role=${encodeURIComponent(role)}`
      );
      const data = await res.json();
      const jobs = Array.isArray(data.jobs)
        ? data.jobs.map((j: any) => ({
            id: j.id,
            title: j.title,
            company: j.company,
            description: j.description,
            requirements: j.requirements,
            matchingSkills: j.matchingSkills,
            experienceRequired: j.experience_required,
            score: j.score,
            link: j.link,
            applied: !!j.applied
          }))
        : [];
      setRecommendedJobsByRole(prev => ({
        ...prev,
        [role]: jobs
      }));
    } catch {
      setRecommendedJobsByRole(prev => ({
        ...prev,
        [role]: []
      }));
    } finally {
      setFindingJobs(false);
    }
  };

  const fetchAppliedJobs = async () => {
  if (!user?.id) return;
  try {
    const res = await fetch(
      `${apiBase}/applied-jobs?user_id=${encodeURIComponent(user.id)}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`
        }
      }
    );
    const data = await res.json();
    if (Array.isArray(data.applied_jobs)) {
      setAppliedJobs(data.applied_jobs.map((j: any) => ({
        id: j._id,
        title: j.title,
        company: j.company,
        location: j.location,
        salary: j.salary,
        postedDate: j.postedDate,
        description: j.description,
        requirements: j.requirements,
        matchingSkills: j.matchingSkills,
        experienceRequired: j.experience_required,
        score: j.score,
        link: j.link,
        applied: true
      })));
    } else {
      setAppliedJobs([]);
    }
  } catch (err) {
    console.error('Error fetching applied jobs:', err);
    setAppliedJobs([]);
  }
};

  // --- EFFECTS ---

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    (async () => {
      await Promise.all([fetchRecommendedJobs(), fetchAppliedJobs()]);
      setLoading(false);

      const pending = sessionStorage.getItem('pendingApplyJob');
      const confirmed = sessionStorage.getItem('applyConfirmed');
      if (pending && confirmed !== 'true') {
        setPendingJob(JSON.parse(pending));
        setShowApplyModal(true);
      }
    })();
  }, [user?.id]);

  // --- HANDLERS ---

  const handleRoleToggle = (role: string) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(prev => prev.filter(r => r !== role));
      setRecommendedJobsByRole(prev => {
        const copy = { ...prev };
        delete copy[role];
        return copy;
      });
    } else {
      setSelectedRoles(prev => [...prev, role]);
      fetchJobsByRole(role);
      setActiveTab('recommended');
    }
  };

  const handleOtherClick = () => {
    setCustomRoleMode(true);
  };

  const handleAddCustomRole = () => {
    const role = customRoleInput.trim();
    if (!role) return;
    handleRoleToggle(role);
    setCustomRoleInput('');
    setCustomRoleMode(false);
  };

  const handleApplyLink = (job: Job) => {
    sessionStorage.setItem('pendingApplyJob', JSON.stringify(job));
    sessionStorage.setItem('applyConfirmed', 'false');
    // Open external link in a new tab so our page stays mounted
    window.open(job.link!, '_blank');
  };

  useEffect(() => {
    const checkPending = () => {
      const pending = sessionStorage.getItem('pendingApplyJob');
      const confirmed = sessionStorage.getItem('applyConfirmed');
      if (pending && confirmed !== 'true') {
        setPendingJob(JSON.parse(pending));
        setShowApplyModal(true);
      }
    };
  
    window.addEventListener('focus', checkPending);
    return () => window.removeEventListener('focus', checkPending);
  }, []);

  const confirmApply = async () => {
  if (pendingJob && user?.id) {
    try {
      const res = await fetch(
        `${apiBase}/apply-job?user_id=${encodeURIComponent(user.id)}&job_id=${encodeURIComponent(pendingJob.id)}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.id}`
          }
        }
      );
      if (res.ok) {
        // ... update local state as before
        await fetchAppliedJobs(); // re-sync applied list
      }
    } catch (err) {
      console.error(err);
    }
  }

  sessionStorage.setItem('applyConfirmed', 'true');
  sessionStorage.removeItem('pendingApplyJob');
  setShowApplyModal(false);
  setPendingJob(null);
};


  const cancelApply = () => {
    sessionStorage.removeItem('pendingApplyJob');
    setShowApplyModal(false);
    setPendingJob(null);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-600">
        {findingJobs ? 'Finding jobs...' : 'Loading jobs...'}
      </div>
    );
  }

  const hasRoleSelection = selectedRoles.length > 0;

  return (
    <div className="min-h-screen bg-gray-200">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Job Recommendations</h1>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Location (optional)"
            value={locationFilter}
            onChange={e => setLocationFilter(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {predefinedRoles.map(role => (
            <button
              key={role}
              onClick={() => handleRoleToggle(role)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                selectedRoles.includes(role)
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
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
            }`}
          >
            Other Role
          </button>
        </div>

        {customRoleMode && (
          <div className="mb-4 flex gap-2">
            <input
              type="text"
              placeholder="Enter Job Role"
              value={customRoleInput}
              onChange={e => setCustomRoleInput(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md"
            />
            <button
              onClick={handleAddCustomRole}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              {selectedRoles.includes(customRoleInput.trim()) ? 'Remove' : 'Add'}
            </button>
          </div>
        )}

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
              onChange={e => setActiveTab(e.target.value as any)}
            >
              <option value="recommended">Recommended ({recommendedCount})</option>
              <option value="applied">Applied ({appliedJobs.length})</option>
            </select>
          </div>
        </div>

        {activeTab === 'recommended' ? (
          <div className="space-y-6">
            {hasRoleSelection ? (
              selectedRoles.map(role => {
                const jobs = recommendedJobsByRole[role] || [];
                return (
                  <div key={role}>
                    {selectedRoles.length > 1 && (
                      <h2 className="text-2xl font-semibold text-gray-800 mb-4">{role}</h2>
                    )}
                    {jobs.length > 0 ? (
                      jobs.map(job => (
                        <div key={job.id} className="relative bg-white rounded-lg shadow p-6 mb-4">
                          {job.score !== undefined && (
                            <span className="absolute top-4 right-4 inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded bg-indigo-100 text-indigo-800">
                              {job.score}% Match
                            </span>
                          )}
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                              <p className="mt-1 text-sm text-gray-500">{job.company}</p>
                            </div>
                          </div>
                          {job.experienceRequired && (
                            <div className="flex items-center text-sm text-gray-700 mb-2">
                              <BriefcaseBusiness className="h-4 w-4 mr-1" />
                              Experience: {job.experienceRequired}
                            </div>
                          )}
                          {job.description && <p className="text-gray-700 text-sm mb-4">{job.description}</p>}
                          {Array.isArray(job.requirements) && job.requirements.length > 0 && (
                            <>
                              <p className="text-sm font-semibold text-gray-700 mb-2">Requirements</p>
                              <div className="flex flex-wrap gap-2 mb-4">
                                {job.requirements.map((req, idx) => {
                                  const matched = Array.isArray(job.matchingSkills) && job.matchingSkills.includes(req);
                                  return (
                                    <span
                                      key={idx}
                                      className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${
                                        matched ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                                      }`}
                                    >
                                      {matched && <CheckCircle className="h-4 w-4" />}
                                      <span>{req}</span>
                                    </span>
                                  );
                                })}
                              </div>
                            </>
                          )}
                          {job.link && (
                            <button
                              onClick={() => handleApplyLink(job)}
                              className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                            >
                              <Bookmark className="h-4 w-4 mr-2" />Apply Now
                            </button>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 italic">No jobs found for “{role}.”</p>
                    )}
                  </div>
                );
              })
            ) : recommendedJobs.length > 0 ? (
              recommendedJobs.map(job => (
                <div key={job.id} className="relative bg-white rounded-lg shadow p-6">
                  {job.score !== undefined && (
                    <span className="absolute top-4 right-4 inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded bg-indigo-100 text-indigo-800">
                      {job.score}% Match
                    </span>
                  )}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                      <p className="mt-1 text-sm text-gray-500">{job.company}</p>
                    </div>
                  </div>
                  {job.experienceRequired && (
                    <div className="flex items-center text-sm text-gray-700 mb-2">
                      <BriefcaseBusiness className="h-4 w-4 mr-1" />
                      Experience: {job.experienceRequired}
                    </div>
                  )}
                  {job.description && <p className="text-gray-700 text-sm mb-4">{job.description}</p>}
                  {Array.isArray(job.requirements) && job.requirements.length > 0 && (
                    <>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Requirements</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {job.requirements.map((req, idx) => {
                          const matched = Array.isArray(job.matchingSkills) && job.matchingSkills.includes(req);
                          return (
                            <span
                              key={idx}
                              className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${
                                matched ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {matched && <CheckCircle className="h-4 w-4" />}
                              <span>{req}</span>
                            </span>
                          );
                        })}
                      </div>
                    </>
                  )}
                  {job.link && (
                    <button
                      onClick={() => handleApplyLink(job)}
                      className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      <Bookmark className="h-4 w-4 mr-2" />Apply Now
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                <BriefcaseBusiness className="mx-auto h-12 w-12" />
                <p className="mt-2">No recommended jobs available.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {appliedJobs.length > 0 ? (
              appliedJobs.map(job => (
                <div key={job.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                      <p className="mt-1 text-sm text-gray-500">{job.company}</p>
                    </div>
                    <span className="inline-flex items-center text-sm text-green-600">
                      <CheckCircle className="h-5 w-5 mr-1" /> Applied
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm mb-4">{job.description}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                <BriefcaseBusiness className="mx-auto h-12 w-12" />
                <p className="mt-2">You haven't applied to any jobs yet.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showApplyModal && pendingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Confirm Application</h2>
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
    </div>
  );
};

export default JobsPage;
