"use client";

import React from "react";
import { Card } from "@/ui-components/Card";

export default function SignUp() {
  const handleSignUp = () => {
    //For now just redirects to the dashboard
    window.location.href = "/";
  };

  const handleLogin = () => {
    window.location.href = "/login";
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-[var(--card-bg)] p-4">
      <Card title="Welcome" styles="w-full h-128 max-w-xl shadow-2xl">
        <div className="flex flex-col gap-6 w-full p-6 bg-[var(--card-bg)] text-[var(--card-text)] rounded-b-lg">
          <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-col gap-1.5 w-full text-left">
              <label className="text-sm font-medium text-[var(--card-text)] opacity-90">
                Email Address
              </label>
              <input
                type="email"
                className="w-full bg-[var(--card-header-bg)] text-[var(--card-text)] border border-[var(--card-border)] rounded-md px-3 py-2.5 focus:outline-none focus:border-[var(--card-accent)] transition-colors placeholder:text-gray-500"
                placeholder="name@example.com"
              />
            </div>

            <div className="flex flex-col gap-1.5 w-full text-left">
              <label className="text-sm font-medium text-[var(--card-text)] opacity-90">
                Username
              </label>
              <input
                type="text"
                className="w-full bg-[var(--card-header-bg)] text-[var(--card-text)] border border-[var(--card-border)] rounded-md px-3 py-2.5 focus:outline-none focus:border-[var(--card-accent)] transition-colors placeholder:text-gray-500"
                placeholder="username"
              />
            </div>

            <div className="flex flex-col gap-1.5 w-full text-left">
              <label className="text-sm font-medium text-[var(--card-text)] opacity-90">
                Password
              </label>
              <input
                type="password"
                className="w-full bg-[var(--card-header-bg)] text-[var(--card-text)] border border-[var(--card-border)] rounded-md px-3 py-2.5 focus:outline-none focus:border-[var(--card-accent)] transition-colors placeholder:text-gray-500"
                placeholder="••••••••"
              />
            </div>

            <div className="flex flex-col gap-1.5 w-full text-left">
              <label className="text-sm font-medium text-[var(--card-text)] opacity-90">
                Confirm Password
              </label>
              <input
                type="password"
                className="w-full bg-[var(--card-header-bg)] text-[var(--card-text)] border border-[var(--card-border)] rounded-md px-3 py-2.5 focus:outline-none focus:border-[var(--card-accent)] transition-colors placeholder:text-gray-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex flex-row gap-3 w-full pt-2">
            <button
              onClick={handleLogin}
              className="flex-1 bg-transparent border border-[var(--card-border)] text-[var(--card-text)] font-medium rounded-md py-2.5 hover:bg-[var(--card-header-bg)] transition-colors cursor-pointer"
            >
              Already Have an Account? Login
            </button>
            <button
              onClick={handleSignUp}
              className="flex-1 bg-[var(--card-accent)] text-white font-medium rounded-md py-2.5 hover:opacity-90 transition-opacity cursor-pointer shadow-lg shadow-red-950/20"
            >
              Sign Up
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
