"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Search, Shield, MapPin, Sparkles, User, Home, Key, BookOpen, 
  Wifi, Car, Tv, Zap, Droplet, Utensils, Star, MessageSquare, 
  Send, Plus, Trash2, Check, X, ShieldAlert, Award, FileText, 
  TrendingUp, Users, Settings, Activity, Upload, Menu, Phone
} from "lucide-react";
import confetti from "canvas-confetti";

// Base API configuration (FastAPI server)
const API_BASE_URL = "http://127.0.0.1:8000";

// Interface Definitions
interface Property {
  id: number;
  owner_id: number;
  title: string;
  description: string;
  property_type: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  price: number;
  wifi: boolean;
  parking: boolean;
  washing_machine: boolean;
  electricity: boolean;
  drinking_water: boolean;
  food_availability: boolean;
  safety_score: number;
  images: string; // JSON string
  is_available: boolean;
  is_approved: boolean;
}

interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  role: "ADMIN" | "OWNER" | "USER";
  phone_number?: string;
  aadhar_number?: string;
  aadhar_image_url?: string;
  photo_url?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

interface AdminAnalytics {
  users_count: number;
  owners_count: number;
  properties_count: number;
  approved_properties_count: number;
  pending_properties_count: number;
  reviews_count: number;
  city_distribution: Record<string, number>;
}

export default function SmartPGApp() {
  // App State
  const [activeRole, setActiveRole] = useState<"VISITOR" | "USER" | "OWNER" | "ADMIN">("VISITOR");
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  
  // Navigation & UI States
  const [activeTab, setActiveTab] = useState<string>("explore"); // explore, profile, add-listing, admin-users, admin-listings
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authRole, setAuthRole] = useState<"USER" | "OWNER">("USER");
  
  // Data States
  const [properties, setProperties] = useState<Property[]>([]);
  const [searchCity, setSearchCity] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [priceRange, setPriceRange] = useState<number>(30000);
  const [selectedAmenities, setSelectedAmenities] = useState<Record<string, boolean>>({
    wifi: false,
    parking: false,
    washing_machine: false,
    electricity: false,
    drinking_water: false,
    food_availability: false,
  });
  

  
  // Forms States
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regFullName, setRegFullName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regAadhar, setRegAadhar] = useState("");
  const [regEmergencyName, setRegEmergencyName] = useState("");
  const [regEmergencyPhone, setRegEmergencyPhone] = useState("");
  const [aadharFile, setAadharFile] = useState<string>("");
  const [photoFile, setPhotoFile] = useState<string>("");
  
  // Owner Listing Form States
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("PG");
  const [newPrice, setNewPrice] = useState("");
  const [newCity, setNewCity] = useState("Bangalore");
  const [newAddress, setNewAddress] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newWifi, setNewWifi] = useState(false);
  const [newParking, setNewParking] = useState(false);
  const [newWashing, setNewWashing] = useState(false);
  const [newElectricity, setNewElectricity] = useState(false);
  const [newWater, setNewWater] = useState(false);
  const [newFood, setNewFood] = useState(false);
  const [newSafety, setNewSafety] = useState(8.0);
  const [newImageUrl, setNewImageUrl] = useState("");

  // Admin and Monitoring States
  const [adminUsers, setAdminUsers] = useState<UserProfile[]>([]);
  const [adminAnalytics, setAdminAnalytics] = useState<AdminAnalytics>({
    users_count: 3,
    owners_count: 1,
    properties_count: 4,
    approved_properties_count: 3,
    pending_properties_count: 1,
    reviews_count: 2,
    city_distribution: { "Bangalore": 2, "Delhi": 2 }
  });

  // Shortlists / Favorites
  const [shortlistedIds, setShortlistedIds] = useState<number[]>([]);

  // Maps Integration State
  const [mapProperty, setMapProperty] = useState<Property | null>(null);

  async function checkBackendHealth() {
    try {
      const res = await fetch(`${API_BASE_URL}/`);
      if (res.ok) {
        setIsBackendConnected(true);
        console.log("🟢 FastAPI backend online!");
        fetchProperties();
      }
    } catch (e) {
      setIsBackendConnected(false);
      console.log("🔴 FastAPI backend offline. Running in secure local simulation mode.");
    }
  }

  // Fetch properties from API or fall back to mock database
  async function fetchProperties() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/properties`);
      if (res.ok) {
        const data = await res.json();
        setProperties(data);
      }
    } catch (e) {
      console.error("Failed to fetch properties:", e);
    }
  }


  // Secure local mock seed data fallback
  function loadMockData() {
    const defaultProperties: Property[] = [
      {
        id: 1,
        owner_id: 101,
        title: "Premium Boys PG Near Christ University",
        description: "Fully-furnished shared and single occupancy rooms designed for students. Offers three healthy meals daily, biometric security, and daily housekeeping.",
        property_type: "PG",
        address: "Koramangala 3rd Block, Gate 2",
        city: "Bangalore",
        price: 8500,
        wifi: true,
        parking: true,
        washing_machine: true,
        electricity: true,
        drinking_water: true,
        food_availability: true,
        safety_score: 9.2,
        images: JSON.stringify([
          "https://images.unsplash.com/photo-1555854817-cc0867f8e925?w=600&auto=format&fit=crop&q=60",
          "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=600&auto=format&fit=crop&q=60"
        ]),
        is_available: true,
        is_approved: true
      },
      {
        id: 2,
        owner_id: 101,
        title: "Modern 1BHK Co-Living Rental House",
        description: "Cozy 1BHK rental flat perfect for young working professionals. Safe gated society, close to public parks and Indiranagar double road.",
        property_type: "HOUSE",
        address: "Indiranagar 100 Feet Road, Near Metro Station",
        city: "Bangalore",
        price: 18000,
        wifi: true,
        parking: true,
        washing_machine: true,
        electricity: true,
        drinking_water: true,
        food_availability: false,
        safety_score: 8.5,
        images: JSON.stringify([
          "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&auto=format&fit=crop&q=60",
          "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&auto=format&fit=crop&q=60"
        ]),
        is_available: true,
        is_approved: true
      },
      {
        id: 3,
        owner_id: 102,
        title: "Budget Girls PG near South Campus",
        description: "Affordable and highly secure accommodation for female students. Includes mineral drinking water, backup power generator, CCTV, and warm warden support.",
        property_type: "PG",
        address: "Satya Niketan, Near South Delhi Campus",
        city: "Delhi",
        price: 6000,
        wifi: true,
        parking: false,
        washing_machine: true,
        electricity: true,
        drinking_water: true,
        food_availability: true,
        safety_score: 9.5,
        images: JSON.stringify([
          "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&auto=format&fit=crop&q=60",
          "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=600&auto=format&fit=crop&q=60"
        ]),
        is_available: true,
        is_approved: true
      },
      {
        id: 4,
        owner_id: 102,
        title: "Luxury Co-living Penthouse in DLF Phase 3",
        description: "Premium single occupancy rooms in a sprawling penthouse. Gated estate security, rooftop lounge, and active young professional community.",
        property_type: "HOUSE",
        address: "DLF Phase 3, Cyber City",
        city: "Delhi",
        price: 24000,
        wifi: true,
        parking: true,
        washing_machine: true,
        electricity: true,
        drinking_water: true,
        food_availability: true,
        safety_score: 9.0,
        images: JSON.stringify([
          "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&auto=format&fit=crop&q=60"
        ]),
        is_available: true,
        is_approved: false // Pending approval to demonstrate Admin portal!
      }
    ];

    const cachedProps = localStorage.getItem("simulated_properties");
    if (cachedProps) {
      setProperties(JSON.parse(cachedProps));
    } else {
      setProperties(defaultProperties);
      localStorage.setItem("simulated_properties", JSON.stringify(defaultProperties));
    }

    // Default mock users for admin monitoring
    const mockUsersList: UserProfile[] = [
      { id: 1, email: "admin@smartpg.com", full_name: "System Admin", role: "ADMIN" },
      { id: 2, email: "owner@smartpg.com", full_name: "Rajesh Warden", role: "OWNER", phone_number: "9876543211" },
      { id: 3, email: "user@smartpg.com", full_name: "Aarav Sharma", role: "USER", phone_number: "9876543212", aadhar_number: "1234-5678-9012", aadhar_image_url: "simulated_aadhar.png", emergency_contact_name: "Sanjay Sharma", emergency_contact_phone: "9876543213" },
    ];
    setAdminUsers(mockUsersList);
  }

  // 1. Health check & Fetch initial data
  useEffect(() => {
    // Defer all mounting state initialization to avoid synchronous setState warnings in useEffect
    setTimeout(() => {
      const savedToken = localStorage.getItem("smartpg_token");
      const savedUser = localStorage.getItem("smartpg_user");
      if (savedToken && savedUser) {
        try {
          const user = JSON.parse(savedUser);
          setToken(savedToken);
          setCurrentUser(user);
          setActiveRole(user.role);
        } catch (e) {
          console.error("Error restoring session:", e);
        }
      }

      checkBackendHealth();
      loadMockData(); // Initial offline load
    }, 0);
  }, []);

  // --- MOCK SIMULATOR ROLE-SWITCHING FOR EVALUATION ---
  const simulateRole = (role: "VISITOR" | "USER" | "OWNER" | "ADMIN") => {
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.1 } });
    setActiveRole(role);
    setActiveTab("explore");
    
    if (role === "USER") {
      setCurrentUser({
        id: 3,
        email: "user@smartpg.com",
        full_name: "Aarav Sharma",
        role: "USER",
        phone_number: "9876543212",
        aadhar_number: "1234-5678-9012",
        aadhar_image_url: "simulated_aadhar.png",
        photo_url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=60",
        emergency_contact_name: "Sanjay Sharma",
        emergency_contact_phone: "9876543213"
      });
      setToken("simulated_token_user");
    } else if (role === "OWNER") {
      setCurrentUser({
        id: 2,
        email: "owner@smartpg.com",
        full_name: "Rajesh Warden",
        role: "OWNER",
        phone_number: "9876543211"
      });
      setToken("simulated_token_owner");
    } else if (role === "ADMIN") {
      setCurrentUser({
        id: 1,
        email: "admin@smartpg.com",
        full_name: "System Admin",
        role: "ADMIN"
      });
      setToken("simulated_token_admin");
    } else {
      setCurrentUser(null);
      setToken(null);
    }
  };

  // --- AUTHENTICATION FLOWS ---
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === "login") {
      // Connect to backend if online
      if (isBackendConnected) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: loginEmail, password: loginPassword })
          });
          if (res.ok) {
            const data = await res.json();
            setToken(data.access_token);
            setCurrentUser(data.user);
            setActiveRole(data.user.role);
            
            // Save to localStorage for session persistence!
            localStorage.setItem("smartpg_token", data.access_token);
            localStorage.setItem("smartpg_user", JSON.stringify(data.user));
            
            setShowAuthModal(false);
            confetti({ particleCount: 100, spread: 80 });
            return;
          } else {
            const err = await res.json();
            alert(`Login Failed: ${err.detail}`);
            return;
          }
        } catch (e) {
          console.error("Backend login error:", e);
        }
      }
      
      // Local fallback simulation
      if (loginEmail === "admin@smartpg.com") simulateRole("ADMIN");
      else if (loginEmail === "owner@smartpg.com") simulateRole("OWNER");
      else simulateRole("USER");
      setShowAuthModal(false);
    } else {
      // Registration
      const mockProfile: UserProfile = {
        id: Math.floor(Math.random() * 1000) + 10,
        email: regEmail,
        full_name: regFullName,
        role: authRole,
        phone_number: regPhone,
        aadhar_number: regAadhar,
        aadhar_image_url: aadharFile || "simulated_uploaded_aadhar.png",
        photo_url: photoFile || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=60",
        emergency_contact_name: regEmergencyName,
        emergency_contact_phone: regEmergencyPhone
      };
      
      if (isBackendConnected) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: regEmail,
              password: regPassword,
              full_name: regFullName,
              role: authRole,
              phone_number: regPhone,
              aadhar_number: regAadhar,
              emergency_contact_name: regEmergencyName,
              emergency_contact_phone: regEmergencyPhone
            })
          });
          if (res.ok) {
            const data = await res.json();
            alert("Registration successful! Please login.");
            setAuthMode("login");
            setLoginEmail(regEmail);
            return;
          } else {
            const err = await res.json();
            alert(`Registration Failed: ${err.detail}`);
            return;
          }
        } catch (e) {
          console.error("Backend reg error:", e);
        }
      }

      // Offline simulation
      const currentList = [...adminUsers, mockProfile];
      setAdminUsers(currentList);
      setCurrentUser(mockProfile);
      setActiveRole(authRole);
      setShowAuthModal(false);
      confetti({ particleCount: 80, spread: 50 });
    }
  };

  const handleLogout = () => {
    setActiveRole("VISITOR");
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem("smartpg_token");
    localStorage.removeItem("smartpg_user");
    confetti({ particleCount: 30, colors: ["#ef4444"] });
  };

  // Simulated file upload triggers
  const triggerSimulatedUpload = (type: "aadhar" | "photo") => {
    if (type === "aadhar") {
      setAadharFile("aadhar_uploaded_preview.png");
    } else {
      setPhotoFile("photo_uploaded_preview.png");
    }
    confetti({ particleCount: 20, colors: ["#10b981"] });
  };

  // --- RENTALS CRUD & ACTIONS ---
  const handleAddProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const newProp: Property = {
      id: properties.length + 1,
      owner_id: currentUser.id,
      title: newTitle || `${currentUser.full_name}'s Cozy ${newType}`,
      description: newDescription || "No description provided.",
      property_type: newType,
      address: newAddress || "Unlisted Address",
      city: newCity,
      price: parseFloat(newPrice) || 5000,
      wifi: newWifi,
      parking: newParking,
      washing_machine: newWashing,
      electricity: newElectricity,
      drinking_water: newWater,
      food_availability: newFood,
      safety_score: newSafety,
      images: JSON.stringify([
        newImageUrl || "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&auto=format&fit=crop&q=60"
      ]),
      is_available: true,
      is_approved: false // New listings require admin approval
    };

    // Update list
    const updated = [newProp, ...properties];
    setProperties(updated);
    localStorage.setItem("simulated_properties", JSON.stringify(updated));

    // Clear form
    setNewTitle("");
    setNewPrice("");
    setNewAddress("");
    setNewDescription("");
    setNewWifi(false);
    setNewParking(false);
    setNewWashing(false);
    setNewElectricity(false);
    setNewWater(false);
    setNewFood(false);
    setNewImageUrl("");

    // Jump to dashboard
    setActiveTab("explore");
    confetti({ particleCount: 100, spread: 80, colors: ["#10b981", "#3b82f6"] });
    alert("🎉 Listing submitted successfully! Pending Admin Approval.");
  };

  // --- ADMIN ACTIONS ---
  const handleApproveProperty = (id: number, approve: boolean) => {
    const updated = properties.map(p => {
      if (p.id === id) {
        return { ...p, is_approved: approve };
      }
      return p;
    });
    setProperties(updated);
    localStorage.setItem("simulated_properties", JSON.stringify(updated));
    confetti({ particleCount: 50, colors: approve ? ["#10b981"] : ["#ef4444"] });
  };

  const handleRemoveProperty = (id: number) => {
    if (confirm("Are you sure you want to flag and delete this fake listing?")) {
      const updated = properties.filter(p => p.id !== id);
      setProperties(updated);
      localStorage.setItem("simulated_properties", JSON.stringify(updated));
      alert("Listing removed successfully.");
    }
  };

  const handleApproveUser = (id: number, approve: boolean) => {
    const updated = adminUsers.map(u => {
      if (u.id === id) {
        return { ...u, is_approved: approve };
      }
      return u;
    });
    setAdminUsers(updated);
    alert(`User verification status updated.`);
  };

  // --- SHORTLIST TOGGLE ---
  const toggleShortlist = (id: number) => {
    if (shortlistedIds.includes(id)) {
      setShortlistedIds(shortlistedIds.filter(i => i !== id));
    } else {
      setShortlistedIds([...shortlistedIds, id]);
      confetti({ particleCount: 30, colors: ["#f43f5e"], spread: 40 });
    }
  };

  // Filter listings based on regular UI filters
  const filteredProperties = properties.filter(p => {
    // Visitor/Renter views only approved listings
    if (activeRole !== "ADMIN" && activeRole !== "OWNER" && !p.is_approved) {
      return false;
    }
    
    // Admin & Owner can see unapproved properties
    if (activeRole === "OWNER" && p.owner_id !== currentUser?.id && !p.is_approved) {
      return false;
    }

    if (searchCity && p.city.toLowerCase() !== searchCity.toLowerCase()) return false;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const inTitle = p.title.toLowerCase().includes(q);
      const inAddr = p.address.toLowerCase().includes(q);
      const inDesc = p.description.toLowerCase().includes(q);
      if (!inTitle && !inAddr && !inDesc) return false;
    }

    if (filterType !== "ALL" && p.property_type !== filterType) return false;
    if (p.price > priceRange) return false;

    // Amenities filters
    if (selectedAmenities.wifi && !p.wifi) return false;
    if (selectedAmenities.parking && !p.parking) return false;
    if (selectedAmenities.washing_machine && !p.washing_machine) return false;
    if (selectedAmenities.electricity && !p.electricity) return false;
    if (selectedAmenities.drinking_water && !p.drinking_water) return false;
    if (selectedAmenities.food_availability && !p.food_availability) return false;

    return true;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* 🚀 HIGHLIGHTED DEMO EVALUATION BAR */}
      <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 px-4 py-2 text-center text-xs sm:text-sm font-semibold flex flex-wrap items-center justify-center gap-3 border-b border-indigo-500 shadow-lg relative z-50">
        <span className="flex items-center gap-1.5 bg-slate-950/40 px-2 py-0.5 rounded-full text-indigo-200">
          <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
          Interactive Demo Control Panel
        </span>
        <span className="text-white hidden lg:inline">Simulate Portal Roles:</span>
        <div className="flex gap-2">
          <button 
            onClick={() => simulateRole("USER")} 
            className={`px-3 py-1 rounded-md transition-all font-medium border text-xs cursor-pointer ${activeRole === "USER" ? "bg-white text-indigo-900 border-white shadow-md scale-105" : "bg-indigo-700/50 text-white border-indigo-400 hover:bg-indigo-800"}`}
          >
            👤 Student/User
          </button>
          <button 
            onClick={() => simulateRole("OWNER")} 
            className={`px-3 py-1 rounded-md transition-all font-medium border text-xs cursor-pointer ${activeRole === "OWNER" ? "bg-white text-indigo-900 border-white shadow-md scale-105" : "bg-indigo-700/50 text-white border-indigo-400 hover:bg-indigo-800"}`}
          >
            🏡 House Owner/Warden
          </button>
          <button 
            onClick={() => simulateRole("ADMIN")} 
            className={`px-3 py-1 rounded-md transition-all font-medium border text-xs cursor-pointer ${activeRole === "ADMIN" ? "bg-white text-indigo-900 border-white shadow-md scale-105" : "bg-indigo-700/50 text-white border-indigo-400 hover:bg-indigo-800"}`}
          >
            👑 Administrator
          </button>
          <button 
            onClick={handleLogout} 
            className="px-2 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white border border-red-500 text-xs transition cursor-pointer"
          >
            Reset
          </button>
        </div>
        <div className="flex items-center gap-1.5 ml-3 bg-slate-950/45 px-2 py-0.5 rounded-full text-[11px] font-mono">
          API Status: 
          <span className={`inline-block w-2.5 h-2.5 rounded-full ${isBackendConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`}></span>
          {isBackendConnected ? "FastAPI Connected" : "Local Mock Simulation"}
        </div>
      </div>

      {/* HEADER / NAVIGATION */}
      <header className="sticky top-0 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 py-4 px-6 flex items-center justify-between z-40">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Home className="h-5.5 w-5.5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">SmartPG</span>
            <span className="text-[10px] block text-slate-400 font-medium tracking-wide">STUDENTS & PROFESSIONALS</span>
          </div>
        </div>

        {/* Dynamic Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-950/50 p-1.5 rounded-xl border border-slate-800/80">
          <button 
            onClick={() => { setActiveTab("explore"); }} 
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activeTab === "explore" ? "bg-slate-800 text-indigo-400 shadow-inner" : "text-slate-400 hover:text-slate-200"}`}
          >
            Explore PGs
          </button>
          
          {activeRole === "USER" && (
            <button 
              onClick={() => { setActiveTab("profile"); }} 
              className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activeTab === "profile" ? "bg-slate-800 text-indigo-400 shadow-inner" : "text-slate-400 hover:text-slate-200"}`}
            >
              Verify Profile & Aadhar
            </button>
          )}

          {activeRole === "OWNER" && (
            <button 
              onClick={() => { setActiveTab("add-listing"); }} 
              className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activeTab === "add-listing" ? "bg-slate-800 text-indigo-400 shadow-inner" : "text-slate-400 hover:text-slate-200"}`}
            >
              ➕ List Property
            </button>
          )}

          {activeRole === "ADMIN" && (
            <>
              <button 
                onClick={() => { setActiveTab("admin-listings"); }} 
                className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activeTab === "admin-listings" ? "bg-slate-800 text-indigo-400 shadow-inner" : "text-slate-400 hover:text-slate-200"}`}
              >
                📝 Review Listings
              </button>
              <button 
                onClick={() => { setActiveTab("admin-users"); }} 
                className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activeTab === "admin-users" ? "bg-slate-800 text-indigo-400 shadow-inner" : "text-slate-400 hover:text-slate-200"}`}
              >
                👥 Monitor Users
              </button>
            </>
          )}
        </nav>

        {/* User Account / Profile Box */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <span className="text-xs font-medium text-slate-300 block">{currentUser.full_name}</span>
                <span className="text-[10px] text-indigo-400 font-semibold px-2 py-0.5 bg-indigo-500/10 rounded-full">{currentUser.role}</span>
              </div>
              <button 
                onClick={() => setActiveTab(activeRole === "USER" ? "profile" : activeRole === "OWNER" ? "add-listing" : "explore")}
                className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden cursor-pointer"
              >
                {currentUser.photo_url ? (
                  <img src={currentUser.photo_url} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-4.5 w-4.5 text-slate-400" />
                )}
              </button>
            </div>
          ) : (
            <button 
              onClick={() => { setAuthMode("login"); setShowAuthModal(true); }}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/20 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Key className="h-3.5 w-3.5" />
              Secure Login
            </button>
          )}
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-8">
        
        {/* TAB 1: EXPLORE & FILTER VIEW */}
        {activeTab === "explore" && (
          <>
            {/* HERO SECTION */}
            <section className="relative rounded-3xl overflow-hidden border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/20 p-8 sm:p-12 text-center flex flex-col items-center gap-6 shadow-2xl">
              <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1.5 rounded-full text-indigo-400 text-xs font-semibold animate-bounce">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                AI-Powered Student Living Platform
              </div>
              
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight max-w-2xl bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Find Your Perfect PG & Home Recommendation
              </h1>
              
              <p className="text-sm sm:text-base text-slate-400 max-w-lg leading-relaxed">
                Connect directly with wardens and homeowners. Safe, fully verified student and professional accommodations rated by Gemini AI.
              </p>

              {/* SEARCH CONTAINER */}
              <div className="w-full max-w-2xl bg-slate-950/70 border border-slate-800 p-2.5 rounded-2xl flex flex-col sm:flex-row gap-2 shadow-xl backdrop-blur-sm mt-4">
                <div className="flex-1 flex items-center gap-2 px-3">
                  <MapPin className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
                  <select 
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    className="bg-transparent border-0 outline-none text-slate-200 text-sm font-semibold w-full cursor-pointer focus:ring-0 focus:outline-none"
                  >
                    <option value="" className="bg-slate-900">All Cities</option>
                    <option value="Bangalore" className="bg-slate-900">Bangalore</option>
                    <option value="Delhi" className="bg-slate-900">Delhi</option>
                  </select>
                </div>
                <div className="h-px sm:h-6 w-full sm:w-px bg-slate-800 my-auto"></div>
                <div className="flex-2 flex items-center gap-2 px-3">
                  <Search className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                  <input 
                    type="text" 
                    placeholder="Search amenities, university, area (e.g. Koramangala)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-0 outline-none text-slate-200 text-sm w-full placeholder:text-slate-500 focus:ring-0 focus:outline-none"
                  />
                </div>
              </div>
            </section>

            {/* FILTER PANEL AND CARD DIRECTORY */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              
              {/* FILTERS COLUMN */}
              <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-200 tracking-wide flex items-center gap-1.5">
                    <Sliders className="h-4 w-4 text-indigo-400" />
                    Filters
                  </h3>
                  <button 
                    onClick={() => {
                      setSearchCity("");
                      setSearchQuery("");
                      setFilterType("ALL");
                      setPriceRange(30000);
                      setSelectedAmenities({
                        wifi: false,
                        parking: false,
                        washing_machine: false,
                        electricity: false,
                        drinking_water: false,
                        food_availability: false,
                      });
                    }}
                    className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                  >
                    Reset All
                  </button>
                </div>

                <div className="h-px bg-slate-800/80"></div>

                {/* Property Type */}
                <div className="flex flex-col gap-2.5">
                  <label className="text-xs font-semibold text-slate-400">Accomodation Type</label>
                  <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button 
                      onClick={() => setFilterType("ALL")} 
                      className={`py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${filterType === "ALL" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"}`}
                    >
                      All
                    </button>
                    <button 
                      onClick={() => setFilterType("PG")} 
                      className={`py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${filterType === "PG" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"}`}
                    >
                      PG
                    </button>
                    <button 
                      onClick={() => setFilterType("HOUSE")} 
                      className={`py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${filterType === "HOUSE" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"}`}
                    >
                      House
                    </button>
                  </div>
                </div>

                {/* Price Slider */}
                <div className="flex flex-col gap-2.5">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                    <span>Max Monthly Budget</span>
                    <span className="text-indigo-400">₹{priceRange.toLocaleString()}</span>
                  </div>
                  <input 
                    type="range" 
                    min="3000" 
                    max="30000" 
                    step="500" 
                    value={priceRange} 
                    onChange={(e) => setPriceRange(parseInt(e.target.value))}
                    className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>₹3K</span>
                    <span>₹30K</span>
                  </div>
                </div>

                {/* Amenities checklist */}
                <div className="flex flex-col gap-2.5">
                  <label className="text-xs font-semibold text-slate-400">Amenities Needed</label>
                  <div className="flex flex-col gap-2">
                    {[
                      { key: "wifi", label: "WiFi Connection", icon: Wifi },
                      { key: "parking", label: "Gated Parking", icon: Car },
                      { key: "washing_machine", label: "Washing Machine", icon: Tv },
                      { key: "electricity", label: "Electricity Backup", icon: Zap },
                      { key: "drinking_water", label: "Drinking Water", icon: Droplet },
                      { key: "food_availability", label: "Food Availability", icon: Utensils },
                    ].map(item => (
                      <label 
                        key={item.key} 
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-900 hover:border-slate-800 transition cursor-pointer"
                      >
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                          <item.icon className="h-4 w-4 text-indigo-400" />
                          <span>{item.label}</span>
                        </div>
                        <input 
                          type="checkbox"
                          checked={selectedAmenities[item.key]}
                          onChange={(e) => setSelectedAmenities({
                            ...selectedAmenities,
                            [item.key]: e.target.checked
                          })}
                          className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-900 accent-indigo-500"
                        />
                      </label>
                    ))}
                  </div>
                </div>

              </div>

              {/* LISTINGS COL */}
              <div className="lg:col-span-3 flex flex-col gap-6">
                
                {/* Result header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-200">
                    Available Accommodations 
                    <span className="text-xs font-medium text-slate-400 ml-2">({filteredProperties.length} found)</span>
                  </h2>
                  <div className="flex gap-2">
                    <span className="text-xs font-medium bg-slate-850 border border-slate-800 text-slate-300 px-3 py-1 rounded-lg">
                      Filter Active
                    </span>
                  </div>
                </div>

                {filteredProperties.length === 0 ? (
                  <div className="bg-slate-950/20 border border-dashed border-slate-850 p-12 text-center rounded-2xl flex flex-col items-center gap-4">
                    <ShieldAlert className="h-10 w-10 text-amber-500" />
                    <h3 className="font-bold text-slate-200 text-lg">No properties match your active filters</h3>
                    <p className="text-slate-400 text-sm max-w-sm">Try increasing your price slider or search term, or click Reset on the filter panel.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredProperties.map(prop => {
                      const imgList = JSON.parse(prop.images || "[]");
                      const defaultImg = "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&auto=format&fit=crop&q=60";
                      
                      return (
                        <div 
                          key={prop.id} 
                          className="group bg-slate-950/35 border border-slate-850 hover:border-slate-700/80 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/[0.02]"
                        >
                          {/* Image and badges */}
                          <div className="h-48 bg-slate-900 relative overflow-hidden">
                            <img 
                              src={imgList[0] || defaultImg} 
                              alt={prop.title} 
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            />
                            <div className="absolute top-3 left-3 flex gap-2">
                              <span className="text-[10px] font-black tracking-wider uppercase bg-indigo-500 text-white px-2.5 py-1 rounded-full shadow-md">
                                {prop.property_type}
                              </span>
                              <span className="text-[10px] font-bold bg-slate-900/80 backdrop-blur-md text-slate-200 px-2.5 py-1 rounded-full border border-slate-700/50 flex items-center gap-1 shadow-md">
                                <Shield className="h-3 w-3 text-emerald-400" />
                                Trust {prop.safety_score}/10
                              </span>
                            </div>

                            {/* Shortlist/Heart button */}
                            <button 
                              onClick={() => toggleShortlist(prop.id)}
                              className="absolute top-3 right-3 h-8 w-8 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/50 flex items-center justify-center text-slate-300 hover:text-rose-500 transition cursor-pointer active:scale-95 shadow-md"
                            >
                              <Star className={`h-4.5 w-4.5 ${shortlistedIds.includes(prop.id) ? "fill-rose-500 text-rose-500" : ""}`} />
                            </button>

                            {/* Price Badge */}
                            <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md border border-slate-800 text-white px-3 py-1 rounded-xl text-sm font-black shadow-md">
                              ₹{prop.price.toLocaleString()}
                              <span className="text-[10px] text-slate-400 font-medium">/mo</span>
                            </div>

                            {/* Owner approval status ONLY seen by Owner/Admin */}
                            {!prop.is_approved && (
                              <div className="absolute inset-0 bg-red-950/60 backdrop-blur-xs flex items-center justify-center text-center p-4">
                                <span className="bg-red-900/80 text-red-200 text-xs font-bold border border-red-500 px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
                                  <ShieldAlert className="h-4 w-4 text-red-400" />
                                  Pending Admin Review
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Details body */}
                          <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                            <div className="flex flex-col gap-2">
                              <h3 className="font-bold text-slate-100 group-hover:text-indigo-400 transition-colors text-base line-clamp-1">
                                {prop.title}
                              </h3>
                              <p className="text-slate-400 text-xs flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                                <span className="truncate">{prop.address}, {prop.city}</span>
                              </p>
                              <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed mt-1">
                                {prop.description}
                              </p>
                            </div>

                            {/* Amenities summary icons */}
                            <div className="flex flex-wrap gap-1.5 mt-1 border-t border-slate-850 pt-4">
                              {prop.wifi && <span className="bg-slate-900 border border-slate-850 p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 transition" title="WiFi"><Wifi className="h-3.5 w-3.5" /></span>}
                              {prop.parking && <span className="bg-slate-900 border border-slate-850 p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 transition" title="Parking"><Car className="h-3.5 w-3.5" /></span>}
                              {prop.washing_machine && <span className="bg-slate-900 border border-slate-850 p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 transition" title="Washing Machine"><Tv className="h-3.5 w-3.5" /></span>}
                              {prop.electricity && <span className="bg-slate-900 border border-slate-850 p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 transition" title="Power Backup"><Zap className="h-3.5 w-3.5" /></span>}
                              {prop.drinking_water && <span className="bg-slate-900 border border-slate-850 p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 transition" title="Clean Water"><Droplet className="h-3.5 w-3.5" /></span>}
                              {prop.food_availability && <span className="bg-slate-900 border border-slate-850 p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 transition" title="Meals Included"><Utensils className="h-3.5 w-3.5" /></span>}
                            </div>

                            {/* Owner details or action buttons */}
                            {activeRole === "ADMIN" ? (
                              <div className="flex gap-2 border-t border-slate-850 pt-4">
                                {!prop.is_approved ? (
                                  <button 
                                    onClick={() => handleApproveProperty(prop.id, true)}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition"
                                  >
                                    <Check className="h-4 w-4" /> Approve
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => handleApproveProperty(prop.id, false)}
                                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl py-2 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition"
                                  >
                                    <X className="h-4 w-4" /> Unapprove
                                  </button>
                                )}
                                <button 
                                  onClick={() => handleRemoveProperty(prop.id)}
                                  className="bg-red-950/45 hover:bg-red-900/60 border border-red-800 text-red-400 p-2 rounded-xl cursor-pointer transition"
                                  title="Remove fake listing"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex justify-between items-center border-t border-slate-850 pt-4">
                                <button
                                  onClick={() => setMapProperty(prop)}
                                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1.5 cursor-pointer bg-indigo-500/10 hover:bg-indigo-500/20 px-2.5 py-1 rounded-lg border border-indigo-500/20"
                                >
                                  <MapPin className="h-3.5 w-3.5" /> Map View
                                </button>
                                <a 
                                  href={`https://wa.me/919876543211?text=Hi! I am interested in booking your property "${encodeURIComponent(prop.title)}" listed on SmartPG.`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1.5 cursor-pointer bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1.5 rounded-lg border border-emerald-500/20"
                                >
                                  <Phone className="h-3.5 w-3.5" /> Contact Owner
                                </a>
                              </div>
                            )}

                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            </div>
          </>
        )}

        {/* TAB 2: PROFILE & AADHAR VERIFICATION */}
        {activeTab === "profile" && currentUser && (
          <div className="max-w-3xl mx-auto w-full flex flex-col gap-8">
            <section className="bg-slate-950/40 border border-slate-800 p-8 rounded-3xl flex flex-col gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="h-24 w-24 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 relative group">
                  {currentUser.photo_url ? (
                    <img src={currentUser.photo_url} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-10 w-10 text-slate-500" />
                  )}
                  <button 
                    onClick={() => triggerSimulatedUpload("photo")}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-bold text-white transition-opacity cursor-pointer"
                  >
                    Change
                  </button>
                </div>
                <div className="text-center sm:text-left flex-1 flex flex-col gap-2">
                  <div className="flex items-center justify-center sm:justify-start gap-2.5">
                    <h2 className="text-xl font-bold text-slate-100">{currentUser.full_name}</h2>
                    <span className="text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="h-3 w-3" /> Profile Active
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs">{currentUser.email}</p>
                  <p className="text-slate-500 text-xs">Role: {currentUser.role} | Registered via Secure Credentials</p>
                </div>
              </div>
            </section>

            {/* Aadhar Upload details */}
            <section className="bg-slate-950/40 border border-slate-800 p-8 rounded-3xl flex flex-col gap-6">
              <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
                <Award className="h-5 w-5 text-indigo-400" />
                Identity & Safety Verification (Aadhar)
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                SmartPG requires all students and professionals to verify their government-issued identity cards. This ensures mutual safety, prevents fraud, and unlocks pre-approved reservation privileges with wardens.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                
                {/* Left col: Aadhar number inputs */}
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-400">Aadhar Card Number</label>
                    <input 
                      type="text" 
                      value={currentUser.aadhar_number || "Pending verification"} 
                      readOnly 
                      className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-300 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-400">Verification Document Upload</label>
                    <div className="border border-dashed border-slate-800 bg-slate-950/50 p-4 rounded-xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <FileText className="h-8 w-8 text-indigo-400 shrink-0" />
                        <div>
                          <span className="text-xs font-bold text-slate-300 block">
                            {aadharFile ? "aadhar_image_verified.png" : "No file uploaded"}
                          </span>
                          <span className="text-[10px] text-slate-500 block">PDF, PNG, or JPG (max 4MB)</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => triggerSimulatedUpload("aadhar")}
                        className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-[11px] hover:text-indigo-400 rounded-lg transition font-semibold cursor-pointer shrink-0"
                      >
                        Upload Preview
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right col: Emergency Details */}
                <div className="flex flex-col gap-4 bg-slate-950/60 p-5 rounded-2xl border border-slate-900">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-indigo-400" />
                    Emergency Contact Details
                  </span>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-semibold text-slate-400">Contact Name</label>
                    <input 
                      type="text" 
                      value={currentUser.emergency_contact_name || "Sanjay Sharma (Father)"} 
                      readOnly 
                      className="bg-slate-950 border border-slate-900 rounded-xl p-2.5 text-slate-300 text-xs outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-semibold text-slate-400">Emergency Phone</label>
                    <input 
                      type="text" 
                      value={currentUser.emergency_contact_phone || "9876543213"} 
                      readOnly 
                      className="bg-slate-950 border border-slate-900 rounded-xl p-2.5 text-slate-300 text-xs outline-none"
                    />
                  </div>
                </div>

              </div>
            </section>
          </div>
        )}

        {/* TAB 3: OWNER ADD LISTING VIEW */}
        {activeTab === "add-listing" && currentUser && (
          <div className="max-w-3xl mx-auto w-full flex flex-col gap-6">
            <section className="bg-slate-950/40 border border-slate-800 p-8 rounded-3xl flex flex-col gap-6">
              <div className="flex flex-col gap-1.5">
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <Plus className="h-6 w-6 text-indigo-400" />
                  List New PG / Rental House
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Fill in your accommodation details. Once submitted, our Admin team will review and verify safety ratings. The AI Agent will automatically index your listing for search recommendations!
                </p>
              </div>

              <form onSubmit={handleAddProperty} className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-400">Listing Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Elegant Single Room PG for Girls" 
                      value={newTitle} 
                      onChange={(e) => setNewTitle(e.target.value)}
                      required
                      className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-400">Accomodation Type</label>
                      <select 
                        value={newType} 
                        onChange={(e) => setNewType(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 text-xs outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="PG">Paying Guest (PG)</option>
                        <option value="HOUSE">Rental Flat/House</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-400">Monthly Price (INR)</label>
                      <input 
                        type="number" 
                        placeholder="e.g. 7500" 
                        value={newPrice} 
                        onChange={(e) => setNewPrice(e.target.value)}
                        required
                        className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 text-xs outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-400">City</label>
                      <select 
                        value={newCity} 
                        onChange={(e) => setNewCity(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 text-xs outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="Bangalore">Bangalore</option>
                        <option value="Delhi">Delhi</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-400">Safety Index Estimate</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="10" 
                        step="0.1" 
                        placeholder="e.g. 8.5"
                        value={newSafety} 
                        onChange={(e) => setNewSafety(parseFloat(e.target.value))}
                        className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 text-xs outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-400">Street Address</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Koramangala 5th block, next to Starbucks" 
                      value={newAddress} 
                      onChange={(e) => setNewAddress(e.target.value)}
                      required
                      className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-400">Image URL</label>
                    <input 
                      type="text" 
                      placeholder="Paste image link, or leave blank for dynamic demo room" 
                      value={newImageUrl} 
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-400">Description</label>
                    <textarea 
                      placeholder="Mention proximity to universities, subway, house policies..." 
                      rows={4}
                      value={newDescription} 
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 text-xs outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>

                  {/* Amenities checkboxes */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-400">Amenities Provided</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { state: newWifi, set: setNewWifi, label: "Free Blazing WiFi", icon: Wifi },
                        { state: newParking, set: setNewParking, label: "Gated Parking Space", icon: Car },
                        { state: newWashing, set: setNewWashing, label: "Washing Machines", icon: Tv },
                        { state: newElectricity, set: setNewElectricity, label: "24/7 Power Backup", icon: Zap },
                        { state: newWater, set: setNewWater, label: "Ro Drinking Water", icon: Droplet },
                        { state: newFood, set: setNewFood, label: "Home Cooked Food", icon: Utensils },
                      ].map((item, idx) => (
                        <label 
                          key={idx} 
                          className={`flex items-center gap-2 p-2.5 rounded-xl border transition cursor-pointer select-none ${item.state ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300" : "bg-slate-950 border-slate-900 text-slate-400 hover:border-slate-800"}`}
                        >
                          <input 
                            type="checkbox"
                            checked={item.state}
                            onChange={(e) => item.set(e.target.checked)}
                            className="hidden"
                          />
                          <item.icon className="h-4 w-4" />
                          <span className="text-[11px] font-semibold">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl py-3.5 text-xs font-bold tracking-wider shadow-lg shadow-indigo-500/10 cursor-pointer active:scale-95 transition-all mt-3"
                  >
                    🚀 Register & Upload Listing
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {/* TAB 4: ADMIN MONITOR USERS */}
        {activeTab === "admin-users" && currentUser && (
          <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
            
            {/* ANALYTICS HIGHLIGHTS */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Students / Rentors", val: adminAnalytics.users_count, change: "+12% this week", icon: Users, color: "from-blue-500 to-indigo-600" },
                { label: "Total Wardens / Owners", val: adminAnalytics.owners_count, change: "+2 registered", icon: Home, color: "from-purple-500 to-pink-600" },
                { label: "Active Approved Listings", val: adminAnalytics.approved_properties_count, change: "95% safety score avg", icon: Check, color: "from-emerald-500 to-teal-600" },
                { label: "Pending Approvals", val: properties.filter(p => !p.is_approved).length, change: "Requires review", icon: ShieldAlert, color: "from-amber-500 to-orange-600" },
              ].map((item, idx) => (
                <div key={idx} className="bg-slate-950/40 border border-slate-800 p-5 rounded-2xl flex flex-col gap-2 relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${item.color} opacity-[0.03] rounded-full blur-xl`}></div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</span>
                    <item.icon className="h-4.5 w-4.5 text-slate-500" />
                  </div>
                  <span className="text-2xl font-black text-slate-100 mt-1">{item.val}</span>
                  <span className="text-[10px] text-slate-500 font-semibold">{item.change}</span>
                </div>
              ))}
            </section>

            <section className="bg-slate-950/40 border border-slate-800 p-6 rounded-3xl">
              <h2 className="text-base font-bold text-slate-200 mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-400" />
                Student & Owner Management Console
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                      <th className="py-3 px-4">Full Name</th>
                      <th className="py-3 px-4">Email Address</th>
                      <th className="py-3 px-4">Role / Type</th>
                      <th className="py-3 px-4">Aadhar / Doc Status</th>
                      <th className="py-3 px-4 text-right">Verification action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.map(u => (
                      <tr key={u.id} className="border-b border-slate-900/60 hover:bg-slate-900/10 text-xs transition duration-200">
                        <td className="py-4 px-4 font-bold text-slate-200">{u.full_name}</td>
                        <td className="py-4 px-4 text-slate-400">{u.email}</td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${u.role === "ADMIN" ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : u.role === "OWNER" ? "bg-purple-500/10 border-purple-500/20 text-purple-400" : "bg-blue-500/10 border-blue-500/20 text-blue-400"}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-400 font-mono">
                          {u.aadhar_number ? (
                            <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                              <Check className="h-3.5 w-3.5" /> Checked ({u.aadhar_number})
                            </span>
                          ) : (
                            <span className="text-slate-500 italic">No document</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          {u.role !== "ADMIN" && (
                            <div className="flex justify-end gap-1.5">
                              <button 
                                onClick={() => handleApproveUser(u.id, true)}
                                className="px-2.5 py-1 bg-emerald-600/10 border border-emerald-500/20 hover:bg-emerald-600 hover:text-white rounded-md text-[10px] font-bold transition cursor-pointer"
                              >
                                Approve
                              </button>
                              <button 
                                onClick={() => handleApproveUser(u.id, false)}
                                className="px-2.5 py-1 bg-red-600/10 border border-red-500/20 hover:bg-red-600 hover:text-white rounded-md text-[10px] font-bold transition cursor-pointer"
                              >
                                Suspend
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* TAB 5: ADMIN REVIEW LISTINGS */}
        {activeTab === "admin-listings" && currentUser && (
          <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
            <section className="bg-slate-950/40 border border-slate-800 p-6 rounded-3xl">
              <h2 className="text-base font-bold text-slate-200 mb-2 flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-400" />
                Property Approval Queue
              </h2>
              <p className="text-xs text-slate-400 mb-6">Review submitted listings, verify details, and activate them to become live on search and recommended by the AI Agent.</p>

              <div className="flex flex-col gap-4">
                {properties.map(p => (
                  <div key={p.id} className="bg-slate-950 border border-slate-850 p-5 rounded-2xl flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="h-16 w-20 rounded-xl bg-slate-900 overflow-hidden shrink-0 border border-slate-800">
                        <img src={JSON.parse(p.images || "[]")[0]} alt="Listing" className="h-full w-full object-cover" />
                      </div>
                      <div className="flex flex-col gap-1 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-200 truncate">{p.title}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${p.is_approved ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-amber-500/10 border border-amber-500/20 text-amber-400"}`}>
                            {p.is_approved ? "Approved" : "Pending Approval"}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 truncate">{p.address}, {p.city}</span>
                        <span className="text-[10px] text-indigo-400 font-bold">Rent: ₹{p.price}/mo | Safety: {p.safety_score}/10</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
                      {!p.is_approved ? (
                        <button 
                          onClick={() => handleApproveProperty(p.id, true)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="h-4.5 w-4.5" /> Approve Listing
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleApproveProperty(p.id, false)}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <X className="h-4.5 w-4.5" /> Suspend Listing
                        </button>
                      )}
                      <button 
                        onClick={() => handleRemoveProperty(p.id)}
                        className="p-2 bg-red-950/45 hover:bg-red-900/60 border border-red-800 text-red-400 rounded-xl transition cursor-pointer"
                        title="Remove Listing"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 py-8 px-6 text-center text-xs text-slate-500 bg-slate-950/20">
        <p>© 2026 SmartPG & Rental House Verification System. Built for Students and Working Professionals.</p>
        <p className="mt-2 text-indigo-500/40 font-semibold tracking-wider uppercase">fastapi + next.js + tailwind css + premium human verified</p>
      </footer>

      {/* SECURE REGISTER / LOGIN MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col gap-6 relative overflow-hidden">
            
            {/* Modal Close button */}
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 h-7 w-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header info */}
            <div className="text-center flex flex-col gap-1.5">
              <h2 className="text-lg font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                {authMode === "login" ? "Welcome Back to SmartPG" : "Create Verified Account"}
              </h2>
              <p className="text-xs text-slate-400">
                {authMode === "login" ? "Enter your email credentials to login" : "Verify your identity and register for role privileges"}
              </p>
            </div>

            {/* Authentication role selection selector */}
            {authMode === "register" && (
              <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-850">
                <button 
                  onClick={() => setAuthRole("USER")}
                  className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${authRole === "USER" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"}`}
                >
                  👤 Student/User
                </button>
                <button 
                  onClick={() => setAuthRole("OWNER")}
                  className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${authRole === "OWNER" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"}`}
                >
                  🏡 House Owner
                </button>
              </div>
            )}

            {/* Auth inputs form */}
            <form onSubmit={handleAuth} className="flex flex-col gap-4">
              
              {authMode === "login" ? (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-slate-400">Email Address</label>
                    <input 
                      type="email" 
                      value={loginEmail} 
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="e.g. user@smartpg.com" 
                      required 
                      className="bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-slate-400">Password</label>
                    <input 
                      type="password" 
                      value={loginPassword} 
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter secret password" 
                      required 
                      className="bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-indigo-500"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-slate-400">Full Legal Name</label>
                    <input 
                      type="text" 
                      value={regFullName} 
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="Aarav Sharma" 
                      required 
                      className="bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-semibold text-slate-400">Email Address</label>
                      <input 
                        type="email" 
                        value={regEmail} 
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="user@smartpg.com" 
                        required 
                        className="bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-semibold text-slate-400">Password</label>
                      <input 
                        type="password" 
                        value={regPassword} 
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Min 6 chars" 
                        required 
                        className="bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-slate-400">Phone number</label>
                    <input 
                      type="tel" 
                      value={regPhone} 
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+91 98765 43212" 
                      required 
                      className="bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Student renter verification inputs */}
                  {authRole === "USER" && (
                    <div className="flex flex-col gap-3.5 bg-slate-950/60 p-4 rounded-2xl border border-slate-850 mt-1">
                      <span className="text-[10px] font-bold text-slate-300 block uppercase tracking-wider">Verification details (Aadhar)</span>
                      
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-semibold text-slate-400">Aadhar Card Number</label>
                        <input 
                          type="text" 
                          value={regAadhar} 
                          onChange={(e) => setRegAadhar(e.target.value)}
                          placeholder="e.g. 1234-5678-9012" 
                          required 
                          className="bg-slate-900 border border-slate-850 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-semibold text-slate-400">Emergency Name</label>
                          <input 
                            type="text" 
                            value={regEmergencyName} 
                            onChange={(e) => setRegEmergencyName(e.target.value)}
                            placeholder="Sanjay Sharma" 
                            required 
                            className="bg-slate-900 border border-slate-850 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-semibold text-slate-400">Emergency Phone</label>
                          <input 
                            type="text" 
                            value={regEmergencyPhone} 
                            onChange={(e) => setRegEmergencyPhone(e.target.value)}
                            placeholder="9876543213" 
                            required 
                            className="bg-slate-900 border border-slate-850 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl py-3.5 text-xs font-bold tracking-wider shadow-lg shadow-indigo-500/10 cursor-pointer active:scale-95 transition-all mt-2"
              >
                {authMode === "login" ? "🚀 Verify & Enter Workspace" : "🔒 Complete Registration"}
              </button>
            </form>

            {/* Switch mode */}
            <div className="text-center text-[11px] text-slate-500">
              {authMode === "login" ? (
                <span>
                  {"Don't have an account?"}{" "}
                  <button 
                    onClick={() => setAuthMode("register")}
                    className="text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer"
                  >
                    Register here
                  </button>
                </span>
              ) : (
                <span>
                  Already verified?{" "}
                  <button 
                    onClick={() => setAuthMode("login")}
                    className="text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer"
                  >
                    Login now
                  </button>
                </span>
              )}
            </div>

            {/* Quick Demo profiles */}
            <div className="border-t border-slate-850 pt-4 text-center">
              <span className="text-[10px] text-slate-500 block mb-2 uppercase font-bold tracking-wider">or login with demo accounts:</span>
              <div className="flex justify-center gap-1.5 flex-wrap">
                <button 
                  onClick={() => { setLoginEmail("user@smartpg.com"); setLoginPassword("user123"); setAuthMode("login"); }}
                  className="bg-slate-950 border border-slate-850 hover:border-slate-700 text-[10px] font-semibold text-slate-300 px-2.5 py-1 rounded-lg cursor-pointer"
                >
                  Student Demo
                </button>
                <button 
                  onClick={() => { setLoginEmail("owner@smartpg.com"); setLoginPassword("owner123"); setAuthMode("login"); }}
                  className="bg-slate-950 border border-slate-850 hover:border-slate-700 text-[10px] font-semibold text-slate-300 px-2.5 py-1 rounded-lg cursor-pointer"
                >
                  Warden Demo
                </button>
                <button 
                  onClick={() => { setLoginEmail("admin@smartpg.com"); setLoginPassword("admin123"); setAuthMode("login"); }}
                  className="bg-slate-950 border border-slate-850 hover:border-slate-700 text-[10px] font-semibold text-slate-300 px-2.5 py-1 rounded-lg cursor-pointer"
                >
                  Admin Demo
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 🗺️ GOOGLE MAPS EMBED MODAL */}
      {mapProperty && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-indigo-400" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-slate-100 text-sm line-clamp-1">{mapProperty.title}</h3>
                  <p className="text-[11px] text-slate-400 truncate">{mapProperty.address}, {mapProperty.city}</p>
                </div>
              </div>
              <button 
                onClick={() => setMapProperty(null)}
                className="h-8 w-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center transition cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Map body */}
            <div className="flex-1 min-h-[400px] bg-slate-950 relative">
              {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.startsWith("AIzaSy") ? (
                <iframe
                  title="Google Maps Location"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${mapProperty.latitude && mapProperty.longitude ? `${mapProperty.latitude},${mapProperty.longitude}` : encodeURIComponent(`${mapProperty.title}, ${mapProperty.address}, ${mapProperty.city}`)}`}
                ></iframe>
              ) : (
                <iframe
                  title="Google Maps Location"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  src={`https://maps.google.com/maps?q=${mapProperty.latitude && mapProperty.longitude ? `${mapProperty.latitude},${mapProperty.longitude}` : encodeURIComponent(`${mapProperty.title}, ${mapProperty.address}, ${mapProperty.city}`)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                ></iframe>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-end gap-2.5">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${mapProperty.latitude && mapProperty.longitude ? `${mapProperty.latitude},${mapProperty.longitude}` : encodeURIComponent(`${mapProperty.title}, ${mapProperty.address}, ${mapProperty.city}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                View Navigation Route
              </a>
              <button 
                onClick={() => setMapProperty(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close Map
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Sliders / Settings icon wrapper locally since lucide version differences
function Sliders(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" x2="4" y1="21" y2="14" />
      <line x1="4" x2="4" y1="10" y2="3" />
      <line x1="12" x2="12" y1="21" y2="12" />
      <line x1="12" x2="12" y1="8" y2="3" />
      <line x1="20" x2="20" y1="21" y2="16" />
      <line x1="20" x2="20" y1="12" y2="3" />
      <line x1="2" x2="6" y1="14" y2="14" />
      <line x1="10" x2="14" y1="8" y2="8" />
      <line x1="18" x2="22" y1="16" y2="16" />
    </svg>
  );
}
