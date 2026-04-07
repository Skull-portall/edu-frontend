import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { metaAPI } from '../../services/api';
import { emailService } from '../../services/emailService';

const Register = () => {
 const [formData, setFormData] = useState({
 name: '', email: '', phoneNumber: '', password: '', password_confirmation: '',
 semesterId: '', departmentId: '', campusId: ''
 });
 const [semesters, setSemesters] = useState([]);
 const [departments, setDepartments] = useState([]);
 const [campuses, setCampuses] = useState([]);
 const [errors, setErrors] = useState({});
 const [loading, setLoading] = useState(false);
 const [step, setStep] = useState(1);
 const [loadingMeta, setLoadingMeta] = useState(true);
 const [showPassword, setShowPassword] = useState(false);
 const [showConfirmPassword, setShowConfirmPassword] = useState(false);

 const { register } = useAuth();
 const navigate = useNavigate();

 useEffect(() => {
 const fetchMetaData = async () => {
 try {
 const [semestersRes, departmentsRes, campusesRes] = await Promise.all([
 metaAPI.getSemesters(), metaAPI.getDepartments(), metaAPI.getCampuses()
 ]);
 setSemesters(semestersRes.data.data || []);
 setDepartments(departmentsRes.data.data || []);
 setCampuses(campusesRes.data.data || []);
 } catch (error) {
 console.error('Error fetching meta data:', error);
 } finally {
 setLoadingMeta(false);
 }
 };
 fetchMetaData();
 emailService.init();
 }, []);

 const handleChange = (e) => {
 setFormData({ ...formData, [e.target.name]: e.target.value });
 if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
 };

 const handleNextStep = () => {
 const stepErrors = {};
 if (step === 1) {
 if (!formData.name) stepErrors.name = 'Name is required';
 if (!formData.email) stepErrors.email = 'Email is required';
 if (!formData.phoneNumber) stepErrors.phoneNumber = 'Phone number is required';
 } else if (step === 2) {
 if (!formData.semesterId) stepErrors.semesterId = 'Semester is required';
 if (!formData.departmentId) stepErrors.departmentId = 'Department is required';
 if (!formData.campusId) stepErrors.campusId = 'Campus is required';
 }
 if (Object.keys(stepErrors).length > 0) {
 setErrors(stepErrors);
 } else {
 setErrors({});
 setStep(step + 1);
 }
 };

 const handleSubmit = async (e) => {
 e.preventDefault();
 setErrors({});
 setLoading(true);

 if (formData.password.length < 8) { setErrors({ password: 'Password must be at least 8 characters' }); setLoading(false); return; }
 const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
 if (!passwordRegex.test(formData.password)) { setErrors({ password: 'Password must contain uppercase, lowercase, number, and special character (@$!%*?&)' }); setLoading(false); return; }
 if (formData.password !== formData.password_confirmation) { setErrors({ password_confirmation: 'Passwords do not match' }); setLoading(false); return; }

 const result = await register(formData);
 if (result.success) {
 emailService.sendWelcomeEmail(formData.email, formData.name);
 navigate('/onboardingFeedback');
 } else {
 if (result.errors) {
 const errorObj = {};
 result.errors.forEach(err => { errorObj[err.path || err.field] = err.msg || err.message; });
 setErrors(errorObj);
 } else {
 setErrors({ general: result.message || 'Registration failed' });
 }
 }
 setLoading(false);
 };

 const inputClass = (field) =>
 `w-full px-4 py-3.5 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all font-medium text-red-600 focus:text-red-600 placeholder-gray-400 ${errors[field] ? 'border-red-400 focus:ring-red-500/50' : 'border-gray-200 focus:border-red-500'}`;

 const eyeIcon = (visible) => visible ? (
 <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
 ) : (
 <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
 );

 return (
 /* Always light/white — dark mode only available after login in Settings */
 <div className="min-h-screen bg-white flex font-sans">

 {/* ───── Left Auth Panel ───── */}
 <div className="w-full lg:w-[50%] flex flex-col items-center justify-center px-8 py-12 min-h-screen lg:min-h-0">
 
 {/* Mobile Logo */}
 <div className="lg:hidden flex justify-center mb-8 w-full">
 <Link to="/" className="flex items-center gap-2.5">
 <img src="/images/logo.svg" alt="eDu Live Logo" className="w-10 h-10" />
 <span className="text-2xl font-black text-gray-900 tracking-tight">eDu Live</span>
 </Link>
 </div>

 <div className="w-full max-w-md">
 <h2 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight mb-2">Join us.</h2>
 <p className="text-gray-500 font-medium mb-8">Create your account in a few simple steps.</p>

 {/* Stepper */}
 <div className="flex gap-2 mb-8">
 {[1, 2, 3].map(n => (
 <div key={n} className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${step >= n ? 'bg-red-500' : 'bg-gray-200'}`}></div>
 ))}
 </div>
 <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">
 Step {step} of 3 — {step === 1 ? 'Personal Info' : step === 2 ? 'Academic Info' : 'Set Password'}
 </p>

 <form className="space-y-5" onSubmit={handleSubmit}>
 {errors.general && (
 <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium border border-red-100">{errors.general}</div>
 )}

 {/* STEP 1 */}
 {step === 1 && (
 <div className="space-y-5">
 <div>
 <label className="block text-sm font-bold text-gray-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
 <input name="name" type="text" value={formData.name} onChange={handleChange} className={inputClass('name')} placeholder="John Doe" />
 {errors.name && <p className="text-red-500 text-xs font-bold mt-1">{errors.name}</p>}
 </div>
 <div>
 <label className="block text-sm font-bold text-gray-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
 <input name="email" type="email" value={formData.email} onChange={handleChange} className={inputClass('email')} placeholder="name@university.edu" />
 {errors.email && <p className="text-red-500 text-xs font-bold mt-1">{errors.email}</p>}
 </div>
 <div>
 <label className="block text-sm font-bold text-gray-700 mb-1.5">Phone Number <span className="text-red-500">*</span></label>
 <input name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleChange} className={inputClass('phoneNumber')} placeholder="+234 812 345 6789" />
 {errors.phoneNumber && <p className="text-red-500 text-xs font-bold mt-1">{errors.phoneNumber}</p>}
 </div>
 <button type="button" onClick={handleNextStep} className="w-full py-4 rounded-xl text-white font-bold bg-gray-900 hover:bg-gray-800 transition-colors shadow-lg">Continue Setup →</button>
 </div>
 )}

 {/* STEP 2 */}
 {step === 2 && (
 <div className="space-y-5">
 {[{name:'semesterId',label:'Semester',data:semesters,getText:s=>s.name||`Semester ${s.number}`},{name:'departmentId',label:'Department',data:departments,getText:d=>d.name},{name:'campusId',label:'Campus',data:campuses,getText:c=>c.name}].map(({name,label,data,getText}) => (
 <div key={name}>
 <label className="block text-sm font-bold text-gray-700 mb-1.5">{label} <span className="text-red-500">*</span></label>
 <select name={name} value={formData[name]} onChange={handleChange} disabled={loadingMeta} className={`${inputClass(name)} ${loadingMeta ? 'opacity-50' : ''}`}>
 <option value="">{loadingMeta ? 'Loading...' : `Select ${label.toLowerCase()}`}</option>
 {data.map(item => <option key={item._id} value={item._id}>{getText(item)}</option>)}
 </select>
 {errors[name] && <p className="text-red-500 text-xs font-bold mt-1">{errors[name]}</p>}
 </div>
 ))}
 <div className="flex gap-3 pt-1">
 <button type="button" onClick={() => setStep(1)} className="w-1/3 py-4 rounded-xl text-gray-700 font-bold bg-white border border-gray-200 hover:bg-gray-50 transition-colors">← Back</button>
 <button type="button" onClick={handleNextStep} className="w-2/3 py-4 rounded-xl text-white font-bold bg-gray-900 hover:bg-gray-800 transition-colors shadow-lg">Continue →</button>
 </div>
 </div>
 )}

 {/* STEP 3 */}
 {step === 3 && (
 <div className="space-y-5">
 <div>
 <label className="block text-sm font-bold text-gray-700 mb-1.5">Secure Password <span className="text-red-500">*</span></label>
 <div className="relative">
 <input name="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleChange} className={`${inputClass('password')} pr-10`} placeholder="••••••••" />
 <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 :text-gray-400">{eyeIcon(showPassword)}</button>
 </div>
 {errors.password && <p className="text-red-500 text-xs font-bold mt-1">{errors.password}</p>}
 </div>
 <div>
 <label className="block text-sm font-bold text-gray-700 mb-1.5">Confirm Password <span className="text-red-500">*</span></label>
 <div className="relative">
 <input name="password_confirmation" type={showConfirmPassword ? "text" : "password"} value={formData.password_confirmation} onChange={handleChange} className={`${inputClass('password_confirmation')} pr-10`} placeholder="••••••••" />
 <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 :text-gray-400">{eyeIcon(showConfirmPassword)}</button>
 </div>
 {errors.password_confirmation && <p className="text-red-500 text-xs font-bold mt-1">{errors.password_confirmation}</p>}
 </div>
 <div className="flex gap-3 pt-1">
 <button type="button" onClick={() => setStep(2)} className="w-1/3 py-4 rounded-xl text-gray-700 font-bold bg-white border border-gray-200 hover:bg-gray-50 transition-colors">← Back</button>
 <button type="submit" disabled={loading} className="w-2/3 flex justify-center items-center gap-2 py-4 rounded-xl text-white font-bold bg-red-600 hover:bg-red-500 focus:ring-4 focus:ring-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)]">
 {loading ? <><svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Creating...</> : 'COMPLETE ✓'}
 </button>
 </div>
 </div>
 )}

 <p className="text-center text-sm font-medium text-gray-500 pt-4">
 Already have an account? <Link to="/login" className="text-red-600 font-bold hover:text-red-500 transition-colors">Sign In</Link>
 </p>
 </form>
 </div>
 </div>

 {/* ───── RIGHT: Info Panel ───── */}
 <div className="hidden lg:flex lg:w-1/2 sticky top-0 h-screen bg-gradient-to-br from-gray-950 via-red-950 to-gray-900 items-center justify-center p-10 overflow-hidden">
 {/* Decorative blobs */}
 <div className="absolute top-[-5%] right-[-5%] w-[45%] h-[45%] bg-red-600/20 blur-[80px] rounded-full pointer-events-none" />
 <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] bg-rose-600/15 blur-[60px] rounded-full pointer-events-none" />
 <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

 <div className="relative z-10 w-full max-w-md flex flex-col items-center text-center">
          {/* Logo — centered */}
          <Link to="/" className="mb-6 block group cursor-pointer">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg flex items-center justify-center border border-white/10 mx-auto group-hover:bg-white/20 group-hover:scale-105 transition-all duration-300">
              <img src="/images/logo.svg" alt="eDu Live Logo" className="w-11 h-11 object-contain" />
            </div>
            <p className="text-white/60 text-xs font-semibold mt-2 tracking-widest uppercase group-hover:text-white transition-colors">eDu Live</p>
          </Link>

 {/* Headline — centered */}
 <h2 className="text-3xl lg:text-4xl font-black text-white leading-[1.15] tracking-tight mb-8 px-2">
 Empowering <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-400">Students</span> everywhere.
 </h2>

 {/* 3-column grid cards */}
 <div className="grid grid-cols-3 gap-3 w-full">
 {[
 { icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', title: 'Secure Access', desc: 'Enterprise-grade security.' },
 { icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', title: 'Campus Hub', desc: 'Connect with peers.' },
 { icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', title: 'Knowledge', desc: 'Notes & past papers.' },
 ].map((item, i) => (
 <div key={i} className="flex flex-col items-center text-center p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
 <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/20 flex items-center justify-center text-red-400 mb-3">
 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
 </svg>
 </div>
 <h3 className="text-white font-black text-xs tracking-tight mb-1">{item.title}</h3>
 <p className="text-gray-400 font-medium text-[10px] leading-relaxed">{item.desc}</p>
 </div>
 ))}
 </div>
 </div>
 </div>

 </div>
 );
};

export default Register;
