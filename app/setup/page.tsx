"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    schoolName: "",
    address: "",
    contactInfo: "",
    adminEmail: "",
    adminPhone: "",
    adminPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.adminPassword !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setIsLoading(true);
    
    // Call backend API here to initialize school profile
    // await fetch('/api/setup', { ... })
    
    setTimeout(() => {
      setIsLoading(false);
      // Redirect to dashboard after successful setup
      router.push("/dashboard");
    }, 1500);
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-4">
        <h3 className="text-lg font-medium leading-6 text-slate-900 border-b pb-2">
          1. School Details
        </h3>
        <div>
          <label className="block text-sm font-medium text-slate-700">School Name</label>
          <div className="mt-1">
            <input
              type="text"
              name="schoolName"
              required
              value={formData.schoolName}
              onChange={handleChange}
              className="appearance-none block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="e.g. Global International Academy"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Address</label>
          <div className="mt-1">
            <input
              type="text"
              name="address"
              required
              value={formData.address}
              onChange={handleChange}
              className="appearance-none block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4">
        <h3 className="text-lg font-medium leading-6 text-slate-900 border-b pb-2">
          2. Super Admin Credentials
        </h3>
        
        <div>
          <label className="block text-sm font-medium text-slate-700">Admin Email</label>
          <div className="mt-1">
            <input
              type="email"
              name="adminEmail"
              required
              value={formData.adminEmail}
              onChange={handleChange}
              className="appearance-none block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Admin Phone</label>
          <div className="mt-1">
            <input
              type="tel"
              name="adminPhone"
              required
              value={formData.adminPhone}
              onChange={handleChange}
              className="appearance-none block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <div className="mt-1">
              <input
                type="password"
                name="adminPassword"
                required
                value={formData.adminPassword}
                onChange={handleChange}
                className="appearance-none block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Confirm Password</label>
            <div className="mt-1">
              <input
                type="password"
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="appearance-none block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-primary/50"
        >
          {isLoading ? "Setting up..." : "Complete Setup"}
        </button>
      </div>
    </form>
  );
}
