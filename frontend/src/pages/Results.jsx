import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { FiDownload, FiStar, FiSend, FiActivity, FiAlertTriangle, FiCheckCircle, FiArrowLeft } from 'react-icons/fi';
import { getPredictionDetail, getReport, downloadReport, submitFeedback } from '../api';

export default function Results() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    Promise.all([getPredictionDetail(id), getReport(id)])
      .then(([pred, rep]) => { setData(pred.data); setReport(rep.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownload = async (format) => {
    try {
      const res = await downloadReport(id, format);
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `seizure_report_${id}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const handleFeedback = async () => {
    if (!rating) return;
    try {
      await submitFeedback({ prediction_id: parseInt(id), rating, comment });
      setFeedbackSent(true);
    } catch (err) {
      console.error('Feedback failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-primary-400 font-heading text-lg">Preparing results...</p>
        </div>
      </div>
    );
  }

  if (!data) return <div className="min-h-screen pt-24 text-center text-gray-400">Prediction not found.</div>;

  const isSeizure = data.prediction === 'Seizure';
  const eegChartData = (data.eeg_data || []).map((v, i) => ({ point: i + 1, amplitude: v }));
  const confidence = (data.confidence * 100).toFixed(1);

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Link to="/upload" className="inline-flex items-center gap-2 text-gray-400 hover:text-primary-400 mb-6 transition-colors">
            <FiArrowLeft /> Back to Upload
          </Link>

          {/* Prediction Header */}
          <div className={`glass-card p-8 mb-6 border ${isSeizure ? 'border-red-500/30' : 'border-green-500/30'}`}>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className={`w-24 h-24 rounded-2xl flex items-center justify-center ${
                  isSeizure ? 'bg-red-500/20 shadow-glow-red' : 'bg-green-500/20 shadow-glow-green'
                }`}
              >
                {isSeizure ? <FiAlertTriangle className="text-red-400 text-4xl" /> : <FiCheckCircle className="text-green-400 text-4xl" />}
              </motion.div>
              <div className="text-center md:text-left flex-1">
                <h1 className="text-3xl font-heading font-bold text-white mb-2">
                  {isSeizure ? 'Seizure Detected' : 'No Seizure Detected'}
                </h1>
                <p className="text-gray-400">{data.filename} • {data.file_type?.toUpperCase()}</p>
              </div>
              <div className="text-center">
                <div className={`text-4xl font-heading font-bold ${isSeizure ? 'text-red-400' : 'text-green-400'}`}>
                  {confidence}%
                </div>
                <p className="text-gray-500 text-sm">Confidence</p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* EEG Signal Chart */}
            <div className="lg:col-span-2 glass-card p-6">
              <h2 className="text-xl font-heading font-semibold text-white mb-4 flex items-center gap-2">
                <FiActivity className="text-primary-400" /> EEG Signal Visualization
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={eegChartData}>
                  <defs>
                    <linearGradient id="colorAmp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isSeizure ? '#FF1744' : '#00D4FF'} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={isSeizure ? '#FF1744' : '#00D4FF'} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2030" />
                  <XAxis dataKey="point" stroke="#4a5568" tick={{ fontSize: 11 }} label={{ value: 'Data Point', position: 'insideBottom', offset: -5, style: { fill: '#718096', fontSize: 12 } }} />
                  <YAxis stroke="#4a5568" tick={{ fontSize: 11 }} label={{ value: 'Amplitude (μV)', angle: -90, position: 'insideLeft', style: { fill: '#718096', fontSize: 12 } }} />
                  <Tooltip
                    contentStyle={{ background: '#1e2030', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#e2e8f0' }}
                    labelStyle={{ color: '#00D4FF' }}
                  />
                  <Area type="monotone" dataKey="amplitude" stroke={isSeizure ? '#FF1744' : '#00D4FF'} fill="url(#colorAmp)" strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Signal Stats */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-heading font-semibold text-white mb-4">Signal Statistics</h2>
              <div className="space-y-4">
                {data.signal_stats && Object.entries(data.signal_stats).map(([key, val]) => (
                  <div key={key} className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-gray-400 text-sm capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="text-white font-mono text-sm">{typeof val === 'number' ? val.toFixed(2) : val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Report & Downloads */}
          {report && (
            <div className="glass-card p-6 mt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-heading font-semibold text-white">Medical Report</h2>
                <div className="flex gap-3">
                  {['pdf', 'docx', 'json'].map((fmt) => (
                    <button key={fmt} onClick={() => handleDownload(fmt)}
                      className="btn-secondary py-2 px-4 text-sm inline-flex items-center gap-1.5">
                      <FiDownload /> {fmt.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-primary-400 font-semibold mb-2">Interpretation</h3>
                  <p className="text-gray-300 leading-relaxed">{report.interpretation?.pattern}</p>
                </div>
                <div>
                  <h3 className="text-primary-400 font-semibold mb-2">Recommendations</h3>
                  <ul className="space-y-2">
                    {report.recommendations?.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                        <span className="text-primary-500 mt-1">•</span> {r}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
                  <p className="text-yellow-400/80 text-xs leading-relaxed">{report.disclaimer}</p>
                </div>
              </div>
            </div>
          )}

          {/* Feedback */}
          <div className="glass-card p-6 mt-6">
            <h2 className="text-xl font-heading font-semibold text-white mb-4">Rate This Analysis</h2>
            {feedbackSent ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center py-4 text-green-400 flex items-center justify-center gap-2">
                <FiCheckCircle /> Thank you for your feedback!
              </motion.div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <FiStar
                        size={28}
                        className={`${(hoverRating || rating) >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} transition-colors`}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="input-field h-24 resize-none"
                  placeholder="Share your thoughts on the prediction accuracy..."
                />
                <button onClick={handleFeedback} disabled={!rating}
                  className="btn-primary py-2 px-6 inline-flex items-center gap-2 disabled:opacity-50">
                  <FiSend /> Submit Feedback
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
