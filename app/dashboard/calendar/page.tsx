"use client";

import React, { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Clock, BookOpen, MapPin } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function MyCalendarPage() {
  const [calendar, setCalendar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        const res = await fetch(`${API_URL}/acms/my-calendar`);
        if (res.ok) {
          setCalendar(await res.json());
        }
      } catch (err) {
        console.error("Failed to load unified calendar", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCalendar();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case "HOLIDAY": return <CalendarIcon className="h-5 w-5 text-emerald-500" />;
      case "EVENT": return <MapPin className="h-5 w-5 text-indigo-500" />;
      case "EXAM": return <BookOpen className="h-5 w-5 text-rose-500" />;
      default: return <Clock className="h-5 w-5 text-slate-500" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">My Academic Calendar</h1>
          <p className="text-text-secondary">Your personalized timeline of holidays, exams, and school events.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Main Timeline */}
        <div className="md:col-span-2 space-y-4">
          {loading ? (
            <div className="p-12 text-center text-text-secondary">Syncing calendars...</div>
          ) : calendar.length > 0 ? (
            calendar.map((item, idx) => (
              <div key={idx} className="flex gap-4 p-4 bg-white dark:bg-dark-paper border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex-shrink-0 mt-1">
                  {getIcon(item.type)}
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-text-primary">{item.title}</h3>
                    <span className="text-xs font-medium text-text-secondary bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                      {new Date(item.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary mt-1">{item.details}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-text-secondary bg-white dark:bg-dark-paper border border-border rounded-xl">
              <CalendarIcon className="h-10 w-10 mx-auto text-slate-300 mb-3" />
              <p>Your calendar is completely clear!</p>
            </div>
          )}
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-4">
          <div className="bg-slate-50 dark:bg-slate-900/40 border border-border rounded-xl p-5 shadow-sm">
            <h3 className="font-bold flex items-center gap-2 text-text-primary mb-4">
              <CalendarIcon className="h-4 w-4 text-primary" /> This Timeline
            </h3>
            <div className="space-y-3 text-sm text-text-secondary">
              <div className="flex justify-between">
                <span>Holidays</span>
                <span className="font-semibold text-text-primary">{calendar.filter((c) => c.type === "HOLIDAY").length}</span>
              </div>
              <div className="flex justify-between">
                <span>Events</span>
                <span className="font-semibold text-text-primary">{calendar.filter((c) => c.type === "EVENT").length}</span>
              </div>
              <div className="flex justify-between">
                <span>Exams</span>
                <span className="font-semibold text-text-primary">{calendar.filter((c) => c.type === "EXAM").length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
