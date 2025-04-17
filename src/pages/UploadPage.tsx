import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle } from 'lucide-react';
import SimpleNavbar from '../components/SimpleNavbar';

const UploadPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !user?.id) {
      setError('Please select a PDF and ensure you’re logged in.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const url = `https://jobsy-uye6.onrender.com/get-parse-resume?user_id=${encodeURIComponent(
        user.id
      )}`;

      const res = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      const body = await res.json();
      console.log('Upload response:', body);

      if (!res.ok) {
        const msg =
          typeof body.error === 'string'
            ? body.error
            : typeof body.detail === 'string'
            ? body.detail
            : JSON.stringify(body);
        setError(msg);
        return;
      }

      updateUser(body.parsed_data);
      navigate('/profile');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Server error. Please try again later.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <SimpleNavbar />

      <div className="max-w-2xl mx-auto text-center py-16 px-4">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Upload Your Resume</h1>
        <p className="text-gray-600 text-base mb-10">
          We'll analyze your resume to find the best job matches for your skills and experience.
        </p>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md">
          <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg mb-6 bg-gray-50">
            <label className="cursor-pointer block">
              <div className="flex flex-col items-center text-gray-500">
                <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12v6m0 0l3-3m-3 3l-3-3m6-9h3a2 2 0 012 2v5m-6-7H6a2 2 0 00-2 2v5" />
                </svg>
                <span className="text-indigo-600 font-medium">Upload a file</span> or drag and drop<br />
                <span className="text-sm"> PDF only up to 10MB</span>
              </div>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {file && <p className="text-sm text-gray-700 mb-4">Selected file: {file.name}</p>}

          {error && (
            <div className="mb-4 text-red-600 flex items-center">
              <AlertCircle className="h-5 w-5 mr-1" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isUploading}
            className="w-full bg-indigo-500 text-white py-2 rounded hover:bg-indigo-600 disabled:opacity-50"
          >
            {isUploading ? 'Processing...' : 'Analyze Resume'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadPage;
