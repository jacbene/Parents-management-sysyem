import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, RefreshCw, Check, VideoOff, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Student } from '../types';

interface StudentCameraModalProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedStudent: Student) => void;
}

export default function StudentCameraModal({ student, isOpen, onClose, onUpdate }: StudentCameraModalProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Auto-initiate camera stream when modal opens
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    setIsActivating(true);
    setCameraError(null);
    setPhoto(null);
    stopCamera();

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 400, height: 400, facingMode: 'user' },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(e => console.error("Error playing video:", e));
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      let expl = "Impossible d'accéder à l'appareil photo.";
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        expl = "L'accès à la caméra a été refusé par l'utilisateur ou le navigateur. Veuillez autoriser la caméra dans l'URL/les paramètres de votre navigateur.";
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        expl = "Aucun appareil photo n'a été trouvé sur ce périphérique.";
      }
      setCameraError(expl);
    } finally {
      setIsActivating(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // We want a square crop for the avatar
    const size = Math.min(video.videoWidth, video.videoHeight);
    const startX = (video.videoWidth - size) / 2;
    const startY = (video.videoHeight - size) / 2;

    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Draw image cropped to a square center zone
      ctx.drawImage(video, startX, startY, size, size, 0, 0, 300, 300);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setPhoto(dataUrl);
      stopCamera();
    }
  };

  // Safe callback to read uploaded file if camera isn't working
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result && typeof event.target.result === 'string') {
        setPhoto(event.target.result);
        stopCamera();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAvatar = async () => {
    if (!photo) return;

    setSaving(true);
    try {
      const studentDocRef = doc(db, 'students', student.id);
      await updateDoc(studentDocRef, { avatar: photo });
      
      onUpdate({
        ...student,
        avatar: photo
      });
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `students/${student.id}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-3xl w-full max-w-md border border-gray-150 shadow-2xl overflow-hidden"
          >
            {/* Modal Header */}
            <div className="p-5 bg-indigo-600 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Avatar de {student.name}
                </h3>
                <p className="text-xs text-indigo-100">Personnalisez la photo de profil de votre enfant.</p>
              </div>
              <button
                onClick={onClose}
                className="text-white/70 hover:text-white cursor-pointer p-1 rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5">
              
              {/* Camera view screen area */}
              <div className="relative aspect-square w-full max-w-xs mx-auto rounded-2xl overflow-hidden border border-gray-250 bg-slate-900 flex items-center justify-center shadow-inner">
                {isActivating && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white space-y-2">
                    <span className="h-8 w-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] font-mono tracking-wider">Mise en route de la caméra...</p>
                  </div>
                )}

                {cameraError && !photo && (
                  <div className="p-4 text-center space-y-4">
                    <div className="flex justify-center">
                      <VideoOff className="h-8 w-8 text-rose-500" />
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                      {cameraError}
                    </p>
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs transition">
                      <Upload className="h-4 w-4" /> Importer un fichier photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                {/* Live stream */}
                {stream && !photo && (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover scale-x-[-1]" // horizontal mirror flip for better feel
                    />
                    
                    {/* Face aligner guideline circles */}
                    <div className="absolute inset-0 border-[3px] border-dashed border-indigo-400/50 rounded-full m-8 pointer-events-none flex items-center justify-center">
                      <span className="text-[10px] uppercase font-bold text-indigo-200/80 bg-slate-900/50 px-2 py-0.5 rounded-full">
                        Centrer ici
                      </span>
                    </div>
                  </>
                )}

                {/* Taken Snapshot preview */}
                {photo && (
                  <img
                    src={photo}
                    alt="Snapshot Preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>

              {/* Hidden canvas for image cropping */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Action Operations Panel */}
              <div className="flex flex-col gap-3">
                {stream && !photo && (
                  <button
                    type="button"
                    onClick={handleCapture}
                    className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-indigo-100"
                  >
                    <Camera className="h-4 w-4" /> Prendre la photo
                  </button>
                )}

                {photo && (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={startCamera}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Recommencer
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={handleSaveAvatar}
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                          Sauvegarde...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" /> Confirmer la Photo
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Import alternative link if camera is active */}
                {stream && !photo && (
                  <div className="text-center">
                    <label className="text-xs text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer flex items-center justify-center gap-1.5 py-1">
                      <Upload className="h-3.5 w-3.5" /> Ou importer un fichier au lieu de filmer
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
