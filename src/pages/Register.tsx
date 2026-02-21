import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Eye, EyeOff, ArrowRight, ArrowLeft, Check, Loader2, Mail, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ComplianceAnimations from "@/components/ComplianceAnimations";
import PasswordStrength from "@/components/PasswordStrength";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu & Kashmir", "Ladakh", "Chandigarh", "Puducherry",
];

const BUSINESS_TYPES = ["Pvt Ltd", "LLP", "Proprietorship", "Partnership"];
const INDUSTRY_TYPES = ["IT/Software", "Manufacturing", "BFSI", "Healthcare", "Retail", "Logistics", "Education", "Real Estate", "Agriculture", "Others"];
const TURNOVER_RANGES = ["Below ₹40L", "₹40L – ₹1.5Cr", "₹1.5Cr – ₹5Cr", "₹5Cr – ₹25Cr", "₹25Cr – ₹100Cr", "Above ₹100Cr"];

const DISPOSABLE_DOMAINS = ["tempmail.com", "guerrillamail.com", "yopmail.com", "mailinator.com", "throwaway.email", "temp-mail.org", "fakeinbox.com", "sharklasers.com", "guerrillamailblock.com", "grr.la", "dispostable.com"];

const TEMP_OTP = "123456"; // Demo OTP

function validatePAN(pan: string) {
  return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan.toUpperCase());
}

function validateGSTIN(gstin: string) {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin.toUpperCase());
}

function isDisposableEmail(email: string) {
  const domain = email.split("@")[1]?.toLowerCase();
  return DISPOSABLE_DOMAINS.includes(domain);
}

const inputCls = "w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";
const selectCls = "w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none";
const labelCls = "text-sm font-medium text-foreground mb-1.5 block";
const errorCls = "text-xs text-destructive mt-1";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);

  // Step 1 fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  // OTP states
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailTimer, setEmailTimer] = useState(0);
  const [phoneTimer, setPhoneTimer] = useState(0);

  // Step 2 fields
  const [companyName, setCompanyName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [industryType, setIndustryType] = useState("");
  const [stateReg, setStateReg] = useState("");
  const [pan, setPan] = useState("");
  const [domainEmail, setDomainEmail] = useState("");
  const [gstin, setGstin] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");
  const [annualTurnover, setAnnualTurnover] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Timers
  useEffect(() => {
    if (emailTimer <= 0) return;
    const t = setInterval(() => setEmailTimer(v => v - 1), 1000);
    return () => clearInterval(t);
  }, [emailTimer]);

  useEffect(() => {
    if (phoneTimer <= 0) return;
    const t = setInterval(() => setPhoneTimer(v => v - 1), 1000);
    return () => clearInterval(t);
  }, [phoneTimer]);

  const validateStep1Fields = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = "Full name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Invalid email format";
    else if (isDisposableEmail(email)) e.email = "Disposable/temporary emails are not allowed";
    if (!phone.trim()) e.phone = "Mobile number is required";
    else if (!/^(\+91[\s-]?)?[6-9]\d{9}$/.test(phone.replace(/\s/g, ""))) e.phone = "Invalid Indian mobile number";
    if (!password) e.password = "Password is required";
    else if (password.length < 8) e.password = "Minimum 8 characters";
    else if (password.length > 20) e.password = "Maximum 20 characters";
    if (password !== confirmPw) e.confirmPw = "Passwords do not match";
    if (!termsAccepted) e.terms = "You must accept the Terms & Conditions";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const sendEmailOtp = () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors(prev => ({ ...prev, email: "Enter a valid email first" }));
      return;
    }
    if (isDisposableEmail(email)) {
      setErrors(prev => ({ ...prev, email: "Disposable/temporary emails are not allowed" }));
      return;
    }
    setEmailOtpSent(true);
    setEmailTimer(120);
    setErrors(prev => { const { email: _, ...rest } = prev; return rest; });
    toast({ title: "OTP Sent", description: `Verification code sent to ${email} (Demo: ${TEMP_OTP})` });
  };

  const verifyEmailOtp = () => {
    if (emailOtp === TEMP_OTP) {
      setEmailVerified(true);
      toast({ title: "Email Verified", description: "Email verified successfully!", variant: "success" });
    } else {
      setErrors(prev => ({ ...prev, emailOtp: "Invalid OTP" }));
    }
  };

  const sendPhoneOtp = () => {
    const cleaned = phone.replace(/\s/g, "");
    if (!cleaned || !/^(\+91)?[6-9]\d{9}$/.test(cleaned)) {
      setErrors(prev => ({ ...prev, phone: "Enter a valid mobile number first" }));
      return;
    }
    setPhoneOtpSent(true);
    setPhoneTimer(120);
    setErrors(prev => { const { phone: _, ...rest } = prev; return rest; });
    toast({ title: "OTP Sent", description: `Verification code sent to ${phone} (Demo: ${TEMP_OTP})` });
  };

  const verifyPhoneOtp = () => {
    if (phoneOtp === TEMP_OTP) {
      setPhoneVerified(true);
      toast({ title: "Phone Verified", description: "Mobile number verified successfully!", variant: "success" });
    } else {
      setErrors(prev => ({ ...prev, phoneOtp: "Invalid OTP" }));
    }
  };

  const canContinue = emailVerified && phoneVerified && termsAccepted && fullName && password && password === confirmPw && password.length >= 8 && password.length <= 20;

  const handleContinue = () => {
    if (!validateStep1Fields()) return;
    if (!emailVerified || !phoneVerified) return;
    setStep(2);
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (!companyName.trim()) e.companyName = "Company name is required";
    if (!businessType) e.businessType = "Select business type";
    if (!industryType) e.industryType = "Select industry type";
    if (!stateReg) e.stateReg = "Select state";
    if (!pan.trim()) e.pan = "PAN is required";
    else if (!validatePAN(pan)) e.pan = "Invalid PAN format (e.g., ABCDE1234F)";
    if (gstin && !validateGSTIN(gstin)) e.gstin = "Invalid GSTIN format (15 characters)";
    // GSTIN mandatory check for turnover > 4L
    const isTurnoverHigh = annualTurnover && annualTurnover !== "Below ₹40L";
    if (isTurnoverHigh && !gstin) e.gstin = "GSTIN is mandatory when turnover exceeds ₹4,00,000 per annum";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    await register({
      firstName: fullName.split(" ")[0],
      lastName: fullName.split(" ").slice(1).join(" "),
      email, phone, password, companyName, businessType, industryType,
      stateOfRegistration: stateReg, pan, domainEmail, gstin, employeeCount, annualTurnover,
    });
    setLoading(false);
    toast({ title: "Account Created!", description: "Welcome to Nexus-Compliance. Redirecting to dashboard...", variant: "success" });
    setTimeout(() => navigate("/dashboard"), 1200);
  };

  const isTurnoverHigh = annualTurnover && annualTurnover !== "Below ₹40L";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden py-8">
      <ComplianceAnimations />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg mx-4">
        <div className="glass-card p-8">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-6 justify-center">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold gradient-primary-text">Nexus-Compliance</span>
          </div>

          <h2 className="text-xl font-semibold text-foreground text-center mb-1">Create your account</h2>
          <p className="text-sm text-muted-foreground text-center mb-4">Start managing compliance in minutes</p>

          {/* Progress indicator */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${step >= 1 ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                {step > 1 ? <Check className="h-4 w-4" /> : "1"}
              </div>
              <span className={`text-xs font-medium ${step >= 1 ? "text-foreground" : "text-muted-foreground"}`}>Account Info</span>
            </div>
            <div className={`flex-1 h-0.5 rounded-full ${step >= 2 ? "gradient-primary" : "bg-border"}`} />
            <div className="flex-1 flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${step >= 2 ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                2
              </div>
              <span className={`text-xs font-medium ${step >= 2 ? "text-foreground" : "text-muted-foreground"}`}>Business Details</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className={labelCls}>Full Name *</label>
                  <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Admin Name" className={inputCls} />
                  {errors.fullName && <p className={errorCls}>{errors.fullName}</p>}
                </div>

                {/* Email + OTP */}
                <div>
                  <label className={labelCls}>Email Address *</label>
                  <div className="flex gap-2">
                    <input type="email" value={email} onChange={e => { setEmail(e.target.value); setEmailVerified(false); setEmailOtpSent(false); }} placeholder="you@company.com" className={`${inputCls} flex-1`} disabled={emailVerified} />
                    {!emailVerified && (
                      <button type="button" onClick={sendEmailOtp} disabled={emailTimer > 0} className="shrink-0 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/20 transition-colors disabled:opacity-50">
                        {emailTimer > 0 ? `${emailTimer}s` : <><Mail className="h-3.5 w-3.5 inline mr-1" />Send OTP</>}
                      </button>
                    )}
                    {emailVerified && <div className="shrink-0 flex items-center text-success"><Check className="h-5 w-5" /></div>}
                  </div>
                  {errors.email && <p className={errorCls}>{errors.email}</p>}
                  {emailOtpSent && !emailVerified && (
                    <div className="flex gap-2 mt-2">
                      <input value={emailOtp} onChange={e => setEmailOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Enter 6-digit OTP" maxLength={6} className={`${inputCls} flex-1`} />
                      <button type="button" onClick={verifyEmailOtp} className="shrink-0 rounded-lg gradient-primary px-3 py-2 text-xs font-medium text-primary-foreground">Verify</button>
                    </div>
                  )}
                  {errors.emailOtp && <p className={errorCls}>{errors.emailOtp}</p>}
                </div>

                {/* Phone + OTP */}
                <div>
                  <label className={labelCls}>Mobile Number *</label>
                  <div className="flex gap-2">
                    <input value={phone} onChange={e => { setPhone(e.target.value); setPhoneVerified(false); setPhoneOtpSent(false); }} placeholder="+91 98765 43210" className={`${inputCls} flex-1`} disabled={phoneVerified} />
                    {!phoneVerified && (
                      <button type="button" onClick={sendPhoneOtp} disabled={phoneTimer > 0} className="shrink-0 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/20 transition-colors disabled:opacity-50">
                        {phoneTimer > 0 ? `${phoneTimer}s` : <><Phone className="h-3.5 w-3.5 inline mr-1" />Send OTP</>}
                      </button>
                    )}
                    {phoneVerified && <div className="shrink-0 flex items-center text-success"><Check className="h-5 w-5" /></div>}
                  </div>
                  {errors.phone && <p className={errorCls}>{errors.phone}</p>}
                  {phoneOtpSent && !phoneVerified && (
                    <div className="flex gap-2 mt-2">
                      <input value={phoneOtp} onChange={e => setPhoneOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Enter 6-digit OTP" maxLength={6} className={`${inputCls} flex-1`} />
                      <button type="button" onClick={verifyPhoneOtp} className="shrink-0 rounded-lg gradient-primary px-3 py-2 text-xs font-medium text-primary-foreground">Verify</button>
                    </div>
                  )}
                  {errors.phoneOtp && <p className={errorCls}>{errors.phoneOtp}</p>}
                </div>

                {/* Password */}
                <div>
                  <label className={labelCls}>Password *</label>
                  <div className="relative">
                    <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="8–20 characters" className={`${inputCls} pr-10`} />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <PasswordStrength password={password} />
                  {errors.password && <p className={errorCls}>{errors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className={labelCls}>Confirm Password *</label>
                  <div className="relative">
                    <input type={showCpw ? "text" : "password"} value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Re-enter password" className={`${inputCls} pr-10`} />
                    <button type="button" onClick={() => setShowCpw(!showCpw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showCpw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPw && <p className={errorCls}>{errors.confirmPw}</p>}
                </div>

                {/* Terms */}
                <label className="flex items-start gap-2 text-sm text-muted-foreground cursor-pointer">
                  <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} className="rounded border-border mt-0.5" />
                  <span>I agree to the <Link to="/terms" className="text-primary hover:underline">Terms & Conditions</Link> and <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link></span>
                </label>
                {errors.terms && <p className={errorCls}>{errors.terms}</p>}

                <button onClick={handleContinue} disabled={!canContinue} className="w-full rounded-lg gradient-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  Continue to Business Details <ArrowRight className="h-4 w-4" />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                {/* Company Name */}
                <div>
                  <label className={labelCls}>Company / Firm Name *</label>
                  <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Acme Pvt Ltd" className={inputCls} />
                  {errors.companyName && <p className={errorCls}>{errors.companyName}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Business Type *</label>
                    <select value={businessType} onChange={e => setBusinessType(e.target.value)} className={selectCls}>
                      <option value="">Select</option>
                      {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {errors.businessType && <p className={errorCls}>{errors.businessType}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Industry Type *</label>
                    <select value={industryType} onChange={e => setIndustryType(e.target.value)} className={selectCls}>
                      <option value="">Select</option>
                      {INDUSTRY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {errors.industryType && <p className={errorCls}>{errors.industryType}</p>}
                  </div>
                </div>

                <div>
                  <label className={labelCls}>State of Registration *</label>
                  <select value={stateReg} onChange={e => setStateReg(e.target.value)} className={selectCls}>
                    <option value="">Select State</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.stateReg && <p className={errorCls}>{errors.stateReg}</p>}
                </div>

                <div>
                  <label className={labelCls}>PAN Number *</label>
                  <input value={pan} onChange={e => setPan(e.target.value.toUpperCase())} placeholder="ABCDE1234F" maxLength={10} className={inputCls} />
                  {errors.pan && <p className={errorCls}>{errors.pan}</p>}
                </div>

                <div>
                  <label className={labelCls}>Domain Email <span className="text-muted-foreground font-normal">(optional)</span></label>
                  <input type="email" value={domainEmail} onChange={e => setDomainEmail(e.target.value)} placeholder="you@yourcompany.com" className={inputCls} />
                </div>

                <div>
                  <label className={labelCls}>Annual Turnover <span className="text-muted-foreground font-normal">(optional)</span></label>
                  <select value={annualTurnover} onChange={e => setAnnualTurnover(e.target.value)} className={selectCls}>
                    <option value="">Select Range</option>
                    {TURNOVER_RANGES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className={labelCls}>
                    GSTIN {isTurnoverHigh ? <span className="text-destructive">*</span> : <span className="text-muted-foreground font-normal">(optional)</span>}
                  </label>
                  <input value={gstin} onChange={e => setGstin(e.target.value.toUpperCase())} placeholder="27AABCU9603R1ZX" maxLength={15} className={inputCls} />
                  {isTurnoverHigh && !gstin && <p className="text-xs text-warning mt-1">⚠ GSTIN is mandatory when annual turnover exceeds ₹4,00,000</p>}
                  {errors.gstin && <p className={errorCls}>{errors.gstin}</p>}
                </div>

                <div>
                  <label className={labelCls}>Employee Count <span className="text-muted-foreground font-normal">(optional)</span></label>
                  <input value={employeeCount} onChange={e => setEmployeeCount(e.target.value)} placeholder="e.g., 35" className={inputCls} />
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors flex items-center justify-center gap-2">
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                  <button onClick={handleSubmit} disabled={loading} className="flex-1 rounded-lg gradient-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create Account <ArrowRight className="h-4 w-4" /></>}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account? <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Protected by 256-bit encryption · SOC 2 Compliant
        </p>
      </motion.div>
    </div>
  );
}
