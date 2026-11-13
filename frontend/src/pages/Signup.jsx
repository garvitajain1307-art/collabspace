import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Compass, Eye, EyeOff, Lock, Mail, User, AlertCircle, Check } from "lucide-react";
import { setUser, setLoading, setError, clearError } from "../features/auth/authSlice";
import api from "../services/api";
import Button from "../components/common/Button";
import Input from "../components/common/Input";

export const Signup = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    if (error) dispatch(clearError());
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validatePasswordRules = (pass) => {
    return {
      length: pass.length >= 8,
      uppercase: /[A-Z]/.test(pass),
      lowercase: /[a-z]/.test(pass),
      number: /[0-9]/.test(pass),
      special: /[!@#$%^&*(),.?":{}|<>/]/.test(pass),
    };
  };

  const rules = validatePasswordRules(formData.password);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      dispatch(setError("Passwords do not match"));
      return;
    }

    if (!rules.length || !rules.uppercase || !rules.lowercase || !rules.number || !rules.special) {
      dispatch(
        setError("Password must be at least 8 characters with uppercase, lowercase, number, and special character")
      );
      return;
    }

    dispatch(setLoading(true));
    try {
      const res = await api.post("/api/v1/user/register", formData);
      if (res.success && res.user) {
        dispatch(setUser(res.user));
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      dispatch(err.message ? setError(err.message) : setError("Registration failed"));
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-stone-50 selection:bg-violet-100 selection:text-violet-900">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-stone-200/80 shadow-xl shadow-stone-200/30 p-8">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-11 h-11 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-md shadow-violet-500/20 mb-3">
            <Compass size={24} strokeWidth={2.2} />
          </div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">
            Create account
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Start collaborating with your team on CollabSpace
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-700 animate-in fade-in duration-150">
            <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-600" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <Input
            autoFocus
            label="Full name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Ada Lovelace"
            required
            maxLength={30}
            icon={User}
          />

          <Input
            label="Email address"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@company.com"
            required
            icon={Mail}
          />

          <div>
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create strong password"
              required
              icon={Lock}
              iconRight={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-stone-400 hover:text-stone-600 cursor-pointer p-0.5"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            {/* Live Password Requirements Checklist */}
            {formData.password.length > 0 && (
              <div className="mt-2 p-2.5 rounded-lg bg-stone-50 border border-stone-200/60 grid grid-cols-2 gap-1.5 text-[10px]">
                <span className={`flex items-center gap-1 ${rules.length ? "text-emerald-600 font-semibold" : "text-stone-400"}`}>
                  <Check size={11} className={rules.length ? "opacity-100" : "opacity-30"} /> 8+ characters
                </span>
                <span className={`flex items-center gap-1 ${rules.uppercase ? "text-emerald-600 font-semibold" : "text-stone-400"}`}>
                  <Check size={11} className={rules.uppercase ? "opacity-100" : "opacity-30"} /> 1 uppercase (A-Z)
                </span>
                <span className={`flex items-center gap-1 ${rules.lowercase ? "text-emerald-600 font-semibold" : "text-stone-400"}`}>
                  <Check size={11} className={rules.lowercase ? "opacity-100" : "opacity-30"} /> 1 lowercase (a-z)
                </span>
                <span className={`flex items-center gap-1 ${rules.number && rules.special ? "text-emerald-600 font-semibold" : "text-stone-400"}`}>
                  <Check size={11} className={rules.number && rules.special ? "opacity-100" : "opacity-30"} /> Number & symbol
                </span>
              </div>
            )}
          </div>

          <Input
            label="Confirm password"
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter password"
            required
            icon={Lock}
            iconRight={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-stone-400 hover:text-stone-600 cursor-pointer p-0.5"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full mt-2"
            loading={loading}
          >
            Create account
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-stone-100 text-center text-xs text-stone-500">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-violet-600 hover:text-violet-700 transition"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
