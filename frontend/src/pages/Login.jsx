import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Compass, Eye, EyeOff, Lock, Mail, AlertCircle } from "lucide-react";
import { setUser, setLoading, setError, clearError } from "../features/auth/authSlice";
import api from "../services/api";
import Button from "../components/common/Button";
import Input from "../components/common/Input";

export const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { loading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from?.pathname || "/dashboard";

  const handleChange = (e) => {
    if (error) dispatch(clearError());
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) return;

    dispatch(setLoading(true));
    try {
      const res = await api.post("/api/v1/user/login", formData);
      if (res.success && res.user) {
        dispatch(setUser(res.user));
        navigate(from, { replace: true });
      }
    } catch (err) {
      dispatch(setError(err.message || "Invalid email or password"));
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-stone-50 selection:bg-violet-100 selection:text-violet-900">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-stone-200/80 shadow-xl shadow-stone-200/30 p-8">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center mb-7">
          <div className="w-11 h-11 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-md shadow-violet-500/20 mb-3">
            <Compass size={24} strokeWidth={2.2} />
          </div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">
            CollabSpace
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Sign in to continue to your workspace
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-700 animate-in fade-in duration-150">
            <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-600" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            autoFocus
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
              placeholder="Enter your password"
              required
              icon={Lock}
              iconRight={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-stone-400 hover:text-stone-600 cursor-pointer p-0.5"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full mt-2"
            loading={loading}
          >
            Sign in
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-6 pt-5 border-t border-stone-100 text-center text-xs text-stone-500">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="font-semibold text-violet-600 hover:text-violet-700 transition"
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
