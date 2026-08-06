"use client";

import React, { useEffect } from "react";
import { useToast } from "@/components/ui/toast";

export function FetchInterceptorProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();

  useEffect(() => {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      let [resource, config] = args;
      
      const url = typeof resource === 'string' ? resource : resource instanceof Request ? resource.url : '';
      const isApiRequest = url.startsWith(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');
      
      if (isApiRequest) {
        const token = localStorage.getItem('token');
        if (token) {
          config = config || {};
          config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${token}`
          };
          if (resource instanceof Request) {
            resource = new Request(resource, config);
          }
        }
      }
      
      try {
        const response = await originalFetch(resource, config);
        
        // Intercept 401 Unauthorized
        if (response.status === 401 && isApiRequest && !url.includes('/auth/login')) {
          let isPortalUser = false;
          try {
            const storedUser = localStorage.getItem('user');
            isPortalUser = !!storedUser && !!JSON.parse(storedUser).userType;
          } catch {}

          localStorage.removeItem('token');
          localStorage.removeItem('user');
          toast("Session Expired", { description: "Please log in again.", type: "error" });
          window.location.href = isPortalUser ? '/portal/login' : '/login'; // Force full reload redirect
        }
        
        return response;
      } catch (error) {
        throw error;
      }
    };

    // Cleanup isn't strictly necessary since it's meant to be global, but good practice
    return () => {
      window.fetch = originalFetch;
    };
  }, [toast]);

  return <>{children}</>;
}
