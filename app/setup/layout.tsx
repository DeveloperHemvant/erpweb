import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Initial Setup | School ERP",
  description: "Complete the initial setup of your School ERP system.",
};

export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          School ERP Setup
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Welcome to your new School ERP. Let's get things configured!
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-200">
          {children}
        </div>
      </div>
    </div>
  );
}
