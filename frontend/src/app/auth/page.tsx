"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Key, User, Shield, Home, ArrowLeft, Mail, Phone, Lock, Sparkles, Check, X } from "lucide-react";
import confetti from "canvas-confetti";

const API_BASE_URL = "http://127.0.0.1:8000";

export default function AuthPage() {
  const router = useRouter();
  
  // Tabs & Mode
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authRole, setAuthRole] = useState<"USER" | "OWNER">("USER");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form Inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  
  // User/Renter specific fields
  const [aadharNumber, setAadharNumber] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");

  useEffect(() => {
    // Clear sessions if page is loaded
    localStorage.removeItem("smartpg_token");
    localStorage.removeItem("smartpg_user");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    if (authMode === "login") {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });
        
        if (res.ok) {
          const data = await res.json();
          // Store token & user profile in localStorage
          localStorage.setItem("smartpg_token", data.access_token);
          localStorage.setItem("smartpg_user", JSON.stringify(data.user));
          
          confetti({ particleCount: 120, spread: 80 });
          
          // Role based redirection to central dashboard
          router.push("/");
        } else {
          const err = await res.json();
          setErrorMessage(err.detail || "Authentication failed. Double check your credentials.");
        }
      } catch (e) {
        setErrorMessage("Network error: Could not reach the FastAPI server. Make sure it's running.");
      } finally {
        setIsLoading(false);
      }
    } else {
      // Registration
      try {
        const payload: Record<string, string> = {
          email,
          password,
          full_name: fullName,
          role: authRole,
          phone_number: phoneNumber,
        };

        if (authRole === "USER") {
          payload.aadhar_number = aadharNumber;
          payload.emergency_contact_name = emergencyContactName;
          payload.emergency_contact_phone = emergencyContactPhone;
        }

        const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          confetti({ particleCount: 80, spread: 50, colors: ["#10b981", "#3b82f6"] });
          alert(`🎉 Registration successful! ${authRole === "OWNER" ? "Your account will be live after Admin approval." : "You can now login."}`);
          setAuthMode("login");
          setEmail(email);
          setPassword("");
        } else {
          const err = await res.json();
          setErrorMessage(err.detail || "Registration failed. Verify all fields.");
        }
      } catch (e) {
        setErrorMessage("Network error: Could not reach the FastAPI server.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Quick seed logins for evaluation
  const handleQuickSeedLogin = async (role: "USER" | "OWNER" | "ADMIN") => {
    let mockEmail = "user@smartpg.com";
    let mockPass = "user123";
    
    if (role === "OWNER") {
      mockEmail = "owner@smartpg.com";
      mockPass = "owner123";
    } else if (role === "ADMIN") {
      mockEmail = "admin@smartpg.com";
      mockPass = "admin123";
    }
    
    setEmail(mockEmail);
    setPassword(mockPass);
    setAuthMode("login");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative font-sans">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-slate-950 to-purple-900/10 z-0"></div>
      
      {/* Glow Blur Circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none z-0"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none z-0"></div>

      <div className="relative z-10 w-full max-w-lg bg-slate-900/40 border border-slate-800 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-2xl flex flex-col gap-6">
        
        {/* Back Link */}
        <button 
          onClick={() => router.push("/")}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-400 font-bold transition cursor-pointer self-start"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Listings
        </button>

        {/* Head */}
        <div className="text-center flex flex-col gap-1.5">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/15 mx-auto mb-2">
            <Key className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            {authMode === "login" ? "Secure Client Authentication" : "Register Secure Profile"}
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            {authMode === "login" ? "Enter your registered credentials to enter your customized portal workspace." : "Input your personal information and documents to register as a verified partner."}
          </p>
        </div>

        {/* Error Card */}
        {errorMessage && (
          <div className="bg-red-950/40 border border-red-500/30 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs text-red-300">
            <span className="shrink-0 mt-0.5 font-bold uppercase tracking-wider text-[10px] bg-red-500/20 px-1.5 py-0.5 rounded-md border border-red-400/30">ERROR</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Multi-role Register Selector */}
        {authMode === "register" && (
          <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-850">
            <button 
              type="button"
              onClick={() => setAuthRole("USER")}
              className={`py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${authRole === "USER" ? "bg-slate-850 text-white shadow-inner" : "text-slate-500 hover:text-slate-300"}`}
            >
              👤 Student / Professional
            </button>
            <button 
              type="button"
              onClick={() => setAuthRole("OWNER")}
              className={`py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${authRole === "OWNER" ? "bg-slate-850 text-white shadow-inner" : "text-slate-500 hover:text-slate-300"}`}
            >
              🏡 PG Warden / Owner
            </button>
          </div>
        )}

        {/* AUTH FORM */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {authMode === "login" ? (
            <>
              {/* Login email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-slate-400 tracking-wide">EMAIL ADDRESS</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="e.g. renter@smartpg.com"
                    className="bg-slate-950 border border-slate-850 rounded-xl py-3 pl-10 pr-4 text-xs text-slate-200 w-full outline-none focus:border-indigo-500/80"
                  />
                </div>
              </div>

              {/* Login pass */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-slate-400 tracking-wide">PASSWORD</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="bg-slate-950 border border-slate-850 rounded-xl py-3 pl-10 pr-4 text-xs text-slate-200 w-full outline-none focus:border-indigo-500/80"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Register inputs */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-slate-400 tracking-wide">FULL LEGAL NAME</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="e.g. Aarav Sharma"
                    className="bg-slate-950 border border-slate-850 rounded-xl py-3 pl-10 pr-4 text-xs text-slate-200 w-full outline-none focus:border-indigo-500/80"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-slate-400 tracking-wide">EMAIL ADDRESS</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="e.g. student@gmail.com"
                    className="bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-indigo-500/80"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-slate-400 tracking-wide">PASSWORD</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Min 6 characters"
                    className="bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-indigo-500/80"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-slate-400 tracking-wide">MOBILE PHONE NUMBER</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input 
                    type="tel" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    placeholder="e.g. +91 98765 43212"
                    className="bg-slate-950 border border-slate-850 rounded-xl py-3 pl-10 pr-4 text-xs text-slate-200 w-full outline-none focus:border-indigo-500/80"
                  />
                </div>
              </div>

              {/* Renter specific validation details */}
              {authRole === "USER" && (
                <div className="flex flex-col gap-3.5 bg-slate-950/60 border border-slate-850 p-4 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Student / Professional Identity Info</span>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold text-slate-500">AADHAR CARD NUMBER</label>
                    <input 
                      type="text" 
                      value={aadharNumber}
                      onChange={(e) => setAadharNumber(e.target.value)}
                      required
                      placeholder="e.g. 1234-5678-9012"
                      className="bg-slate-900 border border-slate-850 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500/80"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-semibold text-slate-500">EMERGENCY CONTACT NAME</label>
                      <input 
                        type="text" 
                        value={emergencyContactName}
                        onChange={(e) => setEmergencyContactName(e.target.value)}
                        required
                        placeholder="Sanjay Sharma"
                        className="bg-slate-900 border border-slate-850 rounded-xl p-2.5 text-xs text-slate-200 outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-semibold text-slate-500">EMERGENCY PHONE</label>
                      <input 
                        type="tel" 
                        value={emergencyContactPhone}
                        onChange={(e) => setEmergencyContactPhone(e.target.value)}
                        required
                        placeholder="9876543213"
                        className="bg-slate-900 border border-slate-850 rounded-xl p-2.5 text-xs text-slate-200 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:to-purple-600 hover:to-pink-600 disabled:from-slate-800 disabled:to-slate-900 disabled:text-slate-500 text-white rounded-xl py-3.5 text-xs font-bold tracking-wider shadow-lg shadow-indigo-500/10 cursor-pointer active:scale-98 transition"
          >
            {isLoading ? "Authenticating security credentials..." : authMode === "login" ? "🚀 Verify & Enter Workspace" : "🔒 Complete Registration"}
          </button>
        </form>

        {/* Switch mode */}
        <div className="text-center text-[11px] text-slate-500">
          {authMode === "login" ? (
            <span>
              {"Don't have a secure workspace profile?"}{" "}
              <button 
                onClick={() => setAuthMode("register")}
                className="text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer"
              >
                Register as Verified Partner
              </button>
            </span>
          ) : (
            <span>
              Already verified?{" "}
              <button 
                onClick={() => setAuthMode("login")}
                className="text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer"
              >
                Sign in here
              </button>
            </span>
          )}
        </div>

        {/* Seed testing profiles (great for quickly testing) */}
        <div className="border-t border-slate-850 pt-4 text-center">
          <span className="text-[10px] text-slate-500 block mb-2.5 font-bold uppercase tracking-wider">Quick Fill Development Logins:</span>
          <div className="flex justify-center gap-1.5 flex-wrap">
            <button 
              onClick={() => handleQuickSeedLogin("USER")}
              className="bg-slate-950 border border-slate-850 hover:border-slate-700 text-[10px] font-semibold text-slate-300 px-3 py-1.5 rounded-lg cursor-pointer transition active:scale-95"
            >
              Student Renter
            </button>
            <button 
              onClick={() => handleQuickSeedLogin("OWNER")}
              className="bg-slate-950 border border-slate-850 hover:border-slate-700 text-[10px] font-semibold text-slate-300 px-3 py-1.5 rounded-lg cursor-pointer transition active:scale-95"
            >
              Warden Owner
            </button>
            <button 
              onClick={() => handleQuickSeedLogin("ADMIN")}
              className="bg-slate-950 border border-slate-850 hover:border-slate-700 text-[10px] font-semibold text-slate-300 px-3 py-1.5 rounded-lg cursor-pointer transition active:scale-95"
            >
              Admin Moderator
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
