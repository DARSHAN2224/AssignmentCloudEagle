import React, { useState } from 'react';
import { Search, Github, Shield, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

type AccessReport = Record<string, string[]>;

function App() {
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AccessReport | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      // Assuming backend runs on 8080 during dev
      const response = await axios.get(`http://localhost:8080/api/reports/org/${orgName}`);
      setData(response.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError(`Organization '${orgName}' not found or accessible.`);
      } else {
        setError(err.message || 'An error occurred while fetching the report.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-indigo-600">
            <Shield className="w-8 h-8" />
            <h1 className="text-xl font-bold tracking-tight text-gray-900">GitHub Access Guardian</h1>
          </div>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-900 transition-colors"
          >
            <Github className="w-6 h-6" />
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-extrabold sm:text-4xl text-gray-900 mb-4 tracking-tight">
            Organization Access Report
          </h2>
          <p className="text-lg text-gray-600">
            Gain instant visibility into who has access to which repositories across your entire GitHub organization.
          </p>
        </div>

        <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-12">
          <div className="relative flex items-center shadow-sm rounded-xl overflow-hidden bg-white ring-1 ring-gray-200 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-4 py-4 sm:text-lg border-none focus:ring-0 text-gray-900 placeholder-gray-400 outline-none"
              placeholder="Enter GitHub organization name (e.g., netflix)..."
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !orgName.trim()}
              className={cn(
                "absolute right-2 top-2 bottom-2 px-6 rounded-lg font-medium transition-colors border border-transparent shadow-sm",
                loading || !orgName.trim()
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800"
              )}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate'}
            </button>
          </div>
          {error && (
            <div className="mt-4 p-4 rounded-xl bg-red-50 text-red-700 border border-red-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}
        </form>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
            <p className="text-lg font-medium">Scanning organization repositories...</p>
            <p className="text-sm">This may take a moment for large organizations.</p>
          </div>
        )}

        {data && Object.keys(data).length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No data found</h3>
            <p className="text-gray-500 mt-1">We couldn't find any repositories or collaborators for this organization.</p>
          </div>
        )}

        {data && Object.keys(data).length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Access Overview
              </h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                {Object.keys(data).length} Users Configured
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/4">
                      GitHub User
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Accessible Repositories
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(data).sort(([u1], [u2]) => u1.localeCompare(u2)).map(([user, repos]) => (
                    <tr key={user} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap align-top">
                        <div className="flex items-center gap-3">
                          <img 
                            src={`https://github.com/${user}.png?size=80`} 
                            alt={user}
                            className="w-10 h-10 rounded-full border border-gray-200 bg-gray-100"
                            loading="lazy"
                            onError={(e) => {
                               (e.target as HTMLImageElement).src = 'https://github.com/identicons/app/oauth_app/identicon/default.png';
                            }}
                          />
                          <div>
                            <span className="text-sm font-semibold text-gray-900 block">{user}</span>
                            <a 
                              href={`https://github.com/${user}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-900 hover:underline"
                            >
                              View Profile
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="flex flex-wrap gap-2">
                          {repos.sort().map((repo) => (
                            <span 
                              key={repo} 
                              className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-gray-100 text-gray-800 border border-gray-200 hover:border-gray-300 transition-colors cursor-default"
                              title={repo}
                            >
                              <Github className="w-3 h-3 mr-1.5 opacity-50" />
                              {repo.split('/')[1] || repo}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
