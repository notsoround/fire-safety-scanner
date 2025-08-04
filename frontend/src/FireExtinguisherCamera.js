import React, { useRef, useEffect, useState } from 'react';

const FireExtinguisherCamera = ({ onExit, onCapture }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let stream;

        const openCamera = async () => {
            console.log("FireExtinguisherCamera: Attempting to open camera...");
            try {
                setIsLoading(true);
                setError(null);
                
                console.log("FireExtinguisherCamera: Requesting media devices...");
                stream = await navigator.mediaDevices.getUserMedia({ 
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                    }
                });
                
                console.log("FireExtinguisherCamera: Camera stream obtained.", stream);

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    console.log("FireExtinguisherCamera: Video source object set.");

                    const playPromise = videoRef.current.play();

                    if (playPromise !== undefined) {
                        playPromise.then(() => {
                            console.log("FireExtinguisherCamera: Camera preview is playing.");
                            setIsLoading(false);
                        }).catch(error => {
                            console.error("FireExtinguisherCamera: Error attempting to play video:", error);
                            setError("Error playing video. Check the browser console for more details.");
                            setIsLoading(false);
                        });
                    }
                } else {
                    console.error("FireExtinguisherCamera: videoRef is not available.");
                    setError("Video element not available.");
                    setIsLoading(false);
                }
            } catch (error) {
                console.error("FireExtinguisherCamera: Error accessing camera:", error);
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
                setError(errorMessage);
                setIsLoading(false);
            }
        };

        openCamera();

        // Cleanup function to stop the camera when the component unmounts
        return () => {
            if (stream) {
                console.log("FireExtinguisherCamera: Closing camera stream.");
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []); // The empty dependency array ensures this effect runs only once on mount.

    const capturePhoto = () => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        
        if (!video || !canvas || !video.srcObject) {
            console.error("FireExtinguisherCamera: Cannot capture - video or canvas not available");
            return;
        }
        
        console.log("FireExtinguisherCamera: Capturing photo...");
        
        const context = canvas.getContext('2d');
        
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw the full video frame to canvas
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        
        // Create a new canvas for the cropped image with fire extinguisher tag shape
        const croppedCanvas = document.createElement('canvas');
        const croppedContext = croppedCanvas.getContext('2d');
        
        // Set dimensions for the fire extinguisher tag shape (300x500 aspect ratio)
        const tagWidth = 300;
        const tagHeight = 500;
        croppedCanvas.width = tagWidth;
        croppedCanvas.height = tagHeight;
        
        // Calculate scaling to fit the video into the tag dimensions
        const scaleX = tagWidth / video.videoWidth;
        const scaleY = tagHeight / video.videoHeight;
        const scale = Math.max(scaleX, scaleY); // Use max to ensure full coverage
        
        const scaledWidth = video.videoWidth * scale;
        const scaledHeight = video.videoHeight * scale;
        
        // Center the scaled image
        const offsetX = (tagWidth - scaledWidth) / 2;
        const offsetY = (tagHeight - scaledHeight) / 2;
        
        // Apply the fire extinguisher tag clip path
        croppedContext.save();
        croppedContext.beginPath();
        
        // Fire extinguisher tag shape: polygon(0 4%, 4% 0, 96% 0, 100% 4%, 100% 100%, 0 100%)
        const clipPath = [
            [0, tagHeight * 0.04],           // 0 4%
            [tagWidth * 0.04, 0],            // 4% 0
            [tagWidth * 0.96, 0],            // 96% 0
            [tagWidth, tagHeight * 0.04],    // 100% 4%
            [tagWidth, tagHeight],           // 100% 100%
            [0, tagHeight]                   // 0 100%
        ];
        
        croppedContext.moveTo(clipPath[0][0], clipPath[0][1]);
        for (let i = 1; i < clipPath.length; i++) {
            croppedContext.lineTo(clipPath[i][0], clipPath[i][1]);
        }
        croppedContext.closePath();
        croppedContext.clip();
        
        // Draw the scaled video frame
        croppedContext.drawImage(video, offsetX, offsetY, scaledWidth, scaledHeight);
        croppedContext.restore();
        
        // Convert to base64 data URL
        const imageData = croppedCanvas.toDataURL('image/jpeg', 0.9);
        
        console.log("FireExtinguisherCamera: Photo captured and cropped to fire extinguisher tag shape");
        
        // Call the onCapture callback with the cropped image
        if (onCapture) {
            onCapture(imageData);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
            <div className="relative">
                {/* Loading State */}
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        <div className="bg-white/90 rounded-lg p-6 text-center">
                            <div className="loading-spinner mx-auto mb-4"></div>
                            <p className="text-gray-800">Initializing camera...</p>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        <div className="bg-red-100 border border-red-400 rounded-lg p-6 text-center max-w-md">
                            <h3 className="text-red-800 font-bold mb-2">Camera Error</h3>
                            <p className="text-red-700 text-sm mb-4">{error}</p>
                            <button
                                onClick={onExit}
                                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}

                {/* Camera Preview Container with Fire Extinguisher Tag Shape */}
                <div className="camera-preview-wrapper">
                    <div className="camera-preview-container">
                        <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            muted
                            className="w-full h-full object-cover"
                            style={{
                                clipPath: 'polygon(0 4%, 4% 0, 96% 0, 100% 4%, 100% 100%, 0 100%)'
                            }}
                        />
                        
                        {/* Fire Extinguisher Tag Overlay */}
                        <div className="camera-preview-overlay"></div>
                        
                        {/* Capture Button - positioned within the styled preview */}
                        {!isLoading && !error && (
                            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                                <button
                                    onClick={capturePhoto}
                                    className="bg-gradient-to-r from-green-500 to-teal-600 text-white font-bold py-3 px-6 rounded-full hover:from-green-600 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                                >
                                    📷 Capture Photo
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {/* Exit Button - positioned outside the preview */}
                    <button
                        onClick={onExit}
                        className="mt-4 bg-gray-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-700 transition-colors duration-300"
                    >
                        ❌ Cancel
                    </button>
                </div>
                
                {/* Hidden canvas for image processing */}
                <canvas ref={canvasRef} className="hidden" />
            </div>
        </div>
    );
};

export default FireExtinguisherCamera;