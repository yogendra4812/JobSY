// src/pages/JobsPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Briefcase as BriefcaseBusiness,
  ChevronLeft,
  CheckCircle,
  Clock,
  MapPin,
  DollarSign,
  Bookmark,
  BookmarkCheck
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { Job } from '../types';

const JobsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'recommended' | 'applied'>('recommended');

  // Fetch jobs on mount
  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);

    fetch(`https://jobsy-uye6.onrender.com/get-all-jobs?user_id=${encodeURIComponent(user.id)}`)
      .then(res => res.json())
      .then(body => {
        if (Array.isArray(body)) {
          const jobs: Job[] = body.map((j: any) => ({
            id: j._id,
            title: j.title,
            company: j.company,
            location: j.location,
            salary: j.salary,
            postedDate: j.postedDate,
            description: j.description,
            requirements: j.requirements,
            matchingSkills: j.matchingSkills,
            applied: !!j.applied
          }));
          setAllJobs(jobs);
        } else {
          setAllJobs([]);
        }
      })
      .catch(err => {
        console.error('Error fetching jobs:', err);
        setAllJobs([]);
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  // Mark a job applied
  const handleApplyJob = async (jobId: string) => {
    if (!user?.id) return;
    try {
      const res = await fetch(
        `https://jobsy-uye6.onrender.com/apply-job?user_id=${encodeURIComponent(
          user.id
        )}&job_id=${encodeURIComponent(jobId)}`,
        { method: 'PUT' }
      );
      if (res.ok) {
        setAllJobs(prev =>
          prev.map(job =>
            job.id === jobId ? { ...job, applied: true } : job
          )
        );
      }
    } catch (err) {
      console.error('Error applying job:', err);
    }
  };

  const recommendedJobs = allJobs.filter(j => !j.applied);
  const appliedJobs = allJobs.filter(j => j.applied);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-600">
        Loading jobs...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200">
      <Navbar />

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header with Back button */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Job Recommendations</h1>
          <button
            onClick={() => navigate('/profile')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium bg-white hover:bg-gray-50"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Profile
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="hidden sm:block">
            <div className="border-b border-gray-200">
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

        {/* Job Cards or Empty State */}
        <div className="space-y-6">
          {(activeTab === 'recommended' ? recommendedJobs : appliedJobs).length > 0 ? (
            (activeTab === 'recommended' ? recommendedJobs : appliedJobs).map(job => (
              <div key={job.id} className="bg-white shadow sm:rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{job.title}</h3>
                    <p className="mt-1 text-sm text-gray-500">{job.company}</p>
                  </div>
                  {job.applied && (
                    <span className="inline-flex items-center px-3 py-0.5 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Applied
                    </span>
                  )}
                </div>

                <div className="border-t border-gray-200 px-4 py-5 sm:px-6 space-y-4">
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {job.location}
                    </div>
                    {job.salary && (
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        {job.salary}
                      </div>
                    )}
                    {job.postedDate && (
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Posted on {job.postedDate}
                      </div>
                    )}
                  </div>
                  {job.description && (
                    <p className="text-sm text-gray-500">{job.description}</p>
                  )}

                  {activeTab === 'recommended' && (
                    <button
                      onClick={() => handleApplyJob(job.id)}
                      disabled={job.applied}
                      className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                        job.applied
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      {job.applied ? (
                        <>
                          <BookmarkCheck className="h-4 w-4 mr-2" />
                          Applied
                        </>
                      ) : (
                        <>
                          <Bookmark className="h-4 w-4 mr-2" />
                          Apply Now
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              <BriefcaseBusiness className="mx-auto h-12 w-12" />
              <p className="mt-2">
                {activeTab === 'recommended'
                  ? "No recommended jobs available."
                  : "You haven't applied to any jobs yet."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobsPage;
