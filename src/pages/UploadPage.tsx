import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Scissors as CutIcon } from 'lucide-react';
import SimpleNavbar from '../components/SimpleNavbar';
import { parseResume } from '../api/api'; // ✅ Import the API method

const UploadPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    setError(null);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !user?.id) {
      setError('Please select a file and ensure you’re logged in.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const result = await parseResume(file, user.id); // ✅ Use API function
      const parsedSkills: string[] = Array.isArray(result.parsed_data.skills)
        ? result.parsed_data.skills
        : [];
      updateUser({ skills: parsedSkills });
      navigate('/profile');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to upload resume.');
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
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileChange}
            className="hidden"
          />

          {!file ? (
            <div
              className="border-2 border-dashed border-gray-300 p-6 rounded-lg mb-6 bg-gray-50 cursor-pointer"
              onClick={openFileDialog}
            >
              <div className="flex flex-col items-center text-gray-500">
                <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12v6m0 0l3-3m-3 3l-3-3m6-9h3a2 2 0 012 2v5m-6-7H6a2 2 0 00-2 2v5" />
                </svg>
                <span className="text-indigo-600 font-medium">Upload a file</span> or drag and drop<br />
                <span className="text-sm"> PDF only up to 10MB</span>
              </div>
            </div>
          ) : (
            <div className="mb-6 flex items-center justify-between bg-gray-100 p-4 rounded-lg">
              <p className="text-sm text-gray-700">{file.name}</p>
              <button
                type="button"
                onClick={openFileDialog}
                className="flex items-center text-indigo-600 hover:text-indigo-800"
              >
                <CutIcon className="h-5 w-5 mr-1" />
                Change File
              </button>
            </div>
          )}

          {error && (
            <div className="mb-4 text-red-600 flex items-center">
              <AlertCircle className="h-5 w-5 mr-1" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isUploading || !file}
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
