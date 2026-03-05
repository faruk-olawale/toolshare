import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Shield, Upload, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

const ID_TYPES = [
  { value: 'nin', label: 'NIN (National Identity Number)' },
  { value: 'passport', label: 'International Passport' },
  { value: 'drivers_license', label: "Driver's License" },
  { value: 'voters_card', label: "Voter's Card" },
];

export default function KYCVerification() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [kycStatus, setKycStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ idType: '', idNumber: '' });
  const [idFile, setIdFile] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [idPreview, setIdPreview] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);

  useEffect(() => {
    api.get('/kyc/status').then(({ data }) => {
      setKycStatus(data.kyc);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    if (type === 'id') { setIdFile(file); setIdPreview(preview); }
    else { setSelfieFile(file); setSelfiePreview(preview); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!idFile) return toast.error('Please upload your ID document.');
    if (!selfieFile) return toast.error('Please upload a selfie photo.');
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('idType', form.idType);
      formData.append('idNumber', form.idNumber);
      formData.append('idDocument', idFile);
      formData.append('selfie', selfieFile);

      const { data } = await api.post('/kyc/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(data.message);
      setKycStatus(data.kyc);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed.');
    } finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="py-12 page-container max-w-2xl">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-100 rounded w-48" />
        <div className="h-48 bg-gray-100 rounded-2xl" />
      </div>
    </div>
  );

  const StatusBanner = () => {
    if (!kycStatus || kycStatus.status === 'not_submitted') return null;
    const config = {
      pending: { icon: <Clock size={20} />, color: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-800', title: 'Under Review', msg: 'Your documents are being reviewed. This usually takes under 24 hours.' },
      approved: { icon: <CheckCircle size={20} />, color: 'bg-green-50 border-green-200', text: 'text-green-800', title: 'Identity Verified ✅', msg: 'Your identity has been verified. You have full access to ToolShare Africa.' },
      rejected: { icon: <XCircle size={20} />, color: 'bg-red-50 border-red-200', text: 'text-red-800', title: 'Verification Failed', msg: kycStatus.rejectionReason || 'Your documents could not be verified. Please resubmit.' },
    }[kycStatus.status];

    return (
      <div className={`card p-5 mb-6 border ${config.color}`}>
        <div className="flex items-start gap-3">
          <div className={config.text}>{config.icon}</div>
          <div>
            <p className={`font-semibold ${config.text}`}>{config.title}</p>
            <p className={`text-sm mt-0.5 ${config.text} opacity-80`}>{config.msg}</p>
          </div>
        </div>
        {kycStatus.status === 'approved' && (
          <button onClick={() => navigate('/dashboard')} className="btn-primary mt-4 w-full">Go to Dashboard →</button>
        )}
      </div>
    );
  };

  return (
    <div className="py-8 animate-fade-in">
      <div className="page-container max-w-2xl">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield size={28} className="text-brand-500" />
          </div>
          <h1 className="section-title mb-2">Identity Verification</h1>
          <p className="text-gray-500">Verify your identity to unlock full access to ToolShare Africa</p>
        </div>

        <StatusBanner />

        {/* Why we need this */}
        <div className="card p-5 mb-6 bg-gradient-to-br from-brand-50 to-earth-50 border-brand-100">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <AlertCircle size={16} className="text-brand-500" /> Why we verify identity
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-600">
            {[
              { icon: '🔒', text: 'Prevents fraud and fake accounts' },
              { icon: '🤝', text: 'Builds trust between owners and renters' },
              { icon: '⚡', text: 'Faster dispute resolution' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-start gap-2">
                <span className="text-lg">{icon}</span><span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {(kycStatus?.status === 'not_submitted' || kycStatus?.status === 'rejected' || !kycStatus) && (
          <div className="card p-6">
            <h3 className="font-display font-bold text-lg text-gray-900 mb-6">
              {kycStatus?.status === 'rejected' ? 'Resubmit Documents' : 'Submit Your Documents'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* ID Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ID Type</label>
                <select className="input-field" value={form.idType} onChange={e => setForm({ ...form, idType: e.target.value })} required>
                  <option value="">Select your ID type</option>
                  {ID_TYPES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>

              {/* ID Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ID Number</label>
                <input type="text" className="input-field" placeholder="Enter your ID number"
                  value={form.idNumber} onChange={e => setForm({ ...form, idNumber: e.target.value })} required />
              </div>

              {/* ID Document Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  ID Document Photo <span className="text-gray-400 font-normal">(clear photo of your ID card/passport)</span>
                </label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-brand-300 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('idDoc').click()}>
                  {idPreview ? (
                    <img src={idPreview} className="max-h-40 mx-auto rounded-lg object-contain" />
                  ) : (
                    <div className="py-4">
                      <Upload size={24} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500">Click to upload ID document</p>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG or PDF · Max 10MB</p>
                    </div>
                  )}
                  <input id="idDoc" type="file" className="hidden" accept="image/*,.pdf" onChange={e => handleFileChange(e, 'id')} />
                </div>
              </div>

              {/* Selfie Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Selfie with ID <span className="text-gray-400 font-normal">(hold your ID next to your face)</span>
                </label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-brand-300 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('selfie').click()}>
                  {selfiePreview ? (
                    <img src={selfiePreview} className="max-h-40 mx-auto rounded-lg object-contain" />
                  ) : (
                    <div className="py-4">
                      <Upload size={24} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500">Click to upload selfie</p>
                      <p className="text-xs text-gray-400 mt-1">JPG or PNG · Max 10MB</p>
                    </div>
                  )}
                  <input id="selfie" type="file" className="hidden" accept="image/*" onChange={e => handleFileChange(e, 'selfie')} />
                </div>
              </div>

              {/* Tips */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-sm font-medium text-blue-800 mb-2">📸 Tips for a successful submission</p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Make sure your ID is clearly readable with no blur</li>
                  <li>• Ensure your face is clearly visible in the selfie</li>
                  <li>• Take photos in good lighting</li>
                  <li>• All four corners of the ID should be visible</li>
                </ul>
              </div>

              <button type="submit" disabled={submitting} className="btn-primary w-full py-4 text-base">
                {submitting ? 'Submitting...' : 'Submit for Verification →'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}