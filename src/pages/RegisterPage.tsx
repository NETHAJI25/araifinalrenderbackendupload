import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, CheckCircle, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { Input, Select } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { IALogoMark } from "../components/ui/IALogo";
import { eventConfig } from "../config/eventConfig";
import Seo from "../components/seo/Seo";

const TERMS_POINTS = [
  "Only current students (UG/PG/Diploma) are eligible to participate.",
  "Teams must have 4–6 members. Solo participation is not allowed.",
  "Round 1: Team Leader pays ₹100 and submits the PPT for evaluation.",
  "Only teams selected in Round 1 advance to Round 2 (Finals).",
  "Round 2: Each member pays ₹200 individually before the final submission.",
  "All submissions must be original work. Plagiarism leads to disqualification.",
  "Use the official PPT template for all submissions.",
  "Judges' decisions are final and binding.",
  "Registration fees are non-refundable except in case of event cancellation.",
  "Participants must follow the Code of Conduct. Misconduct leads to removal.",
  "Organizers may use project demos/photos for promotional purposes.",
  "Cash prize of ₹1,00,000 will be distributed among winning teams as announced.",
];

const CONDUCT_POINTS = [
  "Treat all participants, mentors, judges and organizers with respect.",
  "No harassment, discrimination or abusive behaviour of any kind.",
  "No cheating, sabotage or attempting to gain unfair advantage.",
  "Keep the venue and online spaces clean and professional.",
  "Follow all safety instructions during the offline final round.",
  "Report any violations to the organizing team immediately.",
];

const steps = ["Account", "Personal", "Academic", "Confirm"];

const yearOptions = [
  { value: "1st Year", label: "1st Year" },
  { value: "2nd Year", label: "2nd Year" },
  { value: "3rd Year", label: "3rd Year" },
  { value: "4th Year", label: "4th Year" },
  { value: "Postgraduate", label: "Postgraduate" },
  { value: "Diploma", label: "Diploma" },
];

const stateOptions = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh","Puducherry",
].map((s) => ({ value: s, label: s }));

interface FormData {
  name: string; email: string; password: string; confirmPassword: string;
  phone: string; city: string; state: string; country: string;
  linkedin?: string; github?: string;
  college: string; course: string; year: string;
  agreed: boolean;
}

export default function RegisterPage() {
  const { register: authRegister } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [legalModal, setLegalModal] = useState<"terms" | "conduct" | null>(null);

  const { register, handleSubmit, trigger, watch, setValue, getValues, formState: { errors } } =
    useForm<FormData>({ defaultValues: { country: "India", agreed: false } });

  async function nextStep() {
    let fields: (keyof FormData)[] = [];
    if (step === 0) fields = ["name", "email", "password", "confirmPassword"];
    if (step === 1) fields = ["phone", "city", "state"];
    if (step === 2) fields = ["college", "course", "year"];
    const valid = await trigger(fields);
    if (valid) setStep((s) => Math.min(s + 1, steps.length - 1));
  }

  async function onSubmit(data: FormData) {
    if (!data.agreed) { addToast({ type: "error", title: "Please agree to the terms" }); return; }
    setIsLoading(true);
    try {
      await authRegister({
        name: data.name, email: data.email, phone: data.phone,
        college: data.college, course: data.course, year: data.year,
        city: data.city, state: data.state, country: data.country || "India",
        linkedin: data.linkedin, github: data.github, password: data.password,
      });
      addToast({ type: "success", title: "Account created!", message: `Welcome to ${eventConfig.hackathonName}.` });
      navigate("/dashboard");
    } catch (err) {
      addToast({
        type: "error",
        title: "Registration failed",
        message: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const agreedValue = watch("agreed");

  return (
    <>
      <Seo
        title={`Register | ${eventConfig.hackathonName}`}
        description={`Create your ${eventConfig.hackathonName} account and register for the national-level 36-hour student hackathon in ${eventConfig.location}.`}
        path="/register"
        noindex
      />
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-10 px-4">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4"><IALogoMark size={48} /></div>
            <h1 className="text-2xl font-black text-gray-900">Create Your Account</h1>
            <p className="text-sm text-gray-500 mt-1">Join {eventConfig.hackathonName}</p>
          </div>

          {/* Steps */}
          <div className="flex items-center justify-center gap-1.5 mb-8">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-1.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors
                  ${i < step ? "bg-violet-600 border-violet-600 text-white" : i === step ? "border-violet-600 text-violet-700 bg-white" : "border-gray-300 text-gray-400 bg-white"}`}>
                  {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`hidden sm:block text-xs font-medium ${i === step ? "text-violet-700" : i < step ? "text-gray-500" : "text-gray-300"}`}>{s}</span>
                {i < steps.length - 1 && <div className={`w-5 h-0.5 ${i < step ? "bg-violet-300" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>

          <div className="card p-6 sm:p-8 shadow-lg">
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              {/* Step 0 */}
              {step === 0 && (
                <div className="space-y-5">
                  <div className="mb-5"><h2 className="text-lg font-bold text-gray-900">Account Information</h2></div>
                  <Input label="Full Name" placeholder="Your full name" required error={errors.name?.message}
                    {...register("name", { required: "Full name is required", minLength: { value: 2, message: "At least 2 characters" } })} />
                  <Input label="Email Address" type="email" placeholder="you@example.com" required error={errors.email?.message}
                    {...register("email", { required: "Email is required", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Valid email required" } })} />
                  <Input label="Password" type={showPw ? "text" : "password"} placeholder="Min 8 characters" required error={errors.password?.message}
                    rightIcon={<button type="button" onClick={() => setShowPw((s) => !s)} className="text-gray-400 hover:text-gray-600" aria-label={showPw ? "Hide" : "Show"}>{showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>}
                    {...register("password", { required: "Password is required", minLength: { value: 8, message: "At least 8 characters" } })} />
                  <Input label="Confirm Password" type={showConfirmPw ? "text" : "password"} placeholder="Repeat password" required error={errors.confirmPassword?.message}
                    rightIcon={<button type="button" onClick={() => setShowConfirmPw((s) => !s)} className="text-gray-400 hover:text-gray-600" aria-label={showConfirmPw ? "Hide" : "Show"}>{showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>}
                    {...register("confirmPassword", { required: "Please confirm password", validate: (v) => v === getValues("password") || "Passwords do not match" })} />
                </div>
              )}
              {/* Step 1 */}
              {step === 1 && (
                <div className="space-y-5">
                  <div className="mb-5"><h2 className="text-lg font-bold text-gray-900">Personal Details</h2></div>
                  <Input label="Mobile Number" type="tel" placeholder="10-digit mobile" required error={errors.phone?.message}
                    hint="Indian numbers (6–9 start)" {...register("phone", { required: "Phone is required", pattern: { value: /^[6-9]\d{9}$/, message: "Valid 10-digit number required" } })} />
                  <Input label="City" placeholder="Your city" required error={errors.city?.message}
                    {...register("city", { required: "City is required" })} />
                  <Select label="State" options={stateOptions} placeholder="Select state" required error={errors.state?.message}
                    {...register("state", { required: "State is required" })} />
                  <Input label="Country" required {...register("country")} />
                  <Input label="LinkedIn (Optional)" type="url" placeholder="https://linkedin.com/in/..." {...register("linkedin")} />
                  <Input label="GitHub (Optional)" type="url" placeholder="https://github.com/..." {...register("github")} />
                </div>
              )}
              {/* Step 2 */}
              {step === 2 && (
                <div className="space-y-5">
                  <div className="mb-5"><h2 className="text-lg font-bold text-gray-900">Academic Information</h2></div>
                  <Input label="College / Institution" placeholder="Full college name" required error={errors.college?.message}
                    {...register("college", { required: "College is required" })} />
                  <Input label="Course / Programme" placeholder="e.g. B.Tech Computer Science" required error={errors.course?.message}
                    {...register("course", { required: "Course is required" })} />
                  <Select label="Year of Study" options={yearOptions} placeholder="Select year" required error={errors.year?.message}
                    {...register("year", { required: "Year is required" })} />
                </div>
              )}
              {/* Step 3 */}
              {step === 3 && (
                <div className="space-y-5">
                  <div className="mb-2"><h2 className="text-lg font-bold text-gray-900">Review & Agree</h2></div>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm border border-gray-100">
                    {[
                      { label: "Name", value: getValues("name") },
                      { label: "Email", value: getValues("email") },
                      { label: "College", value: getValues("college") },
                      { label: "Course / Year", value: `${getValues("course")}, ${getValues("year")}` },
                      { label: "City / State", value: `${getValues("city")}, ${getValues("state")}` },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-gray-400 font-medium">{label}</span>
                        <span className="text-gray-700 font-semibold text-right max-w-[200px] truncate">{value || "—"}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                    <p className="font-semibold mb-1">Registration Fee: {eventConfig.currency}{eventConfig.registrationFee}</p>
                    <p className="text-xs text-amber-700">Fee is paid after joining a team. Complete your team first, then each member pays individually.</p>
                  </div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={agreedValue} onChange={(e) => setValue("agreed", e.target.checked)}
                      className="w-4 h-4 mt-0.5 text-violet-600 rounded border-gray-300 focus:ring-violet-500 shrink-0" />
                    <span className="text-sm text-gray-600">
                      I agree to the <button type="button" onClick={(e) => { e.preventDefault(); setLegalModal("terms"); }} className="text-violet-700 hover:underline font-medium">Terms & Conditions</button> and <button type="button" onClick={(e) => { e.preventDefault(); setLegalModal("conduct"); }} className="text-violet-700 hover:underline font-medium">Code of Conduct</button>.
                    </span>
                  </label>
                  {errors.agreed && <p className="text-sm text-red-600" role="alert">{errors.agreed.message}</p>}
                </div>
              )}

              <div className="flex gap-3 mt-8">
                {step > 0 && (
                  <Button type="button" variant="secondary" size="md" className="flex-1" onClick={() => setStep((s) => s - 1)}>Back</Button>
                )}
                {step < steps.length - 1 ? (
                  <Button type="button" variant="primary" size="md" className="flex-1" onClick={nextStep}>Continue</Button>
                ) : (
                  <Button type="submit" variant="primary" size="md" className="flex-1" loading={isLoading}>Create Account</Button>
                )}
              </div>
            </form>
            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account? <Link to="/login" className="text-violet-700 font-semibold hover:underline">Sign In</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Terms / Code of Conduct Modal */}
      {legalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setLegalModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-black text-gray-900">
                {legalModal === "terms" ? "Terms & Conditions" : "Code of Conduct"}
              </h3>
              <button onClick={() => setLegalModal(null)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Close">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto">
              <ol className="space-y-3">
                {(legalModal === "terms" ? TERMS_POINTS : CONDUCT_POINTS).map((point, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                    <span className="w-6 h-6 bg-violet-100 text-violet-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                    <span className="leading-relaxed">{point}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="p-4 border-t border-gray-100">
              <Button variant="primary" size="md" className="w-full" onClick={() => { setValue("agreed", true); setLegalModal(null); }}>
                I Understand & Agree
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
