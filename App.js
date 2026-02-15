import React, { useState, useEffect, useRef } from 'react';
import { Shield, AlertTriangle, Search, Plus, Trash2, Eye, Activity, TrendingUp, Database, Zap, BookOpen, Camera, FileText, HardDrive, Clock, CheckCircle, XCircle, RefreshCw, BarChart3, LogOut, Lock } from 'lucide-react';

// Dynamic API detection for production
const API_URL = window.location.protocol === 'https:' ? '/api' : 'http://localhost:5000/api';

const PhishingDefenseDashboard = () => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  // App state
  const [activeTab, setActiveTab] = useState('offense');
  const [pastDomains, setPastDomains] = useState('combank-support.net\ncombank-verify.com\ncombankdigital-secure.net');
  const [predictedDomains, setPredictedDomains] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [newWatchlistDomain, setNewWatchlistDomain] = useState('');
  const [alerts, setAlerts] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const monitoringInterval = useRef(null);
  const [lastScanTime, setLastScanTime] = useState(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [historicalData, setHistoricalData] = useState([]);
  const [serverStatus, setServerStatus] = useState('checking');
  const [config, setConfig] = useState(null);
  const [selectedDomain, setSelectedDomain] = useState(null);

  const commonPhishingKeywords = [
    'secure', 'login', 'verify', 'account', 'support', 'banking',
    'auth', 'update', 'confirm', 'service', 'portal', 'access',
    'client', 'user', 'help', 'protect', 'safety'
  ];

  const tlds = ['.com', '.net', '.org', '.co', '.io', '.online', '.site', '.info'];

  // Check authentication on mount
  useEffect(() => {
    const token = sessionStorage.getItem('authToken');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  // Load data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      checkServerStatus();
      loadConfig();
      loadHistoricalData();
      loadWatchlist();
    }
  }, [isAuthenticated]);

  // Auth functions
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });

      const data = await response.json();

      if (response.ok) {
        sessionStorage.setItem('authToken', data.token);
        setIsAuthenticated(true);
      } else {
        setLoginError(data.error || 'Login failed');
      }
    } catch (error) {
      setLoginError('Connection error. Please check if backend is running.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('authToken');
    setIsAuthenticated(false);
    setLoginForm({ username: '', password: '' });
  };

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
  });

  // API functions with auth
  const checkServerStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/health`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        setServerStatus('connected');
      } else if (response.status === 401) {
        handleLogout();
      } else {
        setServerStatus('error');
      }
    } catch (error) {
      setServerStatus('disconnected');
    }
  };

  const loadConfig = async () => {
    try {
      const response = await fetch(`${API_URL}/config`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  };

  const loadHistoricalData = async () => {
    try {
      const response = await fetch(`${API_URL}/historical`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setHistoricalData(data);
      }
    } catch (error) {
      console.error('Failed to load historical data:', error);
    }
  };

  const loadWatchlist = async () => {
    try {
      const response = await fetch(`${API_URL}/domains`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setWatchlist(data.domains || []);
      }
    } catch (error) {
      console.error('Failed to load watchlist:', error);
    }
  };

  const refreshBaseline = async () => {
    try {
      const response = await fetch(`${API_URL}/baseline/refresh`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        alert('Baseline refreshed successfully!');
        loadConfig();
      }
    } catch (error) {
      alert('Failed to refresh baseline');
    }
  };

  const generatePredictedDomains = () => {
    const domains = pastDomains.split('\n').filter(d => d.trim());
    if (domains.length === 0) {
      setPredictedDomains([]);
      return;
    }

    const baseName = 'combank';
    const predicted = new Set();

    commonPhishingKeywords.forEach(keyword => {
      tlds.slice(0, 4).forEach(tld => {
        predicted.add(`${baseName}-${keyword}${tld}`);
        predicted.add(`${baseName}${keyword}${tld}`);
        predicted.add(`${keyword}-${baseName}${tld}`);
      });
    });

    setPredictedDomains(Array.from(predicted).slice(0, 20));
  };

  const addToWatchlist = async (domain) => {
    if (!domain.trim()) return;

    try {
      const response = await fetch(`${API_URL}/domains`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ domain: domain.trim() })
      });

      if (response.ok) {
        loadWatchlist();
        setNewWatchlistDomain('');
      }
    } catch (error) {
      console.error('Failed to add domain:', error);
    }
  };

  const removeFromWatchlist = async (domain) => {
    try {
      const response = await fetch(`${API_URL}/domains/${encodeURIComponent(domain)}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        loadWatchlist();
      }
    } catch (error) {
      console.error('Failed to remove domain:', error);
    }
  };

  const scanDomain = async (domain) => {
    try {
      const response = await fetch(`${API_URL}/check/${encodeURIComponent(domain)}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const result = await response.json();
        loadWatchlist();
        setLastScanTime(new Date());
        
        if (result.similarity >= 75) {
          setAlerts(prev => [...prev, {
            domain,
            similarity: result.similarity,
            timestamp: new Date(),
            details: result.details
          }]);
        }
        
        return result;
      }
    } catch (error) {
      console.error('Failed to scan domain:', error);
    }
  };

  const startMonitoring = async () => {
    setIsMonitoring(true);
    
    try {
      await fetch(`${API_URL}/start-monitoring`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
    } catch (error) {
      console.error('Failed to start monitoring:', error);
    }
  };

  const stopMonitoring = async () => {
    setIsMonitoring(false);
    
    try {
      await fetch(`${API_URL}/stop-monitoring`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
    } catch (error) {
      console.error('Failed to stop monitoring:', error);
    }
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-md border border-gray-700">
          <div className="text-center mb-8">
            <Shield className="text-blue-400 mx-auto mb-4" size={64} />
            <h1 className="text-3xl font-bold text-white mb-2">Phishing Defense Platform</h1>
            <p className="text-gray-400">Enhanced Detection System</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2 font-medium">Username</label>
              <input
                type="text"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter username"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2 font-medium">Password</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter password"
                required
              />
            </div>

            {loginError && (
              <div className="bg-red-500 bg-opacity-20 border border-red-500 rounded-lg p-3 text-red-300 text-sm">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
            >
              <Lock size={20} />
              Login
            </button>
          </form>

          <div className="mt-6 text-center text-gray-400 text-sm">
            Default: admin / phishdish
          </div>
        </div>
      </div>
    );
  }

  // Status Badge Component
  const StatusBadge = ({ status }) => {
    const config = {
      connected: { color: 'bg-green-500', text: 'ONLINE', icon: CheckCircle },
      disconnected: { color: 'bg-red-500', text: 'OFFLINE', icon: XCircle },
      checking: { color: 'bg-yellow-500', text: 'CHECKING', icon: Clock }
    };

    const { color, text, icon: Icon } = config[status] || config.checking;

    return (
      <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${color} text-white text-sm font-semibold`}>
        <Icon size={16} />
        {text}
      </div>
    );
  };

  // Threat Badge Component
  const ThreatBadge = ({ similarity }) => {
    if (similarity >= 85) {
      return <span className="px-3 py-1 bg-red-600 text-white rounded-full text-sm font-bold">CRITICAL</span>;
    } else if (similarity >= 70) {
      return <span className="px-3 py-1 bg-orange-500 text-white rounded-full text-sm font-bold">WARNING</span>;
    } else if (similarity >= 55) {
      return <span className="px-3 py-1 bg-yellow-500 text-white rounded-full text-sm font-bold">SUSPICIOUS</span>;
    } else if (similarity > 0) {
      return <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-bold">LOW</span>;
    } else {
      return <span className="px-3 py-1 bg-gray-500 text-white rounded-full text-sm font-bold">PENDING</span>;
    }
  };

  // Main Dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="text-blue-400" size={32} />
              <div>
                <h1 className="text-2xl font-bold text-white">Enhanced Phishing Defense</h1>
                <p className="text-gray-400 text-sm">5-Method Real-Time Detection System</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <StatusBadge status={serverStatus} />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {['offense', 'analysis', 'monitoring', 'baseline', 'settings'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-medium transition-all capitalize ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Offense Tab */}
        {activeTab === 'offense' && (
          <div className="space-y-6">
            {/* Domain Prediction */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="text-blue-400" />
                Predict Phishing Domains
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2">Past Detected Domains (one per line)</label>
                  <textarea
                    value={pastDomains}
                    onChange={(e) => setPastDomains(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={5}
                  />
                </div>
                <button
                  onClick={generatePredictedDomains}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
                >
                  Generate Predictions
                </button>
                
                {predictedDomains.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold text-white mb-3">Predicted Domains ({predictedDomains.length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {predictedDomains.map((domain, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                          <span className="text-white">{domain}</span>
                          <button
                            onClick={() => addToWatchlist(domain)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-all"
                          >
                            Add to Watchlist
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Watchlist */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Database className="text-blue-400" />
                Active Watchlist ({watchlist.length})
              </h2>
              
              <div className="flex gap-3 mb-4">
                <input
                  type="text"
                  value={newWatchlistDomain}
                  onChange={(e) => setNewWatchlistDomain(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addToWatchlist(newWatchlistDomain)}
                  placeholder="Enter domain to monitor..."
                  className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => addToWatchlist(newWatchlistDomain)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
                >
                  <Plus size={20} />
                  Add
                </button>
              </div>

              <div className="space-y-3">
                {watchlist.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Search size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No domains in watchlist</p>
                  </div>
                ) : (
                  watchlist.map((item) => (
                    <div
                      key={item.domain}
                      className="bg-gray-700 rounded-lg p-4 flex items-center justify-between hover:bg-gray-600 transition-all"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">{item.domain}</h3>
                          <ThreatBadge similarity={item.similarity || 0} />
                        </div>
                        {item.similarity > 0 && (
                          <div className="space-y-1 text-sm">
                            <p className="text-gray-300">
                              Similarity: <span className="font-semibold text-white">{item.similarity}%</span>
                            </p>
                            <p className="text-gray-400">
                              Last checked: {item.last_checked ? new Date(item.last_checked).toLocaleString() : 'Never'}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => scanDomain(item.domain)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
                        >
                          <Search size={16} />
                          Scan
                        </button>
                        <button
                          onClick={() => setSelectedDomain(item)}
                          className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-medium transition-all flex items-center gap-2"
                        >
                          <Eye size={16} />
                          Details
                        </button>
                        <button
                          onClick={() => removeFromWatchlist(item.domain)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Analysis Tab */}
        {activeTab === 'analysis' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="text-blue-400" />
                Detection Analysis
              </h2>
              <p className="text-gray-300 mb-4">
                This view shows the detailed breakdown of the 5-method detection engine for each monitored domain.
              </p>
              
              {watchlist.filter(d => d.details).length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No detection data available yet</p>
                  <p className="text-sm mt-2">Scan domains to see detailed analysis</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {watchlist.filter(d => d.details).map((item) => (
                    <div key={item.domain} className="bg-gray-700 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white">{item.domain}</h3>
                        <ThreatBadge similarity={item.similarity} />
                      </div>
                      
                      {item.details && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-gray-800 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-gray-300">Visual Similarity</span>
                              <span className="text-white font-bold">{item.details.visualSimilarity}%</span>
                            </div>
                            <div className="w-full bg-gray-600 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full" 
                                style={{ width: `${item.details.visualSimilarity}%` }}
                              />
                            </div>
                          </div>

                          <div className="bg-gray-800 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-gray-300">Text Similarity</span>
                              <span className="text-white font-bold">{item.details.textSimilarity}%</span>
                            </div>
                            <div className="w-full bg-gray-600 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full" 
                                style={{ width: `${item.details.textSimilarity}%` }}
                              />
                            </div>
                          </div>

                          <div className="bg-gray-800 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-gray-300">DOM Similarity</span>
                              <span className="text-white font-bold">{item.details.domSimilarity}%</span>
                            </div>
                            <div className="w-full bg-gray-600 rounded-full h-2">
                              <div 
                                className="bg-purple-500 h-2 rounded-full" 
                                style={{ width: `${item.details.domSimilarity}%` }}
                              />
                            </div>
                          </div>

                          <div className="bg-gray-800 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-gray-300">Keyword Match</span>
                              <span className="text-white font-bold">{item.details.keywordSimilarity}%</span>
                            </div>
                            <div className="w-full bg-gray-600 rounded-full h-2">
                              <div 
                                className="bg-yellow-500 h-2 rounded-full" 
                                style={{ width: `${item.details.keywordSimilarity}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Monitoring Tab */}
        {activeTab === 'monitoring' && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Activity className="text-blue-400" />
              Automated Monitoring
            </h2>
            <div className="space-y-4">
              <p className="text-gray-300">
                Automated monitoring checks all watchlist domains every 60 minutes for changes and threats.
              </p>
              <div className="flex items-center gap-4">
                {!isMonitoring ? (
                  <button
                    onClick={startMonitoring}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all"
                  >
                    Start Monitoring
                  </button>
                ) : (
                  <button
                    onClick={stopMonitoring}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all"
                  >
                    Stop Monitoring
                  </button>
                )}
                {isMonitoring && (
                  <span className="text-green-400 flex items-center gap-2">
                    <Activity className="animate-pulse" size={20} />
                    Monitoring Active
                  </span>
                )}
              </div>
              
              {lastScanTime && (
                <p className="text-gray-400 text-sm">
                  Last scan: {lastScanTime.toLocaleString()}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Baseline Tab */}
        {activeTab === 'baseline' && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Database className="text-blue-400" />
              Baseline Management
            </h2>
            
            {config && (
              <div className="space-y-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-2">Current Baseline</h3>
                  <p className="text-gray-300">Domain: {config.legitimateDomain || 'combankdigital.com'}</p>
                  <p className="text-gray-400 text-sm">
                    Last updated: {config.baselineLastUpdate ? new Date(config.baselineLastUpdate).toLocaleString() : 'Never'}
                  </p>
                </div>

                <button
                  onClick={refreshBaseline}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
                >
                  <RefreshCw size={20} />
                  Refresh Baseline Now
                </button>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-2">Baseline Features</h3>
                  <ul className="text-gray-300 space-y-1 text-sm">
                    <li>✓ Full text extraction and normalization</li>
                    <li>✓ DOM structure capture</li>
                    <li>✓ Brand keyword detection</li>
                    <li>✓ Form field analysis</li>
                    <li>✓ Visual screenshot reference</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Settings</h2>
            <div className="space-y-4 text-gray-300">
              <div>
                <h3 className="font-semibold text-white mb-2">Detection Thresholds</h3>
                <div className="space-y-2 text-sm">
                  <p>Critical (High Confidence): ≥ 85%</p>
                  <p>Warning (Suspicious): ≥ 70%</p>
                  <p>Monitoring (Low Confidence): ≥ 55%</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-white mb-2">Monitoring Interval</h3>
                <p className="text-sm">60 minutes (hourly scans)</p>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-2">Detection Methods</h3>
                <ul className="text-sm space-y-1">
                  <li>• Visual Similarity (30% weight)</li>
                  <li>• Text Similarity (30% weight)</li>
                  <li>• DOM Structure (20% weight)</li>
                  <li>• Brand Keywords (20% weight)</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Domain Details Modal */}
      {selectedDomain && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full border border-gray-700 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-white">{selectedDomain.domain}</h2>
              <button
                onClick={() => setSelectedDomain(null)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-3 text-gray-300">
              <div>
                <span className="font-semibold text-white">Status:</span>{' '}
                <ThreatBadge similarity={selectedDomain.similarity || 0} />
              </div>
              <div>
                <span className="font-semibold text-white">Similarity:</span> {selectedDomain.similarity}%
              </div>
              <div>
                <span className="font-semibold text-white">Last Checked:</span>{' '}
                {selectedDomain.last_checked ? new Date(selectedDomain.last_checked).toLocaleString() : 'Never'}
              </div>
              {selectedDomain.screenshot && (
                <div>
                  <span className="font-semibold text-white">Screenshot:</span>
                  <img
                    src={`/screenshots/${selectedDomain.screenshot.split('/').pop()}`}
                    alt="Domain screenshot"
                    className="mt-2 rounded-lg border border-gray-600 w-full"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhishingDefenseDashboard;
