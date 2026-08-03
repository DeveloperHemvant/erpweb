"use client";

import React, { useState } from "react";
import { UploadCloud, FileText, X, Check } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export interface FileUploadProps {
  onFileSelect?: (file: File) => void;
  accept?: string;
  label?: string;
  maxSizeMB?: number;
}

export function FileUpload({ onFileSelect, accept, label = "Upload academic documents", maxSizeMB = 5 }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`File size exceeds limit of ${maxSizeMB}MB.`);
      return;
    }
    setSelectedFile(file);
    onFileSelect?.(file);
    
    // Simulate upload progress
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setProgress(0);
  };

  return (
    <div className="w-full">
      <label className="block text-xs font-semibold text-text-secondary mb-1.5 ml-0.5">
        {label}
      </label>
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed border-border rounded-card bg-white dark:bg-slate-800 p-8 text-center flex flex-col items-center justify-center transition-all duration-200",
          isDragActive && "border-primary bg-primary/5",
          selectedFile && "border-solid bg-slate-50/50 dark:bg-slate-900/40"
        )}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        {!selectedFile ? (
          <>
            <div className="p-3 bg-slate-100 dark:bg-slate-700/60 rounded-full mb-3 text-text-secondary">
              <UploadCloud className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-semibold text-text-primary">
              Drag & Drop file here or click to browse
            </p>
            <p className="text-xs text-text-secondary mt-1">
              Supports PDF, PNG, JPG up to {maxSizeMB}MB
            </p>
          </>
        ) : (
          <div className="w-full flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-100 dark:bg-slate-700 rounded-btn">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-text-primary truncate max-w-[200px]">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-text-secondary mt-0.5">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            
            {progress < 100 ? (
              <div className="flex items-center gap-2">
                <div className="w-20 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-primary h-full transition-all duration-200" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-xs font-semibold text-text-secondary">{progress}%</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="p-1 bg-success/10 text-success rounded-full">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <Button variant="ghost" size="sm" onClick={clearFile} className="h-8 w-8 p-0 cursor-pointer">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
