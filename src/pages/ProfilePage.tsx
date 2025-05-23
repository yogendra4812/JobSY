import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Briefcase as BriefcaseBusiness,
  Upload as UploadIcon,
  ChevronRight
} from 'lucide-react';
import Navbar from '../components/JobNavbar';
import { fetchProfile, Profile } from '../api/api';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        // Use only user.id from auth context to fetch profile
        const data = await fetchProfile(user!.id);
        setProfile(data);
      } catch (err) {
        setError('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };

    if (user && user.id) {
      getProfile();
    } else {
      setError('User not authenticated.');
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-600">
        Loading Profile...
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center text-red-600">
        {error}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-600">
        No profile data available.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200">
      <Navbar />
      <div className="max-w-7xl mx-auto py-12 px-4">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="flex justify-between items-center px-6 py-4 border-b">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
              <p className="text-sm text-gray-500">Personal details and skills</p>
            </div>
            <button
              onClick={() => navigate('/reupload')}
              className="inline-flex items-center px-4 py-2 border rounded text-sm bg-white hover:bg-gray-50"
            >
              <UploadIcon className="h-4 w-4 mr-2" />
              Re-upload
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Full name</dt>
              <dd className="mt-1 text-gray-900">{profile.full_name}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Phone number</dt>
              <dd className="mt-1 text-gray-900">{profile.phone}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Email address</dt>
              <dd className="mt-1 text-gray-900">{profile.email}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Skills</dt>
              <dd className="mt-1">
                {profile.skills.length ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((s, i) => (
                      <span key={i} className="px-3 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-sm">
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-500">No skills found</span>
                )}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Experience</dt>
              <dd className="mt-1">
                {profile.experience.length ? (
                  <ul className="divide-y">
                    {profile.experience.map((exp, i) => (
                      <li key={i} className="py-2">
                        <strong>{exp.position}</strong> at {exp.company}
                        <div className="text-gray-500 text-sm">{exp.duration}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-gray-500">No experience found</span>
                )}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Education</dt>
              <dd className="mt-1">
                {profile.education.length ? (
                  <ul className="divide-y">
                    {profile.education.map((ed, i) => (
                      <li key={i} className="py-2">
                        <div className="flex justify-between">
                          <strong>{ed.degree}</strong>
                          {ed.score && <span className="text-sm text-gray-600">Score: {ed.score}</span>}
                        </div>
                        <div>from {ed.institution}</div>
                        <div className="text-gray-500 text-sm">{ed.year}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-gray-500">No education found</span>
                )}
              </dd>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/jobs')}
            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            <BriefcaseBusiness className="h-5 w-5 mr-2" />
            See Job Recommendations
            <ChevronRight className="h-5 w-5 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;