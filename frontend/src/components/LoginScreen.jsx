"use client";

import { useState } from "react";
import { auth, googleProvider } from "../lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { Activity } from "lucide-react";

export default function LoginScreen({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const endpoint = isLogin ? "/api/login" : "/api/signup";
    const payload = isLogin ? { email, password } : { email, password, name };

    try {
      const res = await fetch(`http://localhost:4000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        onLoginSuccess(data.user, data.token);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to connect to backend API.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      
      // Exchange Firebase user info for our custom JWT
      const res = await fetch('http://localhost:4000/api/auth/google', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: result.user.email,
          name: result.user.displayName
        })
      });
      const data = await res.json();
      
      if (data.success) {
        onLoginSuccess(result.user, data.token);
      } else {
        setError(data.error || "Failed to issue JWT.");
      }
    } catch (err) {
      setError(err.message || "Failed to authenticate with Google.");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif", backgroundColor: "#f8fafc", color: "#374151" }}>
      <main style={{ width: "100%", maxWidth: "400px", padding: "20px" }}>
        
        {/* Branding */}
        <div style={{ textAlign: "center", marginBottom: "32px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: "48px", height: "48px", backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px", boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)" }}>
            <Activity size={24} color="#7c3aed" />
          </div>
          <h1 style={{ fontSize: "30px", fontWeight: "700", color: "#111827", margin: 0 }}>Lyzr Agent</h1>
          <p style={{ fontSize: "14px", color: "#374151", margin: "8px 0 0 0" }}>{isLogin ? "Sign in to continue" : "Create an account"}</p>
        </div>

        {/* Card */}
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "32px", boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)" }}>
          
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {error && (
              <div style={{ backgroundColor: "#fef2f2", border: "1px solid #ef4444", color: "#b91c1c", fontSize: "12px", fontWeight: "700", padding: "12px", borderRadius: "8px", textAlign: "center" }}>
                {error}
              </div>
            )}

            {!isLogin && (
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#374151", textTransform: "uppercase", marginBottom: "6px" }}>Full Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required={!isLogin}
                  placeholder="Jane Doe"
                  style={{ width: "100%", padding: "10px 14px", backgroundColor: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "12px", color: "#111827", outline: "none", transition: "border 150ms" }}
                  onFocus={(e) => { e.target.style.borderColor = "#ddd6fe"; e.target.style.boxShadow = "0 0 0 2px rgba(124,58,237,0.2)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }}
                />
              </div>
            )}
            
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#374151", textTransform: "uppercase", marginBottom: "6px" }}>Email</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="developer@hidevs.com"
                style={{ width: "100%", padding: "10px 14px", backgroundColor: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "12px", color: "#111827", outline: "none", transition: "border 150ms" }}
                onFocus={(e) => { e.target.style.borderColor = "#ddd6fe"; e.target.style.boxShadow = "0 0 0 2px rgba(124,58,237,0.2)"; }}
                onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }}
              />
            </div>
            
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <label style={{ fontSize: "11px", fontWeight: "700", color: "#374151", textTransform: "uppercase" }}>Password</label>
              </div>
              <input 
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{ width: "100%", padding: "10px 14px", backgroundColor: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "12px", color: "#111827", outline: "none", transition: "border 150ms" }}
                onFocus={(e) => { e.target.style.borderColor = "#ddd6fe"; e.target.style.boxShadow = "0 0 0 2px rgba(124,58,237,0.2)"; }}
                onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }}
              />
            </div>
            
            <button 
              disabled={isLoading}
              type="submit"
              style={{ 
                width: "100%", padding: "12px 16px", backgroundColor: "#7c3aed", color: "#ffffff", 
                fontSize: "14px", fontWeight: "700", borderRadius: "8px", border: "none", 
                cursor: isLoading ? "not-allowed" : "pointer", opacity: isLoading ? 0.7 : 1, transition: "background 150ms",
                marginTop: "8px"
              }}
              onMouseOver={(e) => !isLoading && (e.currentTarget.style.backgroundColor = "#6d28d9")}
              onMouseOut={(e) => !isLoading && (e.currentTarget.style.backgroundColor = "#7c3aed")}
            >
              {isLoading ? "Processing..." : isLogin ? "Sign in" : "Sign up"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "24px" }}>
            <span style={{ fontSize: "12px", color: "#374151" }}>
              {isLogin ? "Don't have an account?" : "Already have an account?"}
            </span>
            <button 
              onClick={() => setIsLogin(!isLogin)}
              style={{ 
                background: "transparent", border: "none", color: "#7c3aed", fontSize: "12px", 
                fontWeight: "700", marginLeft: "6px", cursor: "pointer", textDecoration: "underline" 
              }}
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px", margin: "24px 0" }}>
            <div style={{ flex: 1, height: "1px", backgroundColor: "#e5e7eb" }}></div>
            <span style={{ fontSize: "10px", fontWeight: "700", color: "#9ca3af", textTransform: "uppercase" }}>Or</span>
            <div style={{ flex: 1, height: "1px", backgroundColor: "#e5e7eb" }}></div>
          </div>

          <button 
            type="button" 
            onClick={handleGoogleLogin} 
            style={{ 
              width: "100%", padding: "10px 14px", backgroundColor: "#ffffff", color: "#374151", 
              border: "1px solid #e5e7eb", fontSize: "12px", fontWeight: "700", borderRadius: "8px", 
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)", transition: "background 150ms"
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#ffffff"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign {isLogin ? "in" : "up"} with Google
          </button>
        </div>
      </main>
    </div>
  );
}
