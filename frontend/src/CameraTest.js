import React, { useRef, useEffect } from 'react';

const CameraTest = ({ onExit }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        let stream;

        const openCamera = async () => {
            console.log("CameraTest: Attempting to open camera...");
            try {
                console.log("CameraTest: Requesting media devices...");
                stream = await navigator.mediaDevices.getUserMedia({ 
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                    }
                });
                
                console.log("CameraTest: Camera stream obtained.", stream);

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    console.log("CameraTest: Video source object set.");

                    const playPromise = videoRef.current.play();

                    if (playPromise !== undefined) {
                        playPromise.then(() => {
                            console.log("CameraTest: Camera preview is playing.");
                        }).catch(error => {
                            console.error("CameraTest: Error attempting to play video:", error);
                            alert("Error playing video. Check the browser console for more details.");
                        });
                    }
                } else {
                    console.error("CameraTest: videoRef is not available.");
                }
            } catch (error) {
                console.error("CameraTest: Error accessing camera:", error);
                alert(`Error accessing camera: ${error.name} - ${error.message}`);
            }
        };

        openCamera();

        // Cleanup function to stop the camera when the component unmounts
        return () => {
            if (stream) {
                console.log("CameraTest: Closing camera stream.");
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []); // The empty dependency array ensures this effect runs only once on mount.

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg">
                <h2 className="text-xl font-bold mb-4">Isolated Camera Test</h2>
                <p className="mb-2">If you see this, the test component is rendering. Check the DevTools console for logs.</p>
                <video ref={videoRef} style={{ width: '100%', maxWidth: '600px', border: '2px solid black' }} autoPlay playsInline muted />
                <button
                    onClick={onExit}
                    className="mt-4 w-full bg-red-500 text-white font-bold py-2 px-4 rounded-lg"
                >
                    Exit Test
                </button>
            </div>
        </div>
    );
};

export default CameraTest;