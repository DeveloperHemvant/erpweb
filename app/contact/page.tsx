"use client";

import React, { useState } from "react";
import { PublicLayout } from "@/layouts/public-layout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export default function ContactPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({ name: "", email: "", msg: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast("Message Sent", { description: "Our operations team will get back to you shortly.", type: "success" });
    setFormData({ name: "", email: "", msg: "" });
  };

  return (
    <PublicLayout>
      <div className="max-w-xl mx-auto py-20 px-6 space-y-8">
        <div className="space-y-3 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-text-primary">Contact Admissions</h1>
          <p className="text-text-secondary text-sm">Have configuration questions? Complete the inquiry form below.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-card border border-border p-8 rounded-card shadow-soft">
          <Input
            label="Full Name"
            placeholder="John Doe"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="Campus Email Address"
            type="email"
            placeholder="jdoe@school.edu"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Textarea
            label="Inquiry Message"
            placeholder="Describe your issue or query details..."
            required
            value={formData.msg}
            onChange={(e) => setFormData({ ...formData, msg: e.target.value })}
          />
          <Button type="submit" variant="primary" className="w-full">
            Submit Inquiry
          </Button>
        </form>
      </div>
    </PublicLayout>
  );
}
