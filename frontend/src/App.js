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
  
  // Quick Shot Mode State
  const [isQuickShotMode, setIsQuickShotMode] = useState(false);
  const [submittedBy, setSubmittedBy] = useState('');
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [isProcessingOffline, setIsProcessingOffline] = useState(false);
  
  // Toast notification state
  const [toasts, setToasts] = useState([]);
  
  // User login state
  const [currentUser, setCurrentUser] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [gpsData, setGpsData] = useState(null);
  const [isCapturingGPS, setIsCapturingGPS] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Google Maps Business Suggestions
  const [businessSuggestions, setBusinessSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  // CSV Export Functions
  const generateCSV = () => {
    const headers = ['Date', 'Location', 'Type', 'Condition', 'Last Inspection', 'Next Due', 'Service Company', 'Company Phone', 'Equipment Numbers', 'Service Type', 'GPS Location', 'Status', 'Notes'];
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

      // Format equipment numbers for CSV
      const equipmentNumbers = [];
      if (parsed.equipment_numbers) {
        if (parsed.equipment_numbers.ae_number && parsed.equipment_numbers.ae_number !== 'unknown') {
          equipmentNumbers.push(`AE:${parsed.equipment_numbers.ae_number}`);
        }
        if (parsed.equipment_numbers.he_number && parsed.equipment_numbers.he_number !== 'unknown') {
          equipmentNumbers.push(`HE:${parsed.equipment_numbers.he_number}`);
        }
        if (parsed.equipment_numbers.ee_number && parsed.equipment_numbers.ee_number !== 'unknown') {
          equipmentNumbers.push(`EE:${parsed.equipment_numbers.ee_number}`);
        }
        if (parsed.equipment_numbers.fe_number && parsed.equipment_numbers.fe_number !== 'unknown') {
          equipmentNumbers.push(`FE:${parsed.equipment_numbers.fe_number}`);
        }
      }

      // Format GPS data
      let gpsString = 'N/A';
      if (inspection.gps_data) {
        try {
          const gps = typeof inspection.gps_data === 'string' ? JSON.parse(inspection.gps_data) : inspection.gps_data;
          if (gps.latitude && gps.longitude) {
            gpsString = `${gps.latitude.toFixed(6)}, ${gps.longitude.toFixed(6)}`;
          }
        } catch (e) {
          // If GPS data exists but can't be parsed, just note that GPS was captured
          gpsString = 'GPS Captured';
        }
      }

      const row = [
        new Date(inspection.inspection_date).toLocaleDateString(),
        `"${inspection.location}"`,
        `"${parsed.extinguisher_type || 'N/A'}"`,
        `"${parsed.condition || 'N/A'}"`,
        `"${parsed.last_inspection_date ? formatDate(parsed.last_inspection_date) : 'N/A'}"`,
        `"${parsed.next_due_date ? formatDate(parsed.next_due_date) : 'N/A'}"`,
        `"${parsed.service_company?.name && parsed.service_company.name !== 'unknown' ? parsed.service_company.name : 'N/A'}"`,
        `"${parsed.service_company?.phone && parsed.service_company.phone !== 'unknown' ? parsed.service_company.phone : 'N/A'}"`,
        `"${equipmentNumbers.length > 0 ? equipmentNumbers.join(' | ') : 'N/A'}"`,
        `"${parsed.service_details?.service_type && parsed.service_details.service_type !== 'unknown' ? parsed.service_details.service_type : 'N/A'}"`,
        `"${gpsString}"`,
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

  // Load offline queue on startup and set up connection monitoring
  useEffect(() => {
    loadOfflineQueue();
    
    // Process offline queue when app loads (in case we're back online)
    const processOnStartup = () => {
      setTimeout(() => {
        if (navigator.onLine) {
          processOfflineQueue();
        }
      }, 2000); // Wait 2 seconds for app to fully load
    };
    
    processOnStartup();
    
    // Listen for online/offline events
    const handleOnline = () => {
      console.log('📡 Connection restored, processing offline queue...');
      processOfflineQueue();
    };
    
    const handleOffline = () => {
      console.log('📱 Connection lost, submissions will be queued offline');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);


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

  // Google Maps Business Suggestions
  const fetchBusinessSuggestions = async (latitude, longitude) => {
    setIsLoadingSuggestions(true);
    try {
      // Using Google Places API through backend with GET request
      const response = await fetch(`${backendUrl}/api/places/nearby?lat=${latitude}&lng=${longitude}&radius=500`, {
        method: 'GET',
        headers: {
          'session-token': localStorage.getItem('session_token')
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBusinessSuggestions(data.places || []);
        setShowSuggestions(true);
      } else {
        console.warn('Could not fetch business suggestions');
        setBusinessSuggestions([]);
      }
    } catch (error) {
      console.warn('Business suggestion fetch failed:', error);
      setBusinessSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // GPS Capture Functions
  const captureGPS = async () => {
    setIsCapturingGPS(true);
    setGpsError(null);
    
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser');
      }

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          }
        );
      });

      const gps = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date().toISOString(),
        source: 'browser_geolocation'
      };

      setGpsData(gps);
      console.log('GPS captured:', gps);
      
      // Automatically fetch business suggestions when GPS is captured
      await fetchBusinessSuggestions(gps.latitude, gps.longitude);
      
    } catch (error) {
      console.error('GPS capture failed:', error);
      setGpsError(error.message);
    } finally {
      setIsCapturingGPS(false);
    }
  };

  // Offline Storage Functions
  const saveToOfflineQueue = (submissionData) => {
    try {
      const queue = JSON.parse(localStorage.getItem('offlineSubmissions') || '[]');
      const queueItem = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        data: submissionData,
        retries: 0,
        maxRetries: 3
      };
      queue.push(queueItem);
      localStorage.setItem('offlineSubmissions', JSON.stringify(queue));
      setOfflineQueue(queue);
      console.log('💾 Saved submission to offline queue');
    } catch (error) {
      console.error('Failed to save to offline queue:', error);
    }
  };

  const processOfflineQueue = async () => {
    if (isProcessingOffline) return;
    
    try {
      setIsProcessingOffline(true);
      const queue = JSON.parse(localStorage.getItem('offlineSubmissions') || '[]');
      
      if (queue.length === 0) {
        setOfflineQueue([]);
        return;
      }
      
      console.log(`📡 Processing ${queue.length} offline submissions...`);
      const sessionToken = localStorage.getItem('session_token');
      const remainingQueue = [];
      
      for (const item of queue) {
        try {
          const response = await fetch(`${backendUrl}/api/inspections`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'session-token': sessionToken
            },
            body: JSON.stringify(item.data)
          });
          
          if (response.ok) {
            console.log(`✅ Successfully uploaded offline submission ${item.id}`);
          } else {
            throw new Error(`HTTP ${response.status}`);
          }
        } catch (error) {
          console.log(`❌ Failed to upload submission ${item.id}, retry ${item.retries + 1}/${item.maxRetries}`);
          item.retries += 1;
          
          if (item.retries < item.maxRetries) {
            remainingQueue.push(item);
          } else {
            console.log(`🗑️ Dropping submission ${item.id} after ${item.maxRetries} retries`);
          }
        }
      }
      
      localStorage.setItem('offlineSubmissions', JSON.stringify(remainingQueue));
      setOfflineQueue(remainingQueue);
      
      if (remainingQueue.length === 0) {
        console.log('🎉 All offline submissions processed successfully!');
        loadInspections(); // Refresh the list
      }
      
    } catch (error) {
      console.error('Error processing offline queue:', error);
    } finally {
      setIsProcessingOffline(false);
    }
  };

  const loadOfflineQueue = () => {
    try {
      const queue = JSON.parse(localStorage.getItem('offlineSubmissions') || '[]');
      setOfflineQueue(queue);
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      setOfflineQueue([]);
    }
  };

  // Toast notification functions
  const showToast = (message, type = 'success', duration = 4000) => {
    const id = Date.now();
    const toast = { id, message, type };
    
    setToasts(prev => [...prev, toast]);
    
    // Auto-remove toast after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // User login functions
  const loginUser = (username) => {
    if (username.trim()) {
      setCurrentUser(username.trim());
      setSubmittedBy(username.trim());
      localStorage.setItem('currentUser', username.trim());
      setShowLoginModal(false);
      showToast(`👤 Logged in as ${username.trim()}`, 'success');
    }
  };

  const logoutUser = () => {
    setCurrentUser('');
    setSubmittedBy('');
    localStorage.removeItem('currentUser');
    showToast('👋 Logged out successfully', 'info');
  };

  // Load saved user on startup
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(savedUser);
      setSubmittedBy(savedUser);
    }
  }, []);

  // Quick Shot Submission
  const submitQuickShot = async () => {
    if (!selectedImage || !businessName.trim()) {
      alert('Please capture an image and enter a business name.');
      return;
    }

    setIsSubmitting(true);

    try {
      const sessionToken = localStorage.getItem('session_token');
      const imageBase64 = selectedImage.split(',')[1]; // Remove data URL prefix
      
      const submissionData = {
        image_base64: imageBase64,
        business_name: businessName.trim(),
        location: businessName.trim(), // Use business name as location for now
        notes: `Quick Shot mode submission${gpsData ? ` - GPS: ${gpsData.latitude}, ${gpsData.longitude}` : ''}${submittedBy ? ` - Submitted by: ${submittedBy}` : ''}`,
        mode: 'quick_shot',
        gps_data: gpsData,
        submitted_by: submittedBy.trim() || 'Anonymous',
        timestamp: new Date().toISOString(),
        source: 'mobile_camera'
      };

      const response = await fetch(`${backendUrl}/api/inspections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'session-token': sessionToken
        },
        body: JSON.stringify(submissionData)
      });

      if (response.ok) {
        // Show success toast and reset form
        showToast('🚀 Submitted successfully! Processing in background...', 'success');
        setSelectedImage(null);
        setBusinessName('');
        setSubmittedBy('');
        setGpsData(null);
        setGpsError(null);
        loadInspections();
      } else {
        throw new Error(`Submission failed: ${response.statusText}`);
      }
      
    } catch (error) {
      console.error('Quick Shot submission failed:', error);
      
      // Save to offline queue if network request failed
      console.log('💾 Saving to offline queue due to network error...');
      saveToOfflineQueue(submissionData);
      showToast('📱 No internet connection. Submission saved offline and will be uploaded when connection is restored.', 'info', 6000);
      
      // Clear the form even though it's offline
      setSelectedImage(null);
      setBusinessName('');
      setSubmittedBy('');
      setGpsData(null);
      setGpsError(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage || !location.trim()) {
      alert('Please select an image and enter a location.');
      return;
    }

    setIsAnalyzing(true);
    setInspectionResult(null);

    try {
      const requestStartedAtMs = Date.now();
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
          notes: notes,
          submitted_by: submittedBy.trim() || 'Anonymous',
          gps_data: gpsData
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
        setSubmittedBy('');
        setSelectedLocations([]);
        setGpsData(null);
        setGpsError(null);
        loadInspections();
        loadDueInspections();
      } else if (response.status === 504 || response.status === 502) {
        // Backend may have completed despite the gateway timeout. Pull latest record and show it here.
        try {
          const listRes = await fetch(`${backendUrl}/api/inspections`, {
            headers: { 'session-token': sessionToken }
          });
          if (listRes.ok) {
            const items = await listRes.json();
            const startedAt = requestStartedAtMs;
            const candidates = items
              .filter(i => i && i.created_at)
              .map(i => ({ item: i, ts: Date.parse(i.created_at || 0) || 0 }))
              .filter(x => x.ts >= startedAt)
              .sort((a, b) => b.ts - a.ts);
            if (candidates.length > 0) {
              const latest = candidates[0].item;
              setInspectionResult({
                success: true,
                inspection_id: latest.id,
                analysis: latest.gemini_response || latest.analysis || {}
              });
              setSelectedImage(null);
              setLocation('');
              setNotes('');
              await loadInspections();
              await loadDueInspections();
              return; // Do not show the timeout alert since we recovered the result
            }
          }
        } catch (_) {
          // fall through to soft alert
        }
        await loadInspections();
        await loadDueInspections();
        alert('The analysis took longer than expected. We could not auto-retrieve the result, but it may have been saved. Please check the Validate or Data tabs.');
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
      
      // Save to offline queue if network request failed
      const submissionData = {
        image_base64: selectedImage.split(',')[1],
        location: location,
        notes: notes,
        submitted_by: submittedBy.trim() || 'Anonymous',
        gps_data: gpsData,
        mode: 'technician',
        timestamp: new Date().toISOString(),
        source: 'technician_mode'
      };
      
      console.log('💾 Saving technician submission to offline queue due to network error...');
      saveToOfflineQueue(submissionData);
      showToast('📱 No internet connection. Submission saved offline and will be uploaded when connection is restored.', 'info', 6000);
      
      // Clear the form even though it's offline
      setSelectedImage(null);
      setLocation('');
      setNotes('');
      setSubmittedBy('');
      setSelectedLocations([]);
      setGpsData(null);
      setGpsError(null);
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
        // Enhanced fields
        service_company_name: parsedData.service_company?.name || '',
        service_company_phone: parsedData.service_company?.phone || '',
        service_company_address: parsedData.service_company?.address || '',
        service_company_website: parsedData.service_company?.website || '',
        ae_number: parsedData.equipment_numbers?.ae_number || '',
        he_number: parsedData.equipment_numbers?.he_number || '',
        ee_number: parsedData.equipment_numbers?.ee_number || '',
        fe_number: parsedData.equipment_numbers?.fe_number || '',
        service_type: parsedData.service_details?.service_type || '',
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
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/15 backdrop-blur-sm border-b border-white/10">
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
              {/* Mode Toggle */}
              <div className="flex bg-white/10 rounded-lg p-1 mr-4">
                <button
                  onClick={() => setIsQuickShotMode(false)}
                  className={`px-3 py-1 rounded text-sm transition-all duration-300 ${
                    !isQuickShotMode
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  🔧 Technician
                </button>
                <button
                  onClick={() => setIsQuickShotMode(true)}
                  className={`px-3 py-1 rounded text-sm transition-all duration-300 ${
                    isQuickShotMode
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  ⚡ Quick Shot
                </button>
              </div>
              
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
                
                {/* User Login/Logout */}
                {currentUser ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-white/70 text-sm">👤 {currentUser}</span>
                    <button
                      onClick={logoutUser}
                      className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded hover:bg-red-500/30 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded hover:bg-blue-500/30 transition-colors"
                  >
                    👤 Login
                  </button>
                )}

                {/* Offline Queue Indicator */}
                {offlineQueue.length > 0 && (
                  <div 
                    className="flex items-center space-x-1 bg-orange-500/20 text-orange-400 px-2 py-1 rounded text-xs border border-orange-500/30 cursor-pointer hover:bg-orange-500/30 transition-colors"
                    onClick={processOfflineQueue}
                    title={`${offlineQueue.length} submissions queued offline. Click to retry upload.`}
                  >
                    <span>📱</span>
                    <span>{offlineQueue.length}</span>
                    {isProcessingOffline && <span className="animate-spin">⟳</span>}
                  </div>
                )}
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
              {/* Mobile Mode Toggle */}
              <div className="flex bg-white/10 rounded-lg p-1 mb-4">
                <button
                  onClick={() => {
                    setIsQuickShotMode(false);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex-1 px-3 py-2 rounded text-sm transition-all duration-300 ${
                    !isQuickShotMode
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  🔧 Technician
                </button>
                <button
                  onClick={() => {
                    setIsQuickShotMode(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex-1 px-3 py-2 rounded text-sm transition-all duration-300 ${
                    isQuickShotMode
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  ⚡ Quick Shot
                </button>
              </div>
              
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

      {/* Mobile Mode Toggle - Visible only on Capture page */}
      {currentPage === 'dashboard' && (
        <div className="md:hidden fixed top-20 left-0 right-0 z-40 bg-black/20 backdrop-blur-sm border-b border-white/10">
          <div className="container mx-auto px-4 py-3">
            <div className="flex bg-white/10 rounded-lg p-1">
              <button
                onClick={() => setIsQuickShotMode(false)}
                className={`flex-1 px-3 py-2 rounded text-sm transition-all duration-300 ${
                  !isQuickShotMode
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                🔧 Technician
              </button>
              <button
                onClick={() => setIsQuickShotMode(true)}
                className={`flex-1 px-3 py-2 rounded text-sm transition-all duration-300 ${
                  isQuickShotMode
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                ⚡ Quick Shot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={`relative z-10 container mx-auto px-4 py-8 ${currentPage === 'dashboard' ? 'main-content-with-mobile-toggle' : 'main-content'}`}>

        {currentPage === 'dashboard' && (
          <div className="space-y-8">
            {isQuickShotMode ? (
              /* Quick Shot Mode Interface */
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-md rounded-xl p-6 border border-orange-500/50">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-2xl">⚡</span>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Quick Shot Mode</h2>
                      <p className="text-white/70">Snap → Name → Submit → Go!</p>
                    </div>
                  </div>
                </div>

                {/* Quick Shot Form */}
                <div className="bg-white/8 backdrop-blur-md rounded-xl p-6 border border-white/20">
                  <div className="space-y-6">
                    {/* Submitted By Field */}
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        👤 Submitted By
                      </label>
                      <input
                        type="text"
                        placeholder="Your name (optional)"
                        value={submittedBy}
                        onChange={(e) => setSubmittedBy(e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    {/* Business Name Field - Front and Center */}
                    <div>
                      <label className="block text-white text-lg font-medium mb-3">
                        🏢 Business Name *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Enter business name"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          onFocus={() => setShowSuggestions(businessSuggestions.length > 0)}
                          className="w-full px-4 py-4 text-lg bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        
                        {/* Business Suggestions Dropdown */}
                        {showSuggestions && (businessSuggestions.length > 0 || isLoadingSuggestions) && (
                          <div className="absolute z-10 w-full mt-2 bg-black/90 backdrop-blur-md rounded-lg border border-white/20 max-h-64 overflow-y-auto">
                            {isLoadingSuggestions ? (
                              <div className="p-4 text-center text-white/70">
                                🔍 Finding nearby businesses...
                              </div>
                            ) : (
                              <>
                                <div className="p-3 border-b border-white/20">
                                  <div className="text-sm text-white/70 mb-2">📍 Nearby businesses based on GPS:</div>
                                </div>
                                {businessSuggestions.map((business, index) => (
                                  <button
                                    key={index}
                                    onClick={() => {
                                      setBusinessName(business.name);
                                      setShowSuggestions(false);
                                    }}
                                    className="w-full text-left p-3 hover:bg-white/10 transition-colors duration-300 border-b border-white/10 last:border-b-0"
                                  >
                                    <div className="text-white font-medium">{business.name}</div>
                                    {business.address && (
                                      <div className="text-white/60 text-sm">{business.address}</div>
                                    )}
                                    {business.rating && (
                                      <div className="text-yellow-400 text-sm">⭐ {business.rating}</div>
                                    )}
                                  </button>
                                ))}
                                <div className="p-3 border-t border-white/20">
                                  <button
                                    onClick={() => setShowSuggestions(false)}
                                    className="text-white/70 text-sm hover:text-white transition-colors duration-300"
                                  >
                                    ✏️ Or type custom business name
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {gpsData && businessSuggestions.length === 0 && !isLoadingSuggestions && (
                        <div className="mt-2 text-sm text-white/60">
                          📍 GPS captured but no businesses found nearby - you can enter any business name
                        </div>
                      )}
                    </div>

                    {/* Image Capture */}
                    <div className="space-y-4">
                      <div className="flex space-x-4">
                        <button
                          onClick={() => {
                            fileInputRef.current.click();
                            // Auto-capture GPS when selecting file for accurate location
                            if (!gpsData && !isCapturingGPS) {
                              captureGPS();
                            }
                          }}
                          className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-4 px-6 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
                        >
                          📁 Choose File
                        </button>
                        <button
                          onClick={() => {
                            setIsFireExtinguisherCameraOpen(true);
                            // Auto-capture GPS when camera opens for accurate location
                            if (!gpsData && !isCapturingGPS) {
                              captureGPS();
                            }
                          }}
                          className="flex-1 bg-gradient-to-r from-green-500 to-teal-600 text-white font-bold py-4 px-6 rounded-lg hover:from-green-600 hover:to-teal-700 transition-all duration-300 transform hover:scale-105"
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
                          <img src={selectedImage} alt="Selected" className="max-w-full h-48 object-cover rounded-lg border border-white/20 mx-auto" />
                        </div>
                      )}
                    </div>

                    {/* GPS Section */}
                    <div className="bg-black/20 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-white font-semibold">📍 GPS Location</h3>
                        <button
                          onClick={captureGPS}
                          disabled={isCapturingGPS}
                          className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded hover:bg-blue-500/30 transition-colors duration-300 disabled:opacity-50"
                        >
                          {isCapturingGPS ? '📡 Getting GPS...' : '📡 Capture GPS'}
                        </button>
                      </div>
                      
                      {gpsData && (
                        <div className="text-sm text-green-400">
                          ✅ GPS: {gpsData.latitude.toFixed(6)}, {gpsData.longitude.toFixed(6)} 
                          <span className="text-white/60 ml-2">(±{Math.round(gpsData.accuracy)}m)</span>
                        </div>
                      )}
                      
                      {gpsError && (
                        <div className="text-sm text-red-400">
                          ❌ GPS Error: {gpsError}
                        </div>
                      )}
                      
                      {!gpsData && !gpsError && !isCapturingGPS && (
                        <div className="text-sm text-white/60">
                          Click "Capture GPS" to get location automatically
                        </div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <button
                      onClick={submitQuickShot}
                      disabled={isSubmitting || !selectedImage || !businessName.trim()}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold py-4 px-6 rounded-lg hover:from-orange-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg"
                    >
                      {isSubmitting ? '🚀 Submitting...' : '🚀 Submit & Go!'}
                    </button>
                    
                    {!isSubmitting && (
                      <p className="text-center text-white/60 text-sm">
                        Submit immediately - processing happens in background
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Technician Mode Interface */
              <div className="space-y-8">
                {/* Image Upload Section */}
                <div className="bg-white/8 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">Upload Fire Extinguisher Tag</h2>
              
              <div className="space-y-4">
                <div className="flex space-x-4">
                  <button
                    onClick={() => {
                      fileInputRef.current.click();
                      // Auto-capture GPS when selecting file for accurate location
                      if (!gpsData && !isCapturingGPS) {
                        captureGPS();
                      }
                    }}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
                  >
                    📁 Choose File
                  </button>
                  <button
                    onClick={() => {
                      setIsFireExtinguisherCameraOpen(true);
                      // Auto-capture GPS when camera opens for accurate location
                      if (!gpsData && !isCapturingGPS) {
                        captureGPS();
                      }
                    }}
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

                {/* GPS Section */}
                <div className="bg-black/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-semibold">📍 GPS Location</h3>
                    <button
                      onClick={captureGPS}
                      disabled={isCapturingGPS}
                      className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded hover:bg-blue-500/30 transition-colors duration-300 disabled:opacity-50"
                    >
                      {isCapturingGPS ? '📡 Getting GPS...' : '📡 Capture GPS'}
                    </button>
                  </div>
                  
                  {gpsData && (
                    <div className="text-sm text-green-400">
                      ✅ GPS: {gpsData.latitude.toFixed(6)}, {gpsData.longitude.toFixed(6)} 
                      <span className="text-white/60 ml-2">(±{Math.round(gpsData.accuracy)}m)</span>
                    </div>
                  )}
                  
                  {gpsError && (
                    <div className="text-sm text-red-400">
                      ❌ GPS Error: {gpsError}
                    </div>
                  )}
                  
                  {!gpsData && !gpsError && !isCapturingGPS && (
                    <div className="text-sm text-white/60">
                      Click "Capture GPS" to get location automatically
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Submitted By Field */}
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      👤 Submitted By
                    </label>
                    <input
                      type="text"
                      placeholder="Your name (optional)"
                      value={submittedBy}
                      onChange={(e) => setSubmittedBy(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

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
                    <div className="space-y-4">
                      {/* Inspection Details Section */}
                      <div className="border-b border-white/20 pb-3">
                        <h4 className="text-sm font-semibold text-white/90 mb-2">📋 Inspection Details</h4>
                        <div className="space-y-1 text-sm">
                          {inspectionResult.analysis.last_inspection_date && <div><strong>Last Inspection:</strong> {formatDate(inspectionResult.analysis.last_inspection_date)}</div>}
                          {inspectionResult.analysis.next_due_date && <div><strong>Next Due:</strong> {formatDate(inspectionResult.analysis.next_due_date)}</div>}
                          {inspectionResult.analysis.condition && <div><strong>Condition:</strong> {inspectionResult.analysis.condition}</div>}
                          {inspectionResult.analysis.requires_attention !== undefined && (
                            <div><strong>Requires Attention:</strong> {inspectionResult.analysis.requires_attention ? 'Yes' : 'No'}</div>
                          )}
                        </div>
                      </div>

                      {/* Equipment Information Section */}
                      <div className="border-b border-white/20 pb-3">
                        <h4 className="text-sm font-semibold text-white/90 mb-2">🧯 Equipment Information</h4>
                        <div className="space-y-1 text-sm">
                          {inspectionResult.analysis.extinguisher_type && <div><strong>Type:</strong> {inspectionResult.analysis.extinguisher_type}</div>}
                          {inspectionResult.analysis.equipment_numbers && (
                            <div className="space-y-1">
                              {inspectionResult.analysis.equipment_numbers.ae_number && inspectionResult.analysis.equipment_numbers.ae_number !== 'unknown' && (
                                <div><strong>AE#:</strong> {inspectionResult.analysis.equipment_numbers.ae_number}</div>
                              )}
                              {inspectionResult.analysis.equipment_numbers.he_number && inspectionResult.analysis.equipment_numbers.he_number !== 'unknown' && (
                                <div><strong>HE#:</strong> {inspectionResult.analysis.equipment_numbers.he_number}</div>
                              )}
                              {inspectionResult.analysis.equipment_numbers.ee_number && inspectionResult.analysis.equipment_numbers.ee_number !== 'unknown' && (
                                <div><strong>EE#:</strong> {inspectionResult.analysis.equipment_numbers.ee_number}</div>
                              )}
                              {inspectionResult.analysis.equipment_numbers.fe_number && inspectionResult.analysis.equipment_numbers.fe_number !== 'unknown' && (
                                <div><strong>FE#:</strong> {inspectionResult.analysis.equipment_numbers.fe_number}</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Service Company Section */}
                      {inspectionResult.analysis.service_company && (
                        <div className="border-b border-white/20 pb-3">
                          <h4 className="text-sm font-semibold text-white/90 mb-2">🏢 Service Company</h4>
                          <div className="space-y-1 text-sm">
                            {inspectionResult.analysis.service_company.name && inspectionResult.analysis.service_company.name !== 'unknown' && (
                              <div><strong>Company:</strong> {inspectionResult.analysis.service_company.name}</div>
                            )}
                            {inspectionResult.analysis.service_company.address && inspectionResult.analysis.service_company.address !== 'unknown' && (
                              <div><strong>Address:</strong> {inspectionResult.analysis.service_company.address}</div>
                            )}
                            {inspectionResult.analysis.service_company.phone && inspectionResult.analysis.service_company.phone !== 'unknown' && (
                              <div><strong>Phone:</strong> {inspectionResult.analysis.service_company.phone}</div>
                            )}
                            {inspectionResult.analysis.service_company.website && inspectionResult.analysis.service_company.website !== 'unknown' && (
                              <div><strong>Website:</strong> {inspectionResult.analysis.service_company.website}</div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Service Details Section */}
                      {inspectionResult.analysis.service_details && (
                        <div className="border-b border-white/20 pb-3">
                          <h4 className="text-sm font-semibold text-white/90 mb-2">🔧 Service Details</h4>
                          <div className="space-y-1 text-sm">
                            {inspectionResult.analysis.service_details.service_type && inspectionResult.analysis.service_details.service_type !== 'unknown' && (
                              <div><strong>Service Type:</strong> {inspectionResult.analysis.service_details.service_type}</div>
                            )}
                            {inspectionResult.analysis.service_details.additional_services && inspectionResult.analysis.service_details.additional_services.length > 0 && (
                              <div><strong>Additional Services:</strong> {inspectionResult.analysis.service_details.additional_services.join(', ')}</div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Notes Section */}
                      {inspectionResult.analysis.maintenance_notes && (
                        <div className="pt-2">
                          <h4 className="text-sm font-semibold text-white/90 mb-2">📝 Notes</h4>
                          <div className="text-sm">{inspectionResult.analysis.maintenance_notes}</div>
                        </div>
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
                              src={`data:image/jpeg;base64,${inspection.image_base64}`} 
                              alt="Inspection reference"
                              className="max-w-sm max-h-64 object-contain rounded-lg border border-white/20 cursor-pointer hover:opacity-80 transition-opacity duration-300"
                              onClick={() => setModalImage(`data:image/jpeg;base64,${inspection.image_base64}`)}
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

                        {/* Enhanced Data Fields */}
                        <div className="border-t border-white/20 pt-4 mt-4">
                          <h4 className="text-white font-semibold mb-3">🏢 Service Company Information</h4>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-white font-semibold mb-2">Company Name:</label>
                              <input
                                type="text"
                                value={editFormData.service_company_name || ''}
                                onChange={(e) => setEditFormData({...editFormData, service_company_name: e.target.value})}
                                className="w-full px-3 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-white font-semibold mb-2">Phone:</label>
                              <input
                                type="text"
                                value={editFormData.service_company_phone || ''}
                                onChange={(e) => setEditFormData({...editFormData, service_company_phone: e.target.value})}
                                className="w-full px-3 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-white font-semibold mb-2">Address:</label>
                              <input
                                type="text"
                                value={editFormData.service_company_address || ''}
                                onChange={(e) => setEditFormData({...editFormData, service_company_address: e.target.value})}
                                className="w-full px-3 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-white font-semibold mb-2">Website:</label>
                              <input
                                type="text"
                                value={editFormData.service_company_website || ''}
                                onChange={(e) => setEditFormData({...editFormData, service_company_website: e.target.value})}
                                className="w-full px-3 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-white/20 pt-4 mt-4">
                          <h4 className="text-white font-semibold mb-3">🧯 Equipment Numbers</h4>
                          <div className="grid md:grid-cols-4 gap-4">
                            <div>
                              <label className="block text-white font-semibold mb-2">AE#:</label>
                              <input
                                type="text"
                                value={editFormData.ae_number || ''}
                                onChange={(e) => setEditFormData({...editFormData, ae_number: e.target.value})}
                                className="w-full px-3 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-white font-semibold mb-2">HE#:</label>
                              <input
                                type="text"
                                value={editFormData.he_number || ''}
                                onChange={(e) => setEditFormData({...editFormData, he_number: e.target.value})}
                                className="w-full px-3 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-white font-semibold mb-2">EE#:</label>
                              <input
                                type="text"
                                value={editFormData.ee_number || ''}
                                onChange={(e) => setEditFormData({...editFormData, ee_number: e.target.value})}
                                className="w-full px-3 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-white font-semibold mb-2">FE#:</label>
                              <input
                                type="text"
                                value={editFormData.fe_number || ''}
                                onChange={(e) => setEditFormData({...editFormData, fe_number: e.target.value})}
                                className="w-full px-3 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-white/20 pt-4 mt-4">
                          <h4 className="text-white font-semibold mb-3">🔧 Service Details</h4>
                          <div>
                            <label className="block text-white font-semibold mb-2">Service Type:</label>
                            <input
                              type="text"
                              value={editFormData.service_type || ''}
                              onChange={(e) => setEditFormData({...editFormData, service_type: e.target.value})}
                              className="w-full px-3 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
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
                                  <div className="space-y-3">
                                      {/* Inspection Details */}
                                      <div className="border-b border-white/20 pb-2">
                                          <div className="text-xs font-semibold text-white/90 mb-1">📋 INSPECTION</div>
                                          {parsed.last_inspection_date && <div><strong>Last:</strong> {formatDate(parsed.last_inspection_date)}</div>}
                                          {parsed.next_due_date && <div><strong>Due:</strong> {formatDate(parsed.next_due_date)}</div>}
                                          {parsed.condition && <div><strong>Condition:</strong> {parsed.condition}</div>}
                                          {parsed.requires_attention !== undefined && (
                                              <div><strong>Attention:</strong> {parsed.requires_attention ? 'Yes' : 'No'}</div>
                                          )}
                                      </div>

                                      {/* Equipment Info */}
                                      <div className="border-b border-white/20 pb-2">
                                          <div className="text-xs font-semibold text-white/90 mb-1">🧯 EQUIPMENT</div>
                                          {parsed.extinguisher_type && <div><strong>Type:</strong> {parsed.extinguisher_type}</div>}
                                          {parsed.equipment_numbers && (
                                              <div className="grid grid-cols-2 gap-1 text-xs">
                                                  {parsed.equipment_numbers.ae_number && parsed.equipment_numbers.ae_number !== 'unknown' && (
                                                      <div><strong>AE#:</strong> {parsed.equipment_numbers.ae_number}</div>
                                                  )}
                                                  {parsed.equipment_numbers.he_number && parsed.equipment_numbers.he_number !== 'unknown' && (
                                                      <div><strong>HE#:</strong> {parsed.equipment_numbers.he_number}</div>
                                                  )}
                                                  {parsed.equipment_numbers.ee_number && parsed.equipment_numbers.ee_number !== 'unknown' && (
                                                      <div><strong>EE#:</strong> {parsed.equipment_numbers.ee_number}</div>
                                                  )}
                                                  {parsed.equipment_numbers.fe_number && parsed.equipment_numbers.fe_number !== 'unknown' && (
                                                      <div><strong>FE#:</strong> {parsed.equipment_numbers.fe_number}</div>
                                                  )}
                                              </div>
                                          )}
                                      </div>

                                      {/* Service Company */}
                                      {parsed.service_company && (parsed.service_company.name !== 'unknown' || parsed.service_company.phone !== 'unknown') && (
                                          <div className="border-b border-white/20 pb-2">
                                              <div className="text-xs font-semibold text-white/90 mb-1">🏢 SERVICE</div>
                                              {parsed.service_company.name && parsed.service_company.name !== 'unknown' && (
                                                  <div><strong>Company:</strong> {parsed.service_company.name}</div>
                                              )}
                                              {parsed.service_company.phone && parsed.service_company.phone !== 'unknown' && (
                                                  <div><strong>Phone:</strong> {parsed.service_company.phone}</div>
                                              )}
                                              {parsed.service_details && parsed.service_details.service_type && parsed.service_details.service_type !== 'unknown' && (
                                                  <div><strong>Type:</strong> {parsed.service_details.service_type}</div>
                                              )}
                                          </div>
                                      )}

                                      {/* Notes */}
                                      {parsed.maintenance_notes && (
                                          <div className="pt-1">
                                              <div className="text-xs font-semibold text-white/90 mb-1">📝 NOTES</div>
                                              <div>{parsed.maintenance_notes}</div>
                                          </div>
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
                        <th className="px-4 py-3 text-left font-semibold">Service Company</th>
                        <th className="px-4 py-3 text-left font-semibold">Equipment #</th>
                        <th className="px-4 py-3 text-left font-semibold">Service Type</th>
                        <th className="px-4 py-3 text-left font-semibold">GPS Location</th>
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
                              {parsed.service_company?.name && parsed.service_company.name !== 'unknown' ? (
                                <div className="text-xs">
                                  <div className="font-medium">{parsed.service_company.name}</div>
                                  {parsed.service_company.phone && parsed.service_company.phone !== 'unknown' && (
                                    <div className="text-white/60">{parsed.service_company.phone}</div>
                                  )}
                                </div>
                              ) : 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {parsed.equipment_numbers ? (
                                <div className="text-xs">
                                  {parsed.equipment_numbers.ae_number && parsed.equipment_numbers.ae_number !== 'unknown' && (
                                    <div>AE: {parsed.equipment_numbers.ae_number}</div>
                                  )}
                                  {parsed.equipment_numbers.he_number && parsed.equipment_numbers.he_number !== 'unknown' && (
                                    <div>HE: {parsed.equipment_numbers.he_number}</div>
                                  )}
                                  {parsed.equipment_numbers.ee_number && parsed.equipment_numbers.ee_number !== 'unknown' && (
                                    <div>EE: {parsed.equipment_numbers.ee_number}</div>
                                  )}
                                  {parsed.equipment_numbers.fe_number && parsed.equipment_numbers.fe_number !== 'unknown' && (
                                    <div>FE: {parsed.equipment_numbers.fe_number}</div>
                                  )}
                                  {(!parsed.equipment_numbers.ae_number || parsed.equipment_numbers.ae_number === 'unknown') &&
                                   (!parsed.equipment_numbers.he_number || parsed.equipment_numbers.he_number === 'unknown') &&
                                   (!parsed.equipment_numbers.ee_number || parsed.equipment_numbers.ee_number === 'unknown') &&
                                   (!parsed.equipment_numbers.fe_number || parsed.equipment_numbers.fe_number === 'unknown') && 'N/A'}
                                </div>
                              ) : 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {parsed.service_details?.service_type && parsed.service_details.service_type !== 'unknown' 
                                ? parsed.service_details.service_type 
                                : 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {(() => {
                                if (inspection.gps_data) {
                                  try {
                                    const gps = typeof inspection.gps_data === 'string' ? JSON.parse(inspection.gps_data) : inspection.gps_data;
                                    if (gps.latitude && gps.longitude) {
                                      return (
                                        <div className="text-xs">
                                          <div className="text-green-400">📍 GPS</div>
                                          <div className="text-white/60">{gps.latitude.toFixed(4)}, {gps.longitude.toFixed(4)}</div>
                                        </div>
                                      );
                                    }
                                  } catch (e) {
                                    return <div className="text-xs text-white/60">GPS Captured</div>;
                                  }
                                }
                                return <div className="text-xs text-white/40">No GPS</div>;
                              })()}
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

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 rounded-xl p-6 border border-white/20 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">👤 Technician Login</h3>
            <p className="text-white/70 text-sm mb-4">
              Enter your name to track your submissions and enable attribution.
            </p>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const username = formData.get('username');
              loginUser(username);
            }}>
              <input
                name="username"
                type="text"
                placeholder="Enter your name"
                autoFocus
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              />
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="flex-1 bg-white/10 text-white font-bold py-3 px-6 rounded-lg hover:bg-white/20 transition-all duration-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`max-w-sm p-4 rounded-lg border backdrop-blur-md transform transition-all duration-300 animate-slide-in-right ${
                toast.type === 'success'
                  ? 'bg-green-500/20 border-green-500/50 text-green-400'
                  : toast.type === 'error'
                  ? 'bg-red-500/20 border-red-500/50 text-red-400'
                  : 'bg-blue-500/20 border-blue-500/50 text-blue-400'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-1 text-sm font-medium">
                  {toast.message}
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-white/60 hover:text-white transition-colors flex-shrink-0"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default App;