"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { Tabs } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Search, Plus, Trash2, Wallet, Calculator, Printer, CheckCircle, FileText, Settings } from "lucide-react";

interface SiblingDetails {
  name: string;
}

interface StudentDef {
  id: string;
  admissionNumber: string;
  fullName: string;
  classId: string;
  grade: { id: string; grade: string; sessionId: string };
  details?: {
    siblings?: SiblingDetails[];
    fatherProfession?: string;
  };
}

interface PaymentDef {
  id: string;
  amountPaid: string;
  paymentMode: string;
  referenceNo?: string;
  paymentDate: string;
}

interface FeeInvoiceDef {
  id: string;
  studentId: string;
  amount: string;
  dueDate: string;
  status: string;
  payments: PaymentDef[];
  student: {
    fullName: string;
    admissionNumber: string;
    grade: { grade: string };
    details?: {
      siblings?: SiblingDetails[];
      fatherProfession?: string;
    };
  };
}

interface FeeComponent {
  name: string;
  amount: number;
}

interface SessionDef {
  id: string;
  name: string;
  isActive: boolean;
}

interface ClassDef {
  id: string;
  grade: string;
  sessionId: string;
}

export default function FeesPage() {
  const { toast } = useToast();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [activeTab, setActiveTab] = useState("ledger");
  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState<StudentDef[]>([]);
  const [invoices, setInvoices] = useState<FeeInvoiceDef[]>([]);
  const [sessions, setSessions] = useState<SessionDef[]>([]);
  const [classes, setClasses] = useState<ClassDef[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handlePrintReceipt = () => {
    window.print();
  };

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Class-wise Fee Structures (Tuition is tax-exempted; Labs & Infrastructure have 9% CGST + 9% SGST)
  const [classStructures, setClassStructures] = useState<Record<string, FeeComponent[]>>({
    "Grade 9": [
      { name: "Tuition Fee", amount: 15000 },
      { name: "Science Lab Levy", amount: 2000 },
      { name: "Sports Development", amount: 1500 },
    ],
    "Grade 10": [
      { name: "Tuition Fee", amount: 16000 },
      { name: "Science Lab Levy", amount: 2000 },
      { name: "Computer Lab Infrastructure", amount: 2500 },
    ],
    "Grade 11": [
      { name: "Tuition Fee", amount: 18000 },
      { name: "Advanced Science Labs", amount: 3500 },
      { name: "Library Membership", amount: 1000 },
    ],
    "Grade 12": [
      { name: "Tuition Fee", amount: 18000 },
      { name: "Advanced Science Labs", amount: 3500 },
      { name: "Exam Board Allocation", amount: 2000 },
    ],
  });

  // Selected class for structure tab
  const [selectedStructureClass, setSelectedStructureClass] = useState("Grade 10");
  const [newComponentName, setNewComponentName] = useState("");
  const [newComponentAmount, setNewComponentAmount] = useState("1000");

  // Invoice generate modal states (CASCADED SELECTORS)
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [invoiceSessionId, setInvoiceSessionId] = useState("");
  const [invoiceClassId, setInvoiceClassId] = useState("");
  const [invoiceStudentId, setInvoiceStudentId] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("20500");
  const [invoiceDue, setInvoiceDue] = useState("2026-08-01");

  // Bulk Invoice Job Modal
  const [isBulkInvoiceOpen, setIsBulkInvoiceOpen] = useState(false);
  const [bulkClassId, setBulkClassId] = useState("");
  const [bulkAmount, setBulkAmount] = useState("20500");
  const [bulkDueDate, setBulkDueDate] = useState("2026-08-01");

  // Submit Payment Modal
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<FeeInvoiceDef | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("UPI");
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);

  // Invoice Receipt Preview Modal
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptInvoice, setReceiptInvoice] = useState<FeeInvoiceDef | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const sRes = await fetch(`${API_URL}/students`);
      const iRes = await fetch(`${API_URL}/fees`);
      const sesRes = await fetch(`${API_URL}/master-data/sessions`);
      const clRes = await fetch(`${API_URL}/master-data/classes`);
      const structRes = await fetch(`${API_URL}/fees/structures`);

      if (sRes.ok && iRes.ok && sesRes.ok && clRes.ok && structRes.ok) {
        setStudents(await sRes.json());
        setInvoices(await iRes.json());
        const sesData = await sesRes.json();
        setSessions(sesData);
        const clData = await clRes.json();
        setClasses(clData);
        const stData = await structRes.json();
        // Here we could map structures to classStructures state, but for this demo we'll keep the static one as fallback and just log real ones.
        console.log("Real structures:", stData);

        if (sesData.length > 0) {
          setInvoiceSessionId(sesData[0].id);
        }
      }
    } catch {
      toast("Sync Offline", { description: "NestJS APIs offline.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter classes based on selected session in Invoice Modal
  const modalFilteredClasses = classes.filter((c) => c.sessionId === invoiceSessionId);

  // Filter students based on selected class in Invoice Modal
  const modalFilteredStudents = students.filter((s) => s.classId === invoiceClassId);

  // Auto-fill cascades when selectors change
  useEffect(() => {
    if (modalFilteredClasses.length > 0) {
      setInvoiceClassId(modalFilteredClasses[0].id);
    } else {
      setInvoiceClassId("");
    }
  }, [invoiceSessionId, classes]);

  useEffect(() => {
    if (modalFilteredStudents.length > 0) {
      handleStudentChangeInInvoice(modalFilteredStudents[0].id);
    } else {
      setInvoiceStudentId("");
      setInvoiceAmount("0");
    }
  }, [invoiceClassId, students]);

  // Compute itemized Indian GST tax (Tuition is tax-exempted; Labs & Infrastructure have 9% CGST + 9% SGST)
  const getConcessionDetails = (student: any) => {
    const gradeName = student?.grade?.grade || "Grade 10";
    const components = classStructures[gradeName] || [
      { name: "Tuition Fee", amount: 15000 },
      { name: "Misc School Fee", amount: 3000 }
    ];

    let tuition = 0;
    let taxableMisc = 0;

    components.forEach((c) => {
      if (c.name.toLowerCase().includes("tuition")) {
        tuition += c.amount;
      } else {
        taxableMisc += c.amount;
      }
    });

    if (!student) {
      const cgst = taxableMisc * 0.09;
      const sgst = taxableMisc * 0.09;
      return { discountPercent: 0, reason: "None", netTotal: tuition + taxableMisc + cgst + sgst, tuition, netTuition: tuition, taxableMisc, cgst, sgst };
    }

    let discountPercent = 0;
    let reason = "None";

    const isStaffChild = student.details?.fatherProfession?.toLowerCase().includes("staff") ||
                          student.details?.fatherProfession?.toLowerCase().includes("teacher");

    if (isStaffChild) {
      discountPercent = 100;
      reason = "Staff Child Concession (100% Free)";
    } else {
      const siblingCount = student.details?.siblings?.length || 0;
      if (siblingCount >= 3) {
        discountPercent = 100;
        reason = "Sibling Concession (3+ children: 100% Free)";
      } else if (siblingCount === 2) {
        discountPercent = 20;
        reason = "Sibling Concession (2 children: 20% Discount)";
      }
    }

    const netTuition = tuition * (1 - discountPercent / 100);
    const cgst = taxableMisc * 0.09;
    const sgst = taxableMisc * 0.09;
    const netTotal = netTuition + taxableMisc + cgst + sgst;

    return { discountPercent, reason, netTotal, tuition, netTuition, taxableMisc, cgst, sgst };
  };

  const getClassBaseTotal = (gradeName: string) => {
    const list = classStructures[gradeName] || [];
    const baseTotal = list.reduce((sum, item) => sum + item.amount, 0);
    // Add GST
    let taxable = 0;
    list.forEach((c) => {
      if (!c.name.toLowerCase().includes("tuition")) taxable += c.amount;
    });
    return baseTotal + (taxable * 0.18);
  };

  const handleAddComponent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComponentName || !newComponentAmount) return;

    const amt = parseFloat(newComponentAmount);
    setClassStructures((prev) => {
      const current = prev[selectedStructureClass] || [];
      return {
        ...prev,
        [selectedStructureClass]: [...current, { name: newComponentName, amount: amt }],
      };
    });

    setNewComponentName("");
    toast("Component Added", { type: "success" });
  };

  const handleDeleteComponent = (index: number) => {
    setClassStructures((prev) => {
      const current = prev[selectedStructureClass] || [];
      return {
        ...prev,
        [selectedStructureClass]: current.filter((_, idx) => idx !== index),
      };
    });
    toast("Component Removed", { type: "warning" });
  };

  const handleStudentChangeInInvoice = (stuId: string) => {
    setInvoiceStudentId(stuId);
    const selected = students.find((s) => s.id === stuId);
    const details = getConcessionDetails(selected);
    setInvoiceAmount(details.netTotal.toString());
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceStudentId || !invoiceAmount || !invoiceDue) {
      toast("Validation Error", { description: "Please populate all fields.", type: "error" });
      return;
    }

    try {
      const res = await fetch(`${API_URL}/fees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: invoiceStudentId,
          amount: invoiceAmount,
          dueDate: invoiceDue,
          status: "Unpaid",
        }),
      });

      if (!res.ok) throw new Error();
      toast("Invoice Generated", { type: "success" });
      setIsInvoiceOpen(false);
      fetchData();
    } catch {
      toast("Action Failed", { type: "error" });
    }
  };

  const handleOpenPayment = (inv: FeeInvoiceDef) => {
    setSelectedInvoice(inv);
    const totalPaid = inv.payments.reduce((sum, p) => sum + parseFloat(p.amountPaid), 0);
    const balance = parseFloat(inv.amount) - totalPaid;
    setPaymentAmount(balance.toString());
    setPaymentRef("");
    setIsPaymentOpen(true);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || !paymentAmount) return;

    try {
      if (paymentMode === "Stripe" || paymentMode === "Razorpay") {
        const res = await fetch(`${API_URL}/fees/webhook/online-payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            invoiceId: selectedInvoice.id,
            amountPaid: paymentAmount,
            paymentMode,
            referenceNo: paymentRef || `GATEWAY-${Date.now()}`,
            gatewayResponse: { status: "succeeded", simulated: true }
          }),
        });
        if (!res.ok) throw new Error();
        toast("Online Payment Simulated & Processed via Webhook", { type: "success" });
      } else {
        const res = await fetch(`${API_URL}/fees/${selectedInvoice.id}/payments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amountPaid: paymentAmount,
            paymentMode,
            referenceNo: paymentRef,
            paymentDate,
          }),
        });
        if (!res.ok) throw new Error();
        toast("Receipt Issued", { type: "success" });
      }
      
      setIsPaymentOpen(false);
      fetchData();
    } catch {
      toast("Submit Failed", { type: "error" });
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    try {
      const res = await fetch(`${API_URL}/fees/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast("Invoice Archived", { type: "warning" });
      fetchData();
    } catch {
      toast("Action Failed", { type: "error" });
    }
  };

  const handleGenerateAllInvoices = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkClassId || !bulkAmount || !bulkDueDate) {
      toast("Validation Error", { description: "All fields are required.", type: "error" });
      return;
    }
    
    try {
      const campusId = localStorage.getItem("activeCampusId");
      if (!campusId) throw new Error("No campus selected");

      const res = await fetch(`${API_URL}/jobs/fee-generation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          classId: bulkClassId,
          amount: bulkAmount,
          dueDate: bulkDueDate,
          campusId 
        })
      });
      
      if (res.ok) {
        toast("Job Queued", { description: "Bulk invoice generation running in background.", type: "info" });
        setIsBulkInvoiceOpen(false);
      }
    } catch {
      toast("Failed", { description: "Failed to queue job.", type: "error" });
    }
  };

  const handleApplyLateFees = async () => {
    try {
      const res = await fetch(`${API_URL}/fees/apply-late-fees`, { method: "POST" });
      if (res.ok) {
        toast("Late Fees Applied", { type: "success" });
        fetchData();
      }
    } catch {
      toast("Failed to apply late fees", { type: "error" });
    }
  };

  const [financialReports, setFinancialReports] = useState<any>(null);
  useEffect(() => {
    if (activeTab === "reports" && invoiceSessionId) {
      fetch(`${API_URL}/fees/reports/financial?sessionId=${invoiceSessionId}`)
        .then(res => res.json())
        .then(data => setFinancialReports(data))
        .catch(console.error);
    }
  }, [activeTab, invoiceSessionId]);

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.student?.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.student?.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredInvoices.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedInvoices = filteredInvoices.slice(startIndex, startIndex + pageSize);

  return (
    <>
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            Fees &amp; Campus Accounts
          </h1>
          <p className="text-sm text-text-secondary">
            Process itemized billing, apply concession discounts, and print secure GST-registered invoice slips.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4.5 w-4.5" />}
          onClick={() => {
            setIsInvoiceOpen(true);
          }}
        >
          Generate Invoice
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        options={[
          { id: "ledger", label: "Student Accounts Ledger", icon: <Wallet className="h-4 w-4" /> },
          { id: "structures", label: "Class Fee Structures", icon: <Settings className="h-4 w-4" /> },
          { id: "calculator", label: "Concessions Calculator", icon: <Calculator className="h-4 w-4" /> },
          { id: "reports", label: "Financial Reports", icon: <FileText className="h-4 w-4" /> },
        ]}
      />

      {/* Class Fee Structures Tab */}
      {activeTab === "structures" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Structures Configurator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                label="Select Class Grade *"
                value={selectedStructureClass}
                onChange={(e) => setSelectedStructureClass(e.target.value)}
                options={["Grade 9", "Grade 10", "Grade 11", "Grade 12"].map((g) => ({ label: g, value: g }))}
              />

              <form onSubmit={handleAddComponent} className="space-y-3 pt-3 border-t">
                <Input
                  label="Fee Component Name *"
                  placeholder="e.g. Sports Infrastructure"
                  required
                  value={newComponentName}
                  onChange={(e) => setNewComponentName(e.target.value)}
                />
                <Input
                  label="Annual Charge Amount (INR) *"
                  type="number"
                  required
                  value={newComponentAmount}
                  onChange={(e) => setNewComponentAmount(e.target.value)}
                />
                <Button type="submit" variant="primary" className="w-full">
                  Add Component Item
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Itemized Annual Charges (Excl. GST): {selectedStructureClass}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component Name</TableHead>
                    <TableHead className="text-right">Annual Charge</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(classStructures[selectedStructureClass] || []).map((comp, cIdx) => (
                    <TableRow key={cIdx}>
                      <TableCell className="font-semibold text-text-primary">{comp.name}</TableCell>
                      <TableCell className="text-right font-bold text-text-primary">₹{comp.amount}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-danger"
                          onClick={() => handleDeleteComponent(cIdx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-slate-50 dark:bg-slate-800/40 font-bold border-t-2">
                    <TableCell className="text-text-primary">Total Annual Class Fee (Incl. 18% GST on Misc)</TableCell>
                    <TableCell className="text-right text-primary">₹{getClassBaseTotal(selectedStructureClass)}</TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Ledger Tab */}
      {activeTab === "ledger" && (
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
            <div>
              <CardTitle>Student Finance Ledger</CardTitle>
              <CardDescription>Roster of students, base annual calculations, and payments log.</CardDescription>
              <div className="flex gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={() => setIsBulkInvoiceOpen(true)}>Generate Bulk (Job)</Button>
                <Button variant="outline" size="sm" onClick={handleApplyLateFees}>Apply Late Fees</Button>
              </div>
            </div>
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-secondary" />
              <input
                type="text"
                placeholder="Search student ledger..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-card border border-border rounded-btn pl-9 pr-4 py-1.5 text-xs text-text-primary outline-none focus:border-primary transition-colors"
              />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="py-12 text-center text-xs text-text-secondary italic">
                Loading ledger entries from PostgreSQL...
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="py-12 text-center text-xs text-text-secondary italic">
                No invoices found in registry.
              </div>
            ) : (
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Admission Number</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Invoiced Amount (GST Incl)</TableHead>
                      <TableHead>Paid Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedInvoices.map((inv) => {
                      const totalPaid = inv.payments.reduce((sum, p) => sum + parseFloat(p.amountPaid), 0);
                      return (
                        <TableRow key={inv.id}>
                          <TableCell className="font-semibold text-primary">{inv.student.admissionNumber}</TableCell>
                          <TableCell className="font-medium text-text-primary">{inv.student.fullName}</TableCell>
                          <TableCell>{inv.student.grade?.grade || "N/A"}</TableCell>
                          <TableCell className="font-bold text-text-primary">₹{parseFloat(inv.amount).toFixed(2)}</TableCell>
                          <TableCell className="text-success font-semibold">₹{totalPaid}</TableCell>
                          <TableCell>
                            <Badge variant={inv.status === "Paid" ? "success" : inv.status === "Overdue" ? "danger" : "warning"}>
                              {inv.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs"
                              leftIcon={<FileText className="h-3.5 w-3.5" />}
                              onClick={() => {
                                setReceiptInvoice(inv);
                                setIsReceiptOpen(true);
                              }}
                            >
                              Invoice Slip
                            </Button>
                            {inv.status !== "Paid" && (
                              <Button
                                variant="primary"
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() => handleOpenPayment(inv)}
                              >
                                Pay Fee
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-danger"
                              onClick={() => handleDeleteInvoice(inv.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-xs text-text-secondary">
                    Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filteredInvoices.length)} of {filteredInvoices.length} entries
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages || totalPages === 0}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Concessions Calculator Tab */}
      {activeTab === "calculator" && (
        <Card>
          <CardHeader>
            <CardTitle>Concession Status Directory</CardTitle>
            <CardDescription>Directory of sibling discounts and staff child fee exemption structures.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Candidate</TableHead>
                  <TableHead>Placement Class</TableHead>
                  <TableHead>Sibling count</TableHead>
                  <TableHead>Exemption Rule Applied</TableHead>
                  <TableHead className="text-right">Net Yearly Fee (GST Incl)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((stu) => {
                  const conc = getConcessionDetails(stu);
                  return (
                    <TableRow key={stu.id}>
                      <TableCell className="font-semibold text-text-primary">{stu.fullName}</TableCell>
                      <TableCell>{stu.grade?.grade || "N/A"}</TableCell>
                      <TableCell>{stu.details?.siblings?.length || 0} Siblings</TableCell>
                      <TableCell>
                        <Badge variant={conc.discountPercent > 0 ? "success" : "neutral"}>
                          {conc.reason}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-text-primary">
                        ₹{conc.netTotal.toLocaleString("en-IN")}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Financial Reports Tab */}
      {activeTab === "reports" && (
        <Card>
          <CardHeader>
            <CardTitle>Financial Reports Dashboard</CardTitle>
            <CardDescription>View collections, outstanding balances, and defaulters.</CardDescription>
          </CardHeader>
          <CardContent>
            {financialReports ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 border rounded-btn bg-slate-50 dark:bg-slate-800 text-center">
                    <p className="text-sm text-text-secondary">Total Expected</p>
                    <p className="text-xl font-bold text-primary">₹{financialReports.totalExpected.toLocaleString()}</p>
                  </div>
                  <div className="p-4 border rounded-btn bg-slate-50 dark:bg-slate-800 text-center">
                    <p className="text-sm text-text-secondary">Total Collected</p>
                    <p className="text-xl font-bold text-success">₹{financialReports.totalCollected.toLocaleString()}</p>
                  </div>
                  <div className="p-4 border rounded-btn bg-slate-50 dark:bg-slate-800 text-center">
                    <p className="text-sm text-text-secondary">Total Outstanding</p>
                    <p className="text-xl font-bold text-danger">₹{financialReports.totalOutstanding.toLocaleString()}</p>
                  </div>
                  <div className="p-4 border rounded-btn bg-slate-50 dark:bg-slate-800 text-center">
                    <p className="text-sm text-text-secondary">Collection Rate</p>
                    <p className="text-xl font-bold text-primary">{financialReports.collectionRate}%</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-text-primary mb-2">Defaulters List (Overdue or Unpaid past Due Date)</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Amount Due</TableHead>
                        <TableHead>Due Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {financialReports.defaulters.map((d: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell className="font-semibold text-text-primary">{d.studentName}</TableCell>
                          <TableCell>{d.class}</TableCell>
                          <TableCell className="text-danger font-bold">₹{d.amountDue}</TableCell>
                          <TableCell>{d.dueDate}</TableCell>
                        </TableRow>
                      ))}
                      {financialReports.defaulters.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-text-secondary italic">No defaulters found.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <p className="text-center text-text-secondary">Loading reports...</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* GENERATE INVOICE MODAL (CASCADED SELECTOR) */}
      <Modal isOpen={isInvoiceOpen} onClose={() => setIsInvoiceOpen(false)} title="Generate Class Invoice" size="md">
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          <Select
            label="1. Academic Year Session *"
            value={invoiceSessionId}
            onChange={(e) => setInvoiceSessionId(e.target.value)}
            options={sessions.map((s) => ({ label: s.name, value: s.id }))}
          />

          <Select
            label="2. Class Grade *"
            value={invoiceClassId}
            onChange={(e) => setInvoiceClassId(e.target.value)}
            options={modalFilteredClasses.map((c) => ({ label: c.grade, value: c.id }))}
          />

          <Select
            label="3. Select Student *"
            value={invoiceStudentId}
            onChange={(e) => handleStudentChangeInInvoice(e.target.value)}
            options={modalFilteredStudents.map((s) => ({ label: `${s.fullName} (${s.admissionNumber})`, value: s.id }))}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Invoice Amount (INR, GST Incl) *"
              type="number"
              required
              value={invoiceAmount}
              onChange={(e) => setInvoiceAmount(e.target.value)}
            />
            <Input
              label="Invoice Due Date *"
              type="date"
              required
              value={invoiceDue}
              onChange={(e) => setInvoiceDue(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={() => setIsInvoiceOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={!invoiceStudentId}>Generate Invoice</Button>
          </div>
        </form>
      </Modal>

      {/* SUBMIT PAYMENT MODAL */}
      <Modal isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} title="Submit Fee Receipt">
        {selectedInvoice && (
          <form onSubmit={handleSubmitPayment} className="space-y-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-btn text-xs border space-y-1">
              <p><b>Student Name:</b> {selectedInvoice.student.fullName}</p>
              <p><b>Invoiced Amount:</b> ₹{parseFloat(selectedInvoice.amount).toFixed(2)}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Amount Paid (INR) *"
                type="number"
                required
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
              <Select
                label="Payment Mode *"
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                options={[
                  { label: "UPI (GPay / PhonePe)", value: "UPI" },
                  { label: "Cash payment", value: "Cash" },
                  { label: "Cheque Deposit", value: "Cheque" },
                  { label: "NetBanking / Bank Transfer", value: "NetBanking" },
                  { label: "Stripe Online Payment (Simulation)", value: "Stripe" },
                  { label: "Razorpay Online Payment (Simulation)", value: "Razorpay" }
                ]}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Reference Transaction ID"
                placeholder="e.g. TXN9384729"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
              />
              <Input
                label="Payment Date *"
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t mt-4">
              <Button type="button" variant="outline" onClick={() => setIsPaymentOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" leftIcon={<CheckCircle className="h-4 w-4" />}>
                Record Receipt
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* VIEW PROFESSIONAL INVOICE SLIP MODAL */}
      <Modal isOpen={isReceiptOpen} onClose={() => setIsReceiptOpen(false)} title="Itemized Invoice Slip Preview" size="lg">
        {receiptInvoice && (() => {
          const conc = getConcessionDetails(receiptInvoice.student);
          const components = classStructures[receiptInvoice.student.grade?.grade] || [
            { name: "Tuition Fee", amount: 15000 },
            { name: "Misc School Fee", amount: 3000 }
          ];
          const totalPaid = receiptInvoice.payments.reduce((sum, p) => sum + parseFloat(p.amountPaid), 0);
          const balance = parseFloat(receiptInvoice.amount) - totalPaid;

          return (
            <div className="space-y-6">
              {/* Printable Area Wrapper */}
              <div id="printable-invoice" className="p-6 bg-white dark:bg-slate-900 border rounded-card space-y-6 text-slate-800 dark:text-slate-100 print:border-none print:p-0">
                {/* Header block */}
                <div className="flex justify-between items-center border-b pb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 bg-primary rounded-btn flex items-center justify-center text-white font-bold text-xl">
                      A
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-text-primary">AETHERIA GLOBAL SCHOOL</h2>
                      <p className="text-[10px] text-text-secondary">Sec 14, Dwarka, New Delhi | Support: support@aetheria.edu</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h3 className="text-sm font-bold text-primary">GST FEE BILL INVOICE</h3>
                    <p className="text-[10px] text-text-secondary">Invoice ID: #{receiptInvoice.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-[10px] text-text-secondary">Due Date: {receiptInvoice.dueDate}</p>
                  </div>
                </div>

                {/* Billing Info */}
                <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-slate-800/40 p-4 rounded-btn border">
                  <div>
                    <h4 className="font-bold text-text-primary uppercase tracking-wider text-[10px] text-slate-500 mb-1">Student Details</h4>
                    <p className="font-semibold text-text-primary">{receiptInvoice.student.fullName}</p>
                    <p>Adm No: {receiptInvoice.student.admissionNumber}</p>
                    <p>Class Grade: {receiptInvoice.student.grade?.grade}</p>
                  </div>
                  <div className="text-right">
                    <h4 className="font-bold text-text-primary uppercase tracking-wider text-[10px] text-slate-500 mb-1">Concessions Data</h4>
                    <p className="text-success font-semibold">{conc.reason}</p>
                    <p>Sibling Count: {receiptInvoice.student.details?.siblings?.length || 0}</p>
                    <p>Staff Child: {receiptInvoice.student.details?.fatherProfession?.toLowerCase().includes("staff") ? "Yes" : "No"}</p>
                  </div>
                </div>

                {/* Itemized Table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider text-slate-500">Bill breakdown</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Component description</TableHead>
                        <TableHead className="text-right">Annual Charge</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Tuition Component (Exempted) */}
                      <TableRow>
                        <TableCell>Tuition Fee (Annual Base)</TableCell>
                        <TableCell className="text-right font-semibold">₹{conc.tuition}</TableCell>
                      </TableRow>
                      {conc.discountPercent > 0 && (
                        <TableRow className="text-success font-semibold text-[11px]">
                          <TableCell>Less: Sibling/Staff Discount (-{conc.discountPercent}% on Tuition)</TableCell>
                          <TableCell className="text-right">-₹{conc.tuition - conc.netTuition}</TableCell>
                        </TableRow>
                      )}
                      {/* Taxable Components */}
                      <TableRow>
                        <TableCell>Miscellaneous Components (Science Labs, Libraries, computer levies)</TableCell>
                        <TableCell className="text-right font-semibold">₹{conc.taxableMisc}</TableCell>
                      </TableRow>
                      {/* GST */}
                      <TableRow className="text-[11px] text-slate-500">
                        <TableCell>CGST (9.0% on Taxable Misc Fee)</TableCell>
                        <TableCell className="text-right">₹{conc.cgst.toFixed(2)}</TableCell>
                      </TableRow>
                      <TableRow className="text-[11px] text-slate-500">
                        <TableCell>SGST (9.0% on Taxable Misc Fee)</TableCell>
                        <TableCell className="text-right">₹{conc.sgst.toFixed(2)}</TableCell>
                      </TableRow>
                      <TableRow className="font-bold text-text-primary border-t bg-slate-50 dark:bg-slate-800/20">
                        <TableCell>Net Invoiced Total (GST Incl.)</TableCell>
                        <TableCell className="text-right text-primary">₹{parseFloat(receiptInvoice.amount).toFixed(2)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Payments & Receipts */}
                {receiptInvoice.payments.length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider text-slate-500">Receipt Transactions</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Payment Date</TableHead>
                          <TableHead>Mode</TableHead>
                          <TableHead>Reference No</TableHead>
                          <TableHead className="text-right">Amount Paid</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {receiptInvoice.payments.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell>{p.paymentDate}</TableCell>
                            <TableCell>{p.paymentMode}</TableCell>
                            <TableCell className="font-mono text-[10px]">{p.referenceNo || "N/A"}</TableCell>
                            <TableCell className="text-right text-success font-semibold">₹{p.amountPaid}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="font-bold text-text-primary border-t bg-slate-50 dark:bg-slate-800/10">
                          <TableCell colSpan={3}>Total Paid Balance</TableCell>
                          <TableCell className="text-right text-success">₹{totalPaid.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow className="font-bold text-text-primary bg-slate-50 dark:bg-slate-800/20">
                          <TableCell colSpan={3}>Remaining Balance Due</TableCell>
                          <TableCell className="text-right text-danger">₹{balance.toFixed(2)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              {/* Print action footer */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsReceiptOpen(false)}>Close</Button>
                <Button type="button" variant="primary" leftIcon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>
                  Print Invoice Slip
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>
      {/* Bulk Generate Modal */}
      <Modal isOpen={isBulkInvoiceOpen} onClose={() => setIsBulkInvoiceOpen(false)} title="Queue Bulk Fee Generation">
        <form onSubmit={handleGenerateAllInvoices} className="space-y-4 pt-4">
          <div className="space-y-4">
            <Select
              label="Select Class *"
              value={bulkClassId}
              onChange={(e) => setBulkClassId(e.target.value)}
              options={classes.map((c) => ({ label: c.grade, value: c.id }))}
            />
            <Input
              label="Base Invoice Amount (INR) *"
              type="number"
              required
              value={bulkAmount}
              onChange={(e) => setBulkAmount(e.target.value)}
            />
            <Input
              label="Payment Due Date *"
              type="date"
              required
              value={bulkDueDate}
              onChange={(e) => setBulkDueDate(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsBulkInvoiceOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Queue Background Job
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
