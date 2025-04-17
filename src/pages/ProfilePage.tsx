// src/pages/ProfilePage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Briefcase as BriefcaseBusiness,
  Upload as UploadIcon,
  ChevronRight
} from 'lucide-react';
import Navbar from '../components/Navbar';

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Fetch full profile from backend
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.email) return;
      try {
        const res = await fetch(
          `https://jobsy-uye6.onrender.com/profile?user_email=${encodeURIComponent(
            user.email
          )}`
        );
        const body = await res.json();
        if (res.ok) updateUser(body);
      } catch (err) {
        console.error('Profile fetch error', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user?.email, updateUser]);

  if (!user || loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-600">
        Loading Profile...
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
              <h3 className="text-lg font-medium text-gray-900">
                Profile Information
              </h3>
              <p className="text-sm text-gray-500">
                Personal details and skills
              </p>
            </div>
            <button
              onClick={() => navigate('/upload')}
              className="inline-flex items-center px-4 py-2 border rounded text-sm bg-white hover:bg-gray-50"
            >
              <UploadIcon className="h-4 w-4 mr-2" />
              Re-upload
            </button>
          </div>
          <div className="p-6 space-y-4">
            {/* Full Name */}
            <div>
              <dt className="text-sm font-medium text-gray-500">Full name</dt>
              <dd className="mt-1 text-gray-900">
                {user.full_name ?? 'N/A'}
              </dd>
            </div>

            {/* Phone Number */}
            <div>
              <dt className="text-sm font-medium text-gray-500">Phone number</dt>
              <dd className="mt-1 text-gray-900">
                {user.phone ?? 'Not provided'}
              </dd>
            </div>

            {/* Email */}
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Email address
              </dt>
              <dd className="mt-1 text-gray-900">{user.email}</dd>
            </div>

            {/* Skills */}
            <div>
              <dt className="text-sm font-medium text-gray-500">Skills</dt>
              <dd className="mt-1">
                {user.skills?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {user.skills.map((s, i) => (
                      <span
                        key={i}
                        className="px-3 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-sm"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-500">No skills found</span>
                )}
              </dd>
            </div>

            {/* Experience */}
            <div>
              <dt className="text-sm font-medium text-gray-500">Experience</dt>
              <dd className="mt-1">
                {user.experience?.length ? (
                  <ul className="divide-y">
                    {user.experience.map((exp, i) => (
                      <li key={i} className="py-2">
                        <strong>{exp.position}</strong> at {exp.company}
                        <div className="text-gray-500 text-sm">
                          {exp.duration}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-gray-500">No experience found</span>
                )}
              </dd>
            </div>

            {/* Education */}
            <div>
              <dt className="text-sm font-medium text-gray-500">Education</dt>
              <dd className="mt-1">
                {user.education?.length ? (
                  <ul className="divide-y">
                    {user.education.map((ed, i) => (
                      <li key={i} className="py-2">
                        <strong>{ed.degree}</strong> from {ed.institution}
                        <div className="text-gray-500 text-sm">
                          {ed.year}
                        </div>
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
