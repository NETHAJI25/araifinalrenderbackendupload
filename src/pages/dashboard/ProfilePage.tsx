import { useState } from "react";
import { useForm } from "react-hook-form";
import { Edit2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { authService } from "../../services/authService";
import { Input, Select } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { profileCompletionPercent } from "../../utils/formatters";
import { eventConfig } from "../../config/eventConfig";

const yearOptions = [
  { value: "1st Year", label: "1st Year" },
  { value: "2nd Year", label: "2nd Year" },
  { value: "3rd Year", label: "3rd Year" },
  { value: "4th Year", label: "4th Year" },
  { value: "Postgraduate", label: "Postgraduate" },
  { value: "Diploma", label: "Diploma" },
];

const stateOptions = [
  "Andhra Pradesh","Assam","Bihar","Chhattisgarh","Delhi","Goa","Gujarat","Haryana",
  "Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra",
  "Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim",
  "Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
].map((s) => ({ value: s, label: s }));

interface FormData {
  name: string; phone: string; college: string; course: string; year: string;
  city: string; state: string; linkedin?: string; github?: string;
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { addToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      name: user?.name || "", phone: user?.phone || "",
      college: user?.college || "", course: user?.course || "", year: user?.year || "",
      city: user?.city || "", state: user?.state || "",
      linkedin: user?.linkedin || "", github: user?.github || "",
    },
  });

  if (!user) return null;

  const pct = profileCompletionPercent(user);

  async function onSave(data: FormData) {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    authService.updateCurrentUser({ ...data, profileCompleted: pct === 100 });
    refreshUser();
    setSaving(false);
    setEditing(false);
    addToast({ type: "success", title: "Profile updated" });
  }

  return (
    <>
      <title>{`Profile | ${eventConfig.hackathonName}`}</title>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-violet-700 text-xs font-bold tracking-widest uppercase mb-1">Account</p>
          <h1 className="text-2xl font-black text-gray-900">My Profile</h1>
        </div>
        {!editing && (
          <Button variant="secondary" size="sm" leftIcon={<Edit2 className="w-4 h-4" />} onClick={() => setEditing(true)}>
            Edit Profile
          </Button>
        )}
      </div>

      {/* Profile completion */}
      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-gray-900">Profile Completion</p>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pct === 100 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{pct}%</span>
        </div>
        <ProgressBar value={pct} color={pct === 100 ? "green" : "violet"} size="md" />
        {pct < 100 && <p className="text-xs text-gray-500 mt-2">Complete all fields to unlock team features.</p>}
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit(onSave)} noValidate>
          <div className="space-y-8">
            <div>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Personal Information</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Full Name" required error={errors.name?.message} disabled={!editing}
                  {...register("name", { required: "Name is required" })} />
                <div>
                  <label className="label">Email Address</label>
                  <input className="input-field bg-gray-50 cursor-not-allowed" value={user.email} disabled readOnly />
                  <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
                </div>
                <Input label="Mobile Number" required error={errors.phone?.message} disabled={!editing}
                  {...register("phone", { required: "Phone is required" })} />
                <Input label="City" required error={errors.city?.message} disabled={!editing}
                  {...register("city", { required: "City is required" })} />
                <Select label="State" options={stateOptions} required error={errors.state?.message} disabled={!editing}
                  {...register("state", { required: "State is required" })} />
              </div>
            </div>

            <div>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Academic Information</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="College / Institution" required error={errors.college?.message} disabled={!editing}
                  className="sm:col-span-2" {...register("college", { required: "College is required" })} />
                <Input label="Course / Programme" required error={errors.course?.message} disabled={!editing}
                  {...register("course", { required: "Course is required" })} />
                <Select label="Year of Study" options={yearOptions} required error={errors.year?.message} disabled={!editing}
                  {...register("year", { required: "Year is required" })} />
              </div>
            </div>

            <div>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Social Links (Optional)</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="LinkedIn" type="url" placeholder="https://linkedin.com/in/..." disabled={!editing} {...register("linkedin")} />
                <Input label="GitHub" type="url" placeholder="https://github.com/..." disabled={!editing} {...register("github")} />
              </div>
            </div>

            <div>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Participation Info</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { label: "Team ID", value: user.teamId || "Not in a team", mono: true },
                  { label: "Payment Status", value: user.paymentStatus === "paid" ? "Paid" : "Pending" },
                  { label: "Registration Date", value: new Date(user.createdAt).toLocaleDateString("en-IN") },
                ].map(({ label, value, mono }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                    <p className={`text-sm font-bold text-gray-800 ${mono ? "font-mono text-violet-700" : ""}`}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {editing && (
            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-100">
              <Button type="submit" variant="primary" size="md" loading={saving}>Save Changes</Button>
              <Button type="button" variant="secondary" size="md" onClick={() => setEditing(false)} disabled={saving}>Cancel</Button>
            </div>
          )}
        </form>
      </div>
    </>
  );
}
