import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedImage, setSelectedImage] = useState(null);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [inspectionResult, setInspectionResult] = useState(null);
  const [inspections, setInspections] = useState([]);
  const [dueInspections, setDueInspections] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editingInspection, setEditingInspection] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [modalImage, setModalImage] = useState(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    checkSession();
  }, []);

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
        picture: "https://via.placeholder.com/150"
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

  const openCamera = async () => {
    try {
      // Check if camera is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Camera access is not supported by this browser. Please try uploading a file instead.');
        return;
      }

      // Request camera access with mobile-friendly constraints
      const constraints = {
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraOpen(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      
      let errorMessage = 'Unable to access camera. ';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage += 'Please allow camera permission in your browser settings and try again.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage += 'No camera found on this device.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage += 'Camera access is not supported by this browser.';
      } else if (error.name === 'NotReadableError') {
        errorMessage += 'Camera is already in use by another application.';
      } else if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        errorMessage += 'Camera access requires HTTPS. Please use a secure connection.';
      } else {
        errorMessage += 'Please try uploading a file instead.';
      }
      
      alert(errorMessage);
    }
  };

  const capturePhoto = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    const imageData = canvas.toDataURL('image/jpeg');
    setSelectedImage(imageData);
    
    // Stop camera
    const stream = video.srcObject;
    const tracks = stream.getTracks();
    tracks.forEach(track => track.stop());
    setIsCameraOpen(false);
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
      // Send the complete data URL so backend can detect format
      const response = await fetch(`${backendUrl}/api/inspections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'session-token': sessionToken
        },
        body: JSON.stringify({
          image_data_url: selectedImage,
          location: location,
          notes: notes
        })
      });

      if (response.ok) {
        const result = await response.json();
        setInspectionResult(result);
        setSelectedImage(null);
        setLocation('');
        setNotes('');
        loadInspections();
        loadDueInspections();
      } else {
        const error = await response.json();
        alert(error.detail || 'Analysis failed');
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
    
    // Parse the gemini_response to get structured data
    let parsedData = {};
    try {
      // The response contains mixed text and JSON, extract just the JSON part
      const response = inspection.gemini_response;
      
      // Look for JSON content between ```json and ``` markers
      const jsonMatch = response.match(/```json\s*\n([\s\S]*?)\n```/);
      if (jsonMatch && jsonMatch[1]) {
        parsedData = JSON.parse(jsonMatch[1].trim());
      } else {
        // Try to parse the entire response as JSON (fallback)
        parsedData = JSON.parse(response);
      }
    } catch (e) {
      console.log('Could not parse gemini response:', e);
      // If it's not JSON, create empty structure
      parsedData = {};
    }
    
    setEditFormData({
      location: inspection.location || '',
      notes: inspection.notes || '',
      last_inspection_date: parsedData.last_inspection_date || '',
      next_due_date: parsedData.next_due_date || '',
      extinguisher_type: parsedData.extinguisher_type || '',
      maintenance_notes: parsedData.maintenance_notes || '',
      condition: parsedData.condition || '',
      requires_attention: parsedData.requires_attention || false
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
      picture: "https://via.placeholder.com/150"
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
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1660165458059-57cfb6cc87e5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2Mzl8MHwxfHNlYXJjaHwxfHxmdXR1cmlzdGljJTIwdGVjaG5vbG9neXxlbnwwfHx8Ymx1ZXwxNzUyODc2MjYzfDA&ixlib=rb-4.1.0&q=85)'
        }}
      />
      
      {/* Header */}
      <header className="relative z-10 bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Fire Safety Scanner</h1>
          <nav className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentPage('dashboard')}
              className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                currentPage === 'dashboard' 
                  ? 'bg-white/20 text-white' 
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentPage('inspections')}
              className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                currentPage === 'inspections' 
                  ? 'bg-white/20 text-white' 
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              Inspections
            </button>
            <div className="flex items-center space-x-2">
              <img src={user.picture} alt="Profile" className="w-8 h-8 rounded-full" />
              <span className="text-white text-sm">{user.name}</span>
              <button
                onClick={handleLogout}
                className="text-white/70 hover:text-white transition-colors duration-300"
              >
                Logout
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-8">

        {currentPage === 'dashboard' && (
          <div className="space-y-8">
            {/* User Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-2">Total Inspections</h3>
                <p className="text-3xl font-bold text-green-400">{inspections.length}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-2">Due Soon</h3>
                <p className="text-3xl font-bold text-red-400">{dueInspections.length}</p>
              </div>
            </div>

            {/* Due Inspections Alert */}
            {dueInspections.length > 0 && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-6">
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

            {/* Image Upload Section */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
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
                    onClick={openCamera}
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

                {/* Camera Modal */}
                {isCameraOpen && (
                  <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                      <video ref={videoRef} className="w-full max-w-md rounded-lg mb-4" autoPlay playsInline />
                      <div className="flex space-x-4">
                        <button
                          onClick={capturePhoto}
                          className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-2 px-4 rounded-lg"
                        >
                          Capture
                        </button>
                        <button
                          onClick={() => setIsCameraOpen(false)}
                          className="flex-1 bg-gray-500 text-white font-bold py-2 px-4 rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                <canvas ref={canvasRef} className="hidden" />

                {selectedImage && (
                  <div className="mt-4">
                    <img src={selectedImage} alt="Selected" className="max-w-full h-64 object-cover rounded-lg border border-white/20" />
                  </div>
                )}

                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Location (e.g., Building A - 1st Floor)"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <textarea
                    placeholder="Additional notes (optional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={analyzeImage}
                    disabled={isAnalyzing || !selectedImage || !location.trim()}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold py-3 px-6 rounded-lg hover:from-orange-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isAnalyzing ? '🔍 Analyzing...' : '🔍 Analyze Image'}
                  </button>
                </div>
              </div>
            </div>

            {/* Analysis Result */}
            {inspectionResult && (
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-4">Analysis Result</h3>
                <div className="bg-black/20 rounded-lg p-4 text-white/80">
                  {typeof inspectionResult.analysis === 'object' ? (
                    <div className="space-y-2 text-sm">
                      {inspectionResult.analysis.last_inspection_date && <div><strong>Last Inspection:</strong> {inspectionResult.analysis.last_inspection_date}</div>}
                      {inspectionResult.analysis.next_due_date && <div><strong>Next Due:</strong> {inspectionResult.analysis.next_due_date}</div>}
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
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center">
                <p className="text-white/80">No inspections yet. Start by uploading your first fire extinguisher tag!</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {inspections.map((inspection) => (
                  <div key={inspection.id} className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
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
                              try {
                                // Parse the gemini_response to extract JSON data
                                let parsed = {};
                                const response = inspection.gemini_response;
                                
                                // Look for JSON content between ```json and ``` markers
                                const jsonMatch = response.match(/```json\s*\n([\s\S]*?)\n```/);
                                if (jsonMatch && jsonMatch[1]) {
                                  parsed = JSON.parse(jsonMatch[1].trim());
                                } else {
                                  // Try to parse the entire response as JSON (fallback)
                                  parsed = JSON.parse(response);
                                }
                                
                                return (
                                  <div className="space-y-2">
                                    {parsed.last_inspection_date && <div><strong>Last Inspection:</strong> {parsed.last_inspection_date}</div>}
                                    {parsed.next_due_date && <div><strong>Next Due:</strong> {parsed.next_due_date}</div>}
                                    {parsed.extinguisher_type && <div><strong>Type:</strong> {parsed.extinguisher_type}</div>}
                                    {parsed.condition && <div><strong>Condition:</strong> {parsed.condition}</div>}
                                    {parsed.maintenance_notes && <div><strong>Notes:</strong> {parsed.maintenance_notes}</div>}
                                    {parsed.requires_attention !== undefined && (
                                      <div><strong>Requires Attention:</strong> {parsed.requires_attention ? 'Yes' : 'No'}</div>
                                    )}
                                  </div>
                                );
                              } catch (e) {
                                return <pre className="whitespace-pre-wrap">{inspection.gemini_response}</pre>;
                              }
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