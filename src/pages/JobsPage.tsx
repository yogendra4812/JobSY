import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, type Location } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Briefcase as BriefcaseBusiness,
  CheckCircle,
  Bookmark
} from 'lucide-react';
import Navbar from '../components/ProNavbar';
import { Job } from '../types';

interface LocationState {
  pendingApply?: boolean;
  job?: Job;
}

const JobsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as Location & { state?: LocationState };

  const initialRole = user?.preferredRoles?.[0] || '';
  const [jobRole, setJobRole] = useState<string>(initialRole);
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [findingJobs, setFindingJobs] = useState(false);
  const [activeTab, setActiveTab] = useState<'recommended' | 'applied'>('recommended');

  // modal state for apply confirmation
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [pendingJob, setPendingJob] = useState<Job | null>(null);

  const apiBase = 'http://127.0.0.1:8000';

  const fetchRecommendedJobs = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(
        `${apiBase}/get-all-jobs?user_id=${encodeURIComponent(user.id)}`
      );
      const data = await res.json();
      const jobs: Job[] = Array.isArray(data)
        ? data.map((j: any) => ({
            id: j._id,
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
      setRecommendedJobs(jobs.filter(j => !j.applied));
    } catch {
      setRecommendedJobs([]);
    }
  };

  const fetchAppliedJobs = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(
        `${apiBase}/applied-jobs?user_id=${encodeURIComponent(user.id)}`
      );
      const data = await res.json();
      const apps: Job[] = Array.isArray(data.applied_jobs)
        ? data.applied_jobs.map((j: any) => ({
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
          }))
        : [];
      setAppliedJobs(apps);
    } catch {
      setAppliedJobs([]);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    (async () => {
      await Promise.all([fetchRecommendedJobs(), fetchAppliedJobs()]);
      setLoading(false);

      // check if returning from external apply
      const pending = sessionStorage.getItem('pendingApplyJob');
      if (pending) {
        const job: Job = JSON.parse(pending);
        setPendingJob(job);
        setShowApplyModal(true);
      }
    })();
  }, [user?.id]);

  const handleFindJobs = async () => {
    if (!user?.id) return;
    if (!jobRole.trim()) {
      alert('Please enter a Job Role to find jobs.');
      return;
    }
    setFindingJobs(true);
    setLoading(true);
    try {
      await fetch(
        `${apiBase}/find-jobs?user_id=${encodeURIComponent(user.id)}` +
          `&job_role=${encodeURIComponent(jobRole)}` +
          `&location=${encodeURIComponent(locationFilter)}`,
        { method: 'POST' }
      );
      await Promise.all([fetchRecommendedJobs(), fetchAppliedJobs()]);
    } catch {
    } finally {
      setLoading(false);
      setFindingJobs(false);
    }
  };

  const handleApplyJob = async (jobId: string, showAlert = true) => {
    if (!user?.id) return;
    try {
      const res = await fetch(
        `${apiBase}/apply-job?user_id=${encodeURIComponent(user.id)}` +
          `&job_id=${encodeURIComponent(jobId)}`,
        { method: 'PUT' }
      );
      if (res.ok) {
        await Promise.all([fetchRecommendedJobs(), fetchAppliedJobs()]);
        if (showAlert) alert('Applied successfully!');
      }
    } catch {}
  };

  // open link in new tab
  const handleApplyLink = (job: Job) => {
    sessionStorage.setItem('pendingApplyJob', JSON.stringify(job));
    window.open(job.link!, '_blank');
  };

  const confirmApply = async () => {
    if (pendingJob) {
      await handleApplyJob(pendingJob.id, false);
      alert(`Job application for ${pendingJob.title} recorded.`);
    }
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

  const currentList = activeTab === 'recommended' ? recommendedJobs : appliedJobs;

  return (
    <div className="min-h-screen bg-gray-200">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Job Recommendations</h1>

        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Job Role"
            value={jobRole}
            onChange={e => setJobRole(e.target.value)}
            className="px-3 py-2 border rounded-md"
          />
          <input
            type="text"
            placeholder="Location (optional)"
            value={locationFilter}
            onChange={e => setLocationFilter(e.target.value)}
            className="px-3 py-2 border rounded-md"
          />
          <button
            onClick={handleFindJobs}
            disabled={!jobRole.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            Find Jobs
          </button>
        </div>

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
                Recommended ({recommendedJobs.length})
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
              <option value="recommended">Recommended ({recommendedJobs.length})</option>
              <option value="applied">Applied ({appliedJobs.length})</option>
            </select>
          </div>
        </div>

        <div className="space-y-6">
          {currentList.length > 0 ? (
            currentList.map(job => (
              <div key={job.id} className="relative bg-white rounded-lg shadow p-6">
                {activeTab === 'recommended' && job.score !== undefined && (
                  <span className="absolute top-4 right-4 inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded bg-indigo-100 text-indigo-800">
                    {job.score}% Match
                  </span>
                )}
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                  <p className="text-sm text-gray-500">{job.company}</p>
                </div>
                {job.experienceRequired && (
                  <div className="flex items-center text-sm text-gray-700 mb-2">
                    <BriefcaseBusiness className="h-4 w-4 mr-1" />
                    Experience: {job.experienceRequired}
                  </div>
                )}
                {job.description && <p className="text-gray-700 text-sm mb-4">{job.description}</p>}
                {job.requirements && job.requirements.length > 0 && (
                  <>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Requirements</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.requirements.map((req, idx) => {
                        const matched =
                          Array.isArray(job.matchingSkills) && job.matchingSkills.includes(req);
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
                {activeTab === 'recommended' && job.link && (
                  <button
                    onClick={() => handleApplyLink(job)}
                    className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Bookmark className="h-4 w-4 mr-2" />
                    Apply Now
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              <BriefcaseBusiness className="mx-auto h-12 w-12" />
              <p className="mt-2">
                {activeTab === 'recommended'
                  ? 'No recommended jobs available.'
                  : "You haven't applied to any jobs yet."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Apply Confirmation Modal */}
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
