import React, { useState, useEffect, useRef } from 'react';
import CameraTest from './CameraTest';
import FireExtinguisherCamera from './FireExtinguisherCamera';
import './App.css';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTestingCamera, setIsTestingCamera] = useState(false);
  const [isFireExtinguisherCameraOpen, setIsFireExtinguisherCameraOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedImage, setSelectedImage] = useState(null);
  const [location, setLocation] = useState('');
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [notes, setNotes] = useState('');
  const [inspectionResult, setInspectionResult] = useState(null);
  const [inspections, setInspections] = useState([]);
  const [dueInspections, setDueInspections] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editingInspection, setEditingInspection] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [modalImage, setModalImage] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  // CSV Export Functions
  const generateCSV = () => {
    const headers = ['Date', 'Location', 'Type', 'Condition', 'Last Inspection', 'Next Due', 'Status', 'Notes'];
    const csvRows = [headers.join(',')];

    inspections.forEach(inspection => {
      let parsed = {};
      try {
        if (typeof inspection.gemini_response === 'object') {
          parsed = inspection.gemini_response;
        } else if (typeof inspection.gemini_response === 'string') {
          const jsonMatch = inspection.gemini_response.match(/```json\s*(\{[\s\S]*?\})\s*```|(\{[\s\S]*\})/);
          if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[1] || jsonMatch[2]);
          }
        }
      } catch (e) {
        parsed = {};
      }

      const row = [
        new Date(inspection.inspection_date).toLocaleDateString(),
        `"${inspection.location}"`,
        `"${parsed.extinguisher_type || 'N/A'}"`,
        `"${parsed.condition || 'N/A'}"`,
        `"${parsed.last_inspection_date ? formatDate(parsed.last_inspection_date) : 'N/A'}"`,
        `"${parsed.next_due_date ? formatDate(parsed.next_due_date) : 'N/A'}"`,
        `"${inspection.status}"`,
        `"${inspection.notes || parsed.maintenance_notes || 'N/A'}"`
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  };

  const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const formatDate = (dateValue) => {
    if (!dateValue) return '';
    if (typeof dateValue === 'string') {
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
            return dateValue;
        }
        const d = new Date(dateValue);
        if (!isNaN(d.getTime())) {
            return d.toISOString().split('T')[0];
        }
        return dateValue;
    }
    if (typeof dateValue === 'object' && dateValue !== null) {
      const { year, month, day } = dateValue;
      if (year && month && day) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
    return '';
  };

  useEffect(() => {
    if (user) {
      loadInspections();
      loadDueInspections();
    }
  }, [user]);


  const checkSession = async () => {
    try {
      // Skip session check and automatically set demo user
      setUser({
        id: "demo-user",
        email: "admin@firesafety.com",
        name: "Fire Safety Admin",
        picture: "/images/company-log.png"
      });
      localStorage.setItem('session_token', 'demo-session-token');
    } catch (error) {
      console.error('Session check failed:', error);
    } finally {
      setLoading(false);
    }
  };


  const loadInspections = async () => {
    try {
      const sessionToken = localStorage.getItem('session_token');
      const response = await fetch(`${backendUrl}/api/inspections`, {
        headers: {
          'session-token': sessionToken
        }
      });

      if (response.ok) {
        const data = await response.json();
        setInspections(data);
      }
    } catch (error) {
      console.error('Failed to load inspections:', error);
    }
  };

  const loadDueInspections = async () => {
    try {
      const sessionToken = localStorage.getItem('session_token');
      const response = await fetch(`${backendUrl}/api/inspections/due`, {
        headers: {
          'session-token': sessionToken
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDueInspections(data);
      }
    } catch (error) {
      console.error('Failed to load due inspections:', error);
    }
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${backendUrl}/api/auth/demo-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Demo auth successful:', data);
        localStorage.setItem('session_token', data.session_token);
        setUser(data.user);
        setCurrentPage('dashboard');
      } else {
        const error = await response.json();
        console.error('Demo auth failed:', error);
        alert('Authentication failed. Please try again.');
      }
    } catch (error) {
      console.error('Demo authentication failed:', error);
      alert('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthCallback = async () => {
    const hash = window.location.hash;
    const sessionId = hash.split('session_id=')[1];
    
    if (sessionId) {
      try {
        console.log('Processing session ID:', sessionId);
        
        const formData = new FormData();
        formData.append('session_id', sessionId);
        
        const response = await fetch(`${backendUrl}/api/auth/session`, {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Auth successful:', data);
          localStorage.setItem('session_token', data.session_token);
          setUser(data.user);
          setCurrentPage('dashboard');
          // Clear the hash from URL
          window.history.replaceState({}, document.title, '/');
        } else {
          const error = await response.json();
          console.error('Auth failed:', error);
          alert('Authentication failed. Please try again.');
        }
      } catch (error) {
        console.error('Authentication failed:', error);
        alert('Authentication failed. Please try again.');
      }
    } else {
      console.log('No session ID found in hash:', hash);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const closeCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => {
        track.stop();
      });
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const openCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Camera access is not supported by this browser. Please try uploading a file instead.');
        return;
      }
  
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setIsCameraOpen(true);
        };
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      let errorMessage = 'Unable to access camera. ';
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage += 'Please allow camera permission in your browser settings and try again.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage += 'No camera found on this device.';
      } else if (error.name === 'NotReadableError') {
        errorMessage += 'Camera is already in use by another application.';
      } else {
        errorMessage += 'An unexpected error occurred.';
      }
      alert(errorMessage);
    }
  };

  const capturePhoto = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!video || !canvas || !video.srcObject) return;
    
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    
    const imageData = canvas.toDataURL('image/jpeg');
    setSelectedImage(imageData);
    closeCamera();
  };

  const analyzeImage = async () => {
    if (!selectedImage || !location.trim()) {
      alert('Please select an image and enter a location.');
      return;
    }

    setIsAnalyzing(true);
    setInspectionResult(null);

    try {
      const sessionToken = localStorage.getItem('session_token');
      const imageBase64 = selectedImage.split(',')[1]; // Remove data URL prefix
      
      const response = await fetch(`${backendUrl}/api/inspections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'session-token': sessionToken
        },
        body: JSON.stringify({
          image_base64: imageBase64,
          location: location,
          notes: notes
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Treat success flag if present, but still handle without it
        if (result && result.success) {
          console.log(`Analysis succeeded in ${result.duration_ms} ms using ${result.model}`);
        }
        setInspectionResult(result);
        setSelectedImage(null);
        setLocation('');
        setNotes('');
        loadInspections();
        loadDueInspections();
      } else if (response.status === 504 || response.status === 502) {
        // Backend might have finished even if gateway timed out. Try to refresh list and show a softer message.
        await loadInspections();
        await loadDueInspections();
        alert('The analysis took longer than expected, but the result may still have been saved. Please check the Validate or Data tabs.');
      } else {
        let message = 'Analysis failed';
        try {
          const error = await response.json();
          message = error.detail || message;
        } catch (_) {
          // Response was likely HTML (nginx error page). Keep default message.
        }
        alert(message);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };



  const handleLogout = () => {
    localStorage.removeItem('session_token');
    setUser(null);
    setCurrentPage('dashboard');
  };

  const startEditingInspection = (inspection) => {
    setEditingInspection(inspection.id);

    let parsedData = {};
    try {
        const responseText = typeof inspection.gemini_response === 'string'
            ? inspection.gemini_response
            : JSON.stringify(inspection.gemini_response);

        const jsonMatch = responseText.match(/```json\s*(\{[\s\S]*?\})\s*```|(\{[\s\S]*\})/);

        if (jsonMatch) {
            const jsonString = jsonMatch[1] || jsonMatch[2];
            parsedData = JSON.parse(jsonString);
        } else {
            parsedData = {};
        }
    } catch (e) {
        console.error('Could not parse gemini response:', e);
        parsedData = {};
    }

    setEditFormData({
        location: inspection.location || '',
        notes: inspection.notes || '',
        last_inspection_date: formatDate(parsedData.last_inspection_date),
        next_due_date: formatDate(parsedData.next_due_date),
        extinguisher_type: parsedData.extinguisher_type || '',
        maintenance_notes: parsedData.maintenance_notes || '',
        condition: parsedData.condition || '',
        requires_attention: parsedData.requires_attention || false,
    });
};

  const cancelEditing = () => {
    setEditingInspection(null);
    setEditFormData({});
  };

  const saveInspectionChanges = async () => {
    if (!editingInspection) return;

    try {
      const sessionToken = localStorage.getItem('session_token');
      const response = await fetch(`${backendUrl}/api/inspections/${editingInspection}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'session-token': sessionToken
        },
        body: JSON.stringify(editFormData)
      });

      if (response.ok) {
        alert('Inspection updated successfully!');
        setEditingInspection(null);
        setEditFormData({});
        loadInspections(); // Refresh the list
        loadDueInspections(); // Refresh due inspections
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to update inspection');
      }
    } catch (error) {
      console.error('Update failed:', error);
      alert('Failed to update inspection. Please try again.');
    }
  };

  const deleteInspection = async (inspectionId) => {
    if (!window.confirm('Are you sure you want to delete this inspection? This action cannot be undone.')) {
      return;
    }

    try {
      const sessionToken = localStorage.getItem('session_token');
      const response = await fetch(`${backendUrl}/api/inspections/${inspectionId}`, {
        method: 'DELETE',
        headers: {
          'session-token': sessionToken
        }
      });

      if (response.ok) {
        alert('Inspection deleted successfully!');
        loadInspections(); // Refresh the list
        loadDueInspections(); // Refresh due inspections
        // If we were editing this inspection, cancel editing
        if (editingInspection === inspectionId) {
          setEditingInspection(null);
          setEditFormData({});
        }
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to delete inspection');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete inspection. Please try again.');
    }
  };

  // Handle auth callback
  useEffect(() => {
    if (window.location.pathname === '/profile') {
      handleAuthCallback();
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Bypass authentication for now - automatically set mock user
  if (!user && !loading) {
    setUser({
      id: "demo-user",
      email: "admin@firesafety.com",
      name: "Fire Safety Admin",
      picture: "/images/company-log.png"
    });
    localStorage.setItem('session_token', 'demo-session-token');
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading Fire Safety Scanner...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      {/* Background Image */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-40"
        style={{
          backgroundImage: 'url(/images/background.png)'
        }}
      />
      
      {/* Header */}
      <header className="relative z-10 bg-black/15 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <img
                src="/images/company-log.png"
                alt="Company Logo"
                className="w-10 h-10 rounded-lg object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <h1 className="text-2xl font-bold text-white">Fire Safety Scanner</h1>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => setCurrentPage('dashboard')}
                className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                  currentPage === 'dashboard'
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                Capture
              </button>
              <button
                onClick={() => setCurrentPage('inspections')}
                className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                  currentPage === 'inspections'
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                Validate
              </button>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage('data')}
                  className="text-white/70 hover:text-white transition-colors duration-300"
                >
                  📊 Data
                </button>
              </div>
            </nav>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors duration-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-white/10 pt-4">
              <nav className="flex flex-col space-y-2">
                <button
                  onClick={() => {
                    setCurrentPage('dashboard');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`px-4 py-3 rounded-lg transition-all duration-300 text-left ${
                    currentPage === 'dashboard'
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  📊 Capture
                </button>
                <button
                  onClick={() => {
                    setCurrentPage('inspections');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`px-4 py-3 rounded-lg transition-all duration-300 text-left ${
                    currentPage === 'inspections'
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  📋 Validate
                </button>
                <button
                  onClick={() => {
                    setCurrentPage('data');
                    setIsMobileMenuOpen(false);
                  }}
                  className="px-4 py-3 rounded-lg text-left text-white/70 hover:text-white hover:bg-white/10 transition-colors duration-300"
                >
                  📊 Data
                </button>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-8">

        {currentPage === 'dashboard' && (
          <div className="space-y-8">
            {/* User Stats - Commented out for future use */}
            {/*
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/8 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-2">Total Inspections</h3>
                <p className="text-3xl font-bold text-green-400">{inspections.length}</p>
              </div>
              <div className="bg-white/8 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-2">Due Soon</h3>
                <p className="text-3xl font-bold text-red-400">{dueInspections.length}</p>
              </div>
            </div>
            */}

            {/* Due Inspections Alert - Commented out for future use */}
            {/*
            {dueInspections.length > 0 && (
              <div className="bg-red-500/15 border border-red-500/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">🚨 Inspections Due Soon</h3>
                <div className="space-y-2">
                  {dueInspections.map((inspection) => (
                    <div key={inspection.id} className="flex justify-between items-center text-white/80">
                      <span>{inspection.location}</span>
                      <span className="text-sm">Due: {new Date(inspection.due_date).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            */}

            {/* Image Upload Section */}
            <div className="bg-white/8 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">Upload Fire Extinguisher Tag</h2>
              
              <div className="space-y-4">
                <div className="flex space-x-4">
                  <button
                    onClick={() => fileInputRef.current.click()}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
                  >
                    📁 Choose File
                  </button>
                  <button
                    onClick={() => setIsFireExtinguisherCameraOpen(true)}
                    className="flex-1 bg-gradient-to-r from-green-500 to-teal-600 text-white font-bold py-3 px-6 rounded-lg hover:from-green-600 hover:to-teal-700 transition-all duration-300 transform hover:scale-105"
                  >
                    📷 Take Photo
                  </button>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* Fire Extinguisher Camera Modal */}
                {isFireExtinguisherCameraOpen && (
                  <FireExtinguisherCamera
                    onExit={() => setIsFireExtinguisherCameraOpen(false)}
                    onCapture={(imageData) => {
                      setSelectedImage(imageData);
                      setIsFireExtinguisherCameraOpen(false);
                    }}
                  />
                )}

                {/* Camera Test Modal (for debugging) */}
                {isTestingCamera && <CameraTest onExit={() => setIsTestingCamera(false)} />}
                
                <canvas ref={canvasRef} className="hidden" />

                {selectedImage && (
                  <div className="mt-4">
                    <img src={selectedImage} alt="Selected" className="max-w-full h-64 object-cover rounded-lg border border-white/20" />
                  </div>
                )}

                <div className="space-y-4">
                  {/* Location Multi-Select with Checkboxes */}
                  <div className="relative">
                    <label className="block text-white text-sm font-medium mb-2">
                      Location (Select multiple) *
                    </label>
                    <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-4 max-h-48 overflow-y-auto">
                      {/* Floors */}
                      <div className="mb-4">
                        <h4 className="text-white text-sm font-medium mb-2">Floors</h4>
                        <div className="space-y-2">
                          {['Floor 1', 'Floor 2', 'Floor 3'].map((floor) => (
                            <label key={floor} className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                value={floor}
                                checked={selectedLocations.includes(floor)}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  let newSelections;
                                  if (e.target.checked) {
                                    newSelections = [...selectedLocations, value];
                                  } else {
                                    newSelections = selectedLocations.filter(loc => loc !== value);
                                  }
                                  setSelectedLocations(newSelections);
                                  setLocation(newSelections.join(', '));
                                }}
                                className="w-4 h-4 text-blue-600 bg-white/20 border-white/30 rounded focus:ring-blue-500 focus:ring-2"
                              />
                              <span className="text-white text-sm">{floor}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      {/* Areas */}
                      <div className="mb-4">
                        <h4 className="text-white text-sm font-medium mb-2">Areas</h4>
                        <div className="space-y-2">
                          {['Hallway', 'Office Room'].map((area) => (
                            <label key={area} className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                value={area}
                                checked={selectedLocations.includes(area)}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  let newSelections;
                                  if (e.target.checked) {
                                    newSelections = [...selectedLocations, value];
                                  } else {
                                    newSelections = selectedLocations.filter(loc => loc !== value);
                                  }
                                  setSelectedLocations(newSelections);
                                  setLocation(newSelections.join(', '));
                                }}
                                className="w-4 h-4 text-blue-600 bg-white/20 border-white/30 rounded focus:ring-blue-500 focus:ring-2"
                              />
                              <span className="text-white text-sm">{area}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      {/* Directions */}
                      <div>
                        <h4 className="text-white text-sm font-medium mb-2">Directions</h4>
                        <div className="space-y-2">
                          {['North', 'South', 'East', 'West'].map((direction) => (
                            <label key={direction} className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                value={direction}
                                checked={selectedLocations.includes(direction)}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  let newSelections;
                                  if (e.target.checked) {
                                    newSelections = [...selectedLocations, value];
                                  } else {
                                    newSelections = selectedLocations.filter(loc => loc !== value);
                                  }
                                  setSelectedLocations(newSelections);
                                  setLocation(newSelections.join(', '));
                                }}
                                className="w-4 h-4 text-blue-600 bg-white/20 border-white/30 rounded focus:ring-blue-500 focus:ring-2"
                              />
                              <span className="text-white text-sm">{direction}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                    {selectedLocations.length > 0 && (
                      <div className="mt-2 text-sm text-white/70">
                        Selected: {selectedLocations.join(', ')}
                      </div>
                    )}
                  </div>
                  <textarea
                    placeholder="Additional notes (optional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={analyzeImage}
                    disabled={isAnalyzing || !selectedImage || selectedLocations.length === 0}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold py-3 px-6 rounded-lg hover:from-orange-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isAnalyzing ? '🔍 Analyzing...' : '🔍 Analyze and Submit'}
                  </button>
                </div>
              </div>
            </div>

            {/* Analysis Result */}
            {inspectionResult && (
              <div className="bg-white/8 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-4">Analysis Result</h3>
                <div className="bg-black/20 rounded-lg p-4 text-white/80">
                  {typeof inspectionResult.analysis === 'object' ? (
                    <div className="space-y-2 text-sm">
                      {inspectionResult.analysis.last_inspection_date && <div><strong>Last Inspection:</strong> {formatDate(inspectionResult.analysis.last_inspection_date)}</div>}
                      {inspectionResult.analysis.next_due_date && <div><strong>Next Due:</strong> {formatDate(inspectionResult.analysis.next_due_date)}</div>}
                      {inspectionResult.analysis.extinguisher_type && <div><strong>Type:</strong> {inspectionResult.analysis.extinguisher_type}</div>}
                      {inspectionResult.analysis.condition && <div><strong>Condition:</strong> {inspectionResult.analysis.condition}</div>}
                      {inspectionResult.analysis.maintenance_notes && <div><strong>Notes:</strong> {inspectionResult.analysis.maintenance_notes}</div>}
                      {inspectionResult.analysis.requires_attention !== undefined && (
                        <div><strong>Requires Attention:</strong> {inspectionResult.analysis.requires_attention ? 'Yes' : 'No'}</div>
                      )}
                    </div>
                  ) : (
                    <pre className="whitespace-pre-wrap text-sm">{inspectionResult.analysis}</pre>
                  )}
                </div>
                {inspectionResult.message && (
                  <div className="mt-4 text-sm text-green-400">
                    {inspectionResult.message}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {currentPage === 'inspections' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Inspection History</h2>
            
            {inspections.length === 0 ? (
              <div className="bg-white/8 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center">
                <p className="text-white/80">No inspections yet. Start by uploading your first fire extinguisher tag!</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {inspections.map((inspection) => (
                  <div key={inspection.id} className="bg-white/8 backdrop-blur-md rounded-xl p-6 border border-white/20">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{inspection.location}</h3>
                        <p className="text-white/60 text-sm">
                          Analyzed on {new Date(inspection.inspection_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full">
                          {inspection.status}
                        </span>
                        <button
                          onClick={() => startEditingInspection(inspection)}
                          className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-full hover:bg-blue-500/30 transition-colors duration-300"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => deleteInspection(inspection.id)}
                          className="px-3 py-1 bg-red-500/20 text-red-400 text-sm rounded-full hover:bg-red-500/30 transition-colors duration-300"
                          title="Delete inspection"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                    
                    {editingInspection === inspection.id ? (
                      <div className="space-y-4">
                        {/* Reference Image */}
                        <div className="mb-4">
                          <label className="block text-white font-semibold mb-2">Reference Image:</label>
                          <div className="flex justify-center">
                            <img 
                              src={inspection.image_base64} 
                              alt="Inspection reference"
                              className="max-w-sm max-h-64 object-contain rounded-lg border border-white/20 cursor-pointer hover:opacity-80 transition-opacity duration-300"
                              onClick={() => setModalImage(inspection.image_base64)}
                              title="Click to view full size"
                            />
                          </div>
                          <p className="text-white/60 text-sm text-center mt-2">Click image to view full size</p>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-white font-semibold mb-2">Location:</label>
                            <input
                              type="text"
                              value={editFormData.location}
                              onChange={(e) => setEditFormData({...editFormData, location: e.target.value})}
                              className="w-full px-3 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-white font-semibold mb-2">Extinguisher Type:</label>
                            <input
                              type="text"
                              value={editFormData.extinguisher_type}
                              onChange={(e) => setEditFormData({...editFormData, extinguisher_type: e.target.value})}
                              className="w-full px-3 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-white font-semibold mb-2">Last Inspection Date:</label>
                            <input
                              type="date"
                              value={editFormData.last_inspection_date}
                              onChange={(e) => setEditFormData({...editFormData, last_inspection_date: e.target.value})}
                              className="w-full px-3 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-white font-semibold mb-2">Next Due Date:</label>
                            <input
                              type="date"
                              value={editFormData.next_due_date}
                              onChange={(e) => setEditFormData({...editFormData, next_due_date: e.target.value})}
                              className="w-full px-3 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-white font-semibold mb-2">Condition:</label>
                            <select
                              value={editFormData.condition}
                              onChange={(e) => setEditFormData({...editFormData, condition: e.target.value})}
                              className="w-full px-3 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select condition</option>
                              <option value="Good">Good</option>
                              <option value="Fair">Fair</option>
                              <option value="Poor">Poor</option>
                            </select>
                          </div>
                          <div className="flex items-center">
                            <label className="flex items-center text-white font-semibold">
                              <input
                                type="checkbox"
                                checked={editFormData.requires_attention}
                                onChange={(e) => setEditFormData({...editFormData, requires_attention: e.target.checked})}
                                className="mr-2"
                              />
                              Requires Attention
                            </label>
                          </div>
                        </div>
                        <div>
                          <label className="block text-white font-semibold mb-2">Maintenance Notes:</label>
                          <textarea
                            value={editFormData.maintenance_notes}
                            onChange={(e) => setEditFormData({...editFormData, maintenance_notes: e.target.value})}
                            rows={3}
                            className="w-full px-3 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-white font-semibold mb-2">Additional Notes:</label>
                          <textarea
                            value={editFormData.notes}
                            onChange={(e) => setEditFormData({...editFormData, notes: e.target.value})}
                            rows={2}
                            className="w-full px-3 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex space-x-4">
                          <button
                            onClick={saveInspectionChanges}
                            className="px-6 py-2 bg-gradient-to-r from-green-500 to-teal-600 text-white font-bold rounded-lg hover:from-green-600 hover:to-teal-700 transition-all duration-300"
                          >
                            💾 Save Changes
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="px-6 py-2 bg-gray-500 text-white font-bold rounded-lg hover:bg-gray-600 transition-all duration-300"
                          >
                            ❌ Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <img 
                            src={`data:image/jpeg;base64,${inspection.image_base64}`}
                            alt="Inspection"
                            className="w-full h-48 object-cover rounded-lg border border-white/20 cursor-pointer hover:opacity-80 transition-opacity duration-300"
                            onClick={() => setModalImage(`data:image/jpeg;base64,${inspection.image_base64}`)}
                            title="Click to view full size"
                          />
                        </div>
                        <div>
                          <h4 className="text-white font-semibold mb-2">Analysis:</h4>
                          <div className="bg-black/20 rounded-lg p-3 text-white/80 text-sm max-h-48 overflow-y-auto">
                            {(() => {
                              let parsed = {};
                              const geminiResponse = inspection.gemini_response;

                              if (typeof geminiResponse === 'object' && geminiResponse !== null) {
                                  parsed = geminiResponse;
                              } else if (typeof geminiResponse === 'string') {
                                  try {
                                      // Robust regex to find JSON within optional markdown
                                      const jsonMatch = geminiResponse.match(/```json\s*(\{[\s\S]*?\})\s*```|(\{[\s\S]*\})/);
                                      if (jsonMatch) {
                                          const jsonString = jsonMatch[1] || jsonMatch[2];
                                          parsed = JSON.parse(jsonString);
                                      } else {
                                          // Fallback for plain JSON string
                                          parsed = JSON.parse(geminiResponse);
                                      }
                                  } catch (e) {
                                      // If parsing fails, render the raw string safely
                                      return <pre className="whitespace-pre-wrap">{geminiResponse}</pre>;
                                  }
                              }

                              return (
                                  <div className="space-y-2">
                                      {parsed.last_inspection_date && <div><strong>Last Inspection:</strong> {formatDate(parsed.last_inspection_date)}</div>}
                                      {parsed.next_due_date && <div><strong>Next Due:</strong> {formatDate(parsed.next_due_date)}</div>}
                                      {parsed.extinguisher_type && <div><strong>Type:</strong> {parsed.extinguisher_type}</div>}
                                      {parsed.condition && <div><strong>Condition:</strong> {parsed.condition}</div>}
                                      {parsed.maintenance_notes && <div><strong>Notes:</strong> {parsed.maintenance_notes}</div>}
                                      {parsed.requires_attention !== undefined && (
                                          <div><strong>Requires Attention:</strong> {parsed.requires_attention ? 'Yes' : 'No'}</div>
                                      )}
                                  </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {!editingInspection && inspection.notes && (
                      <div className="mt-4">
                        <h4 className="text-white font-semibold mb-2">Notes:</h4>
                        <p className="text-white/80">{inspection.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Data Tab - Spreadsheet View */}
        {currentPage === 'data' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">📊 Inspection Data</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    const csvContent = generateCSV();
                    downloadCSV(csvContent, 'fire-safety-inspections.csv');
                  }}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors duration-300"
                >
                  📥 Export CSV
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-300"
                >
                  🖨️ Print
                </button>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/8 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-2">Total Inspections</h3>
                <p className="text-2xl font-bold text-green-400">{inspections.length}</p>
              </div>
              <div className="bg-white/8 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-2">This Month</h3>
                <p className="text-2xl font-bold text-blue-400">
                  {inspections.filter(i => new Date(i.inspection_date).getMonth() === new Date().getMonth()).length}
                </p>
              </div>
              <div className="bg-white/8 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-2">Locations</h3>
                <p className="text-2xl font-bold text-purple-400">
                  {new Set(inspections.map(i => i.location)).size}
                </p>
              </div>
            </div>

            {/* Data Table */}
            <div className="bg-white/8 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
              {inspections.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-white/80">No inspection data available. Start by uploading your first fire extinguisher tag!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-white">
                    <thead className="bg-white/10">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Date</th>
                        <th className="px-4 py-3 text-left font-semibold">Location</th>
                        <th className="px-4 py-3 text-left font-semibold">Type</th>
                        <th className="px-4 py-3 text-left font-semibold">Condition</th>
                        <th className="px-4 py-3 text-left font-semibold">Last Inspection</th>
                        <th className="px-4 py-3 text-left font-semibold">Next Due</th>
                        <th className="px-4 py-3 text-left font-semibold">Status</th>
                        <th className="px-4 py-3 text-left font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inspections.map((inspection, index) => {
                        let parsed = {};
                        try {
                          if (typeof inspection.gemini_response === 'object') {
                            parsed = inspection.gemini_response;
                          } else if (typeof inspection.gemini_response === 'string') {
                            const jsonMatch = inspection.gemini_response.match(/```json\s*(\{[\s\S]*?\})\s*```|(\{[\s\S]*\})/);
                            if (jsonMatch) {
                              parsed = JSON.parse(jsonMatch[1] || jsonMatch[2]);
                            }
                          }
                        } catch (e) {
                          parsed = {};
                        }

                        return (
                          <tr key={inspection.id} className={`border-t border-white/10 hover:bg-white/5 ${index % 2 === 0 ? 'bg-white/5' : ''}`}>
                            <td className="px-4 py-3 text-sm">
                              {new Date(inspection.inspection_date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium">{inspection.location}</td>
                            <td className="px-4 py-3 text-sm">{parsed.extinguisher_type || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm">{parsed.condition || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm">
                              {parsed.last_inspection_date ? formatDate(parsed.last_inspection_date) : 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {parsed.next_due_date ? formatDate(parsed.next_due_date) : 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                                {inspection.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <button
                                onClick={() => setModalImage(`data:image/jpeg;base64,${inspection.image_base64}`)}
                                className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded hover:bg-blue-500/30 transition-colors duration-300 mr-2"
                              >
                                👁️ View
                              </button>
                              <button
                                onClick={() => deleteInspection(inspection.id)}
                                className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded hover:bg-red-500/30 transition-colors duration-300"
                              >
                                🗑️ Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Image Modal */}
        {modalImage && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setModalImage(null)}>
            <div className="relative max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center">
              <img 
                src={modalImage}
                alt="Full size inspection"
                className="max-w-full max-h-full object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={() => setModalImage(null)}
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors duration-300"
                title="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;