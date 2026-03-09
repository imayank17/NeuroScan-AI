import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUploadCloud, FiFile, FiX, FiCpu, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import { uploadEEG } from '../api';

export default function Upload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
  });

  const handleAnalyze = async () => {
    if (!file) return;
    setUploading(true);
    setError('');

    // Simulate progress
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) { clearInterval(interval); return 90; }
        return p + Math.random() * 15;
      });
    }, 300);

    try {
      const res = await uploadEEG(file);
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => navigate(`/results/${res.data.id}`), 500);
    } catch (err) {
      clearInterval(interval);
      setProgress(0);
      setError(err.response?.data?.detail || 'Upload failed. Please try again.');
      setUploading(false);
    }
  };

  const fileSize = file ? (file.size / 1024).toFixed(1) + ' KB' : '';
  const fileIcon = file?.name?.endsWith('.csv') ? '📊' : file?.name?.match(/\.(png|jpg|jpeg)$/i) ? '🖼️' : '📄';

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-heading font-bold text-white mb-3">Upload EEG Data</h1>
            <p className="text-gray-400 text-lg">Upload your EEG recording for AI-powered seizure detection</p>
          </div>

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`glass-card p-12 text-center cursor-pointer transition-all duration-300 
              ${isDragActive ? 'border-primary-500 bg-primary-500/5 shadow-glow-cyan' : 'hover:border-primary-500/30'}
              ${file ? 'border-green-500/30' : ''}`}
          >
            <input {...getInputProps()} />
            <AnimatePresence mode="wait">
              {file ? (
                <motion.div key="file" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                  <div className="text-5xl mb-4">{fileIcon}</div>
                  <p className="text-white font-semibold text-lg">{file.name}</p>
                  <p className="text-gray-400 text-sm mt-1">{fileSize}</p>
                  <button onClick={(e) => { e.stopPropagation(); setFile(null); setError(''); }}
                    className="mt-4 text-red-400 hover:text-red-300 inline-flex items-center gap-1 text-sm">
                    <FiX /> Remove file
                  </button>
                </motion.div>
              ) : (
                <motion.div key="dropzone" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <FiUploadCloud className="text-5xl text-primary-400 mx-auto mb-4" />
                  <p className="text-white text-lg font-medium mb-2">
                    {isDragActive ? 'Drop your file here' : 'Drag & drop your EEG file'}
                  </p>
                  <p className="text-gray-500 text-sm">or click to browse</p>
                  <div className="flex justify-center gap-3 mt-4">
                    {['CSV', 'PNG', 'JPG', 'PDF'].map((t) => (
                      <span key={t} className="px-3 py-1 rounded-full bg-dark-200 border border-white/5 text-xs text-gray-400">{t}</span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Info */}
          <div className="grid sm:grid-cols-2 gap-4 mt-6">
            <div className="glass-card p-4 flex items-start gap-3">
              <FiCheckCircle className="text-green-400 text-lg mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-white font-medium">CSV Format (Best)</p>
                <p className="text-xs text-gray-500">178 EEG data points for accurate prediction</p>
              </div>
            </div>
            <div className="glass-card p-4 flex items-start gap-3">
              <FiAlertTriangle className="text-yellow-400 text-lg mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-white font-medium">Image/PDF</p>
                <p className="text-xs text-gray-500">Preview shown with simulated analysis</p>
              </div>
            </div>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mt-6 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </motion.div>
          )}

          {/* Progress */}
          {uploading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
              <div className="flex items-center gap-3 mb-2">
                <FiCpu className="text-primary-400 animate-pulse" />
                <span className="text-sm text-gray-400">
                  {progress < 30 ? 'Uploading EEG data...' : progress < 70 ? 'Running AI analysis...' : progress < 100 ? 'Generating results...' : 'Complete!'}
                </span>
                <span className="text-sm text-primary-400 ml-auto">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-dark-200 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          )}

          {/* Analyze button */}
          {file && !uploading && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 text-center">
              <button onClick={handleAnalyze} className="btn-primary text-lg inline-flex items-center gap-2">
                <FiCpu /> Start AI Analysis
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
