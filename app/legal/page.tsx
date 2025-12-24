"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react"; // You need to install this: npm install qrcode.react
import {
  FileText,
  Share2,
  PenTool,
  CheckCircle,
  Download,
  Smartphone,
  ChevronLeft,
  X,
} from "lucide-react";

// --- MOCK DOCUMENT CONTENT (Paste full text from previous steps here) ---
const LEGAL_DOCS = {
  nda: {
    id: "nda",
    title: "Non-Disclosure Agreement",
    version: "1.0",
    content: `
# CONFIDENTIALITY AND NON-DISCLOSURE AGREEMENT

**BETWEEN:** GoJack Pty Ltd (The "Discloser") AND The Undersigned (The "Recipient").

## 1. DEFINITIONS
"Confidential Information" means all information disclosed by GoJack to the Recipient, including but not limited to batching algorithms, customer data, and financial models.

## 2. OBLIGATIONS
The Recipient shall treat all Confidential Information with the same degree of care it affords its own confidential information. The Recipient shall NOT disclose customer data to any third party.

## 3. DURATION
This agreement is effective for 5 years from the date of signing.

(Scroll to read full terms...)
    `,
  },
  store_agreement: {
    id: "store_agreement",
    title: "Store Partner Agreement",
    version: "2.1",
    content: `
# STORE PARTNER AGREEMENT

**BETWEEN:** GoJack Pty Ltd AND The Undersigned Store Partner.

## 1. ENGAGEMENT
GoJack engages the Store as a non-exclusive supplier of grocery products.

## 2. PRICING CONTROL
The Store sets the Supply Price. GoJack unilaterally sets the Retail Price. The Store has no visibility into the Retail Price.

## 3. PAYMENT
Payments are settled weekly on Tuesdays. A 2% holdback applies for 30 days.

(Scroll to read full terms...)
    `,
  },
  driver_agreement: {
    id: "driver_agreement",
    title: "Driver Contractor Agreement",
    version: "1.4",
    content: `
# INDEPENDENT CONTRACTOR AGREEMENT (DRIVER)

**BETWEEN:** GoJack Pty Ltd AND The Undersigned Driver.

## 1. INDEPENDENT STATUS
The Driver is an independent contractor, NOT an employee. No superannuation or leave entitlements apply.

## 2. FEES
Fees are paid per delivery based on distance. GoJack deducts a 2% processing fee.

## 3. QR CODE PROTOCOL
Driver MUST scan Pickup QR and Delivery QR. Failure to scan may result in non-payment.

(Scroll to read full terms...)
    `,
  },
};

// --- SIGNATURE PAD COMPONENT ---
function SignaturePad({
  onSave,
  onClear,
}: {
  onSave: (data: string) => void;
  onClear: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Initialize canvas context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Handle high DPI screens
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(ratio, ratio);
  }, []);

  const getPos = (e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX =
      "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY =
      "touches" in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: any) => {
    e.preventDefault(); // Prevent scrolling on mobile
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e.nativeEvent);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0f172a"; // Slate-900
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e.nativeEvent);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleSave = () => {
    if (canvasRef.current) {
      onSave(canvasRef.current.toDataURL());
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    onClear();
  };

  return (
    <div className="space-y-3">
      <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 touch-none relative overflow-hidden h-48 w-full">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair block"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        <div className="absolute bottom-2 left-2 text-[10px] text-slate-400 pointer-events-none select-none">
          Sign explicitly within the box
        </div>
      </div>
      <div className="flex gap-3">
        <button
          onClick={handleClear}
          className="flex-1 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
        >
          Clear
        </button>
        <button
          onClick={handleSave}
          className="flex-1 py-2 text-sm font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
        >
          Accept & Sign
        </button>
      </div>
    </div>
  );
}

// --- MAIN PAGE COMPONENT ---
export default function LegalPortal() {
  // State: 'admin' (QR generator) or 'signer' (Reading/Signing doc)
  // In production, 'signer' mode would be triggered by checking URL params (e.g. ?doc=nda)
  const [mode, setMode] = useState<"admin" | "signer">("admin");
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [signerInfo, setSignerInfo] = useState({ name: "", email: "" });
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [step, setStep] = useState<"read" | "sign" | "complete">("read");

  // Derived state
  const activeDoc = selectedDocId ? (LEGAL_DOCS as any)[selectedDocId] : null;

  // -- Mock URL generator for the QR code --
  const getSigningUrl = (docId: string) => {
    // In real app: https://gojack.com/sign/${docId}
    return `https://gojack.com/legal/sign?doc=${docId}`;
  };

  const handleSignComplete = () => {
    // In real app: Upload 'signatureData' + 'signerInfo' to Supabase
    // Then generate PDF on backend
    setTimeout(() => {
      setStep("complete");
    }, 1000);
  };

  // --- ADMIN VIEW: QR GENERATOR ---
  if (mode === "admin") {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center">
        <div className="max-w-4xl w-full space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              GoJack Legal Hub
            </h1>
            <p className="text-slate-500">
              Generate signing links for partners on the spot.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Document Selector */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
              <h2 className="font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-teal-600" /> Select Document
              </h2>
              <div className="space-y-2">
                {Object.values(LEGAL_DOCS).map((doc: any) => (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedDocId === doc.id
                        ? "border-slate-900 bg-slate-900 text-white shadow-md"
                        : "border-slate-200 hover:border-teal-500 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="font-bold">{doc.title}</div>
                    <div
                      className={`text-xs ${
                        selectedDocId === doc.id
                          ? "text-slate-400"
                          : "text-slate-500"
                      }`}
                    >
                      Version {doc.version}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* QR Display */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center text-center space-y-6 min-h-[300px]">
              {selectedDocId ? (
                <>
                  <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-100">
                    <QRCodeSVG
                      value={getSigningUrl(selectedDocId)}
                      size={200}
                      level="H"
                      includeMargin
                    />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-slate-900 text-lg">
                      Scan to Sign
                    </h3>
                    <p className="text-sm text-slate-500 max-w-xs mx-auto">
                      Ask the partner to scan this code with their phone camera
                      to open the
                      <strong> {activeDoc.title}</strong>.
                    </p>
                    {/* Simulation Button */}
                    <button
                      onClick={() => setMode("signer")}
                      className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-teal-600 hover:underline"
                    >
                      <Smartphone className="h-4 w-4" /> Simulate Mobile View
                      (Demo)
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-slate-400 flex flex-col items-center">
                  <Share2 className="h-12 w-12 mb-3 opacity-20" />
                  <p>Select a document to generate QR code</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- SIGNER VIEW: MOBILE FRIENDLY ---
  // This is what the user sees on their phone after scanning
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Top Navigation */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-100 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => {
            if (step === "complete") setMode("admin");
            else setStep(step === "sign" ? "read" : "read");
          }}
          className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full"
        >
          {step === "complete" ? (
            <X className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
        <span className="font-semibold text-sm truncate max-w-[200px]">
          {activeDoc?.title}
        </span>
        <div className="w-8" /> {/* Spacer */}
      </div>

      {step === "complete" ? (
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-8 text-center space-y-6 animate-in zoom-in-95 duration-300">
          <div className="h-24 w-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
            <CheckCircle className="h-12 w-12" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">
              Agreement Signed!
            </h2>
            <p className="text-slate-500">
              A copy of the signed <strong>{activeDoc?.title}</strong> has been
              sent to
              <span className="text-slate-900 font-medium">
                {" "}
                {signerInfo.email}
              </span>
              .
            </p>
          </div>
          <button className="w-full max-w-sm flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-200 font-semibold hover:bg-slate-50">
            <Download className="h-4 w-4" /> Download PDF
          </button>
          <button
            onClick={() => {
              setMode("admin");
              setStep("read");
              setSignerInfo({ name: "", email: "" });
              setSignatureData(null);
            }}
            className="text-sm text-slate-400 hover:text-slate-600"
          >
            Return to GoJack Hub
          </button>
        </div>
      ) : (
        <div className="max-w-md mx-auto p-4 pb-24 space-y-6">
          {step === "read" && (
            <>
              {/* Document Reader */}
              <div className="prose prose-sm prose-slate bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-inner max-h-[60vh] overflow-y-auto">
                <pre className="whitespace-pre-wrap font-sans text-sm text-slate-600">
                  {activeDoc?.content}
                </pre>
              </div>

              {/* Signer Info Form */}
              <div className="space-y-4 pt-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                  Your Details
                </h3>
                <input
                  type="text"
                  placeholder="Full Legal Name"
                  value={signerInfo.name}
                  onChange={(e) =>
                    setSignerInfo({ ...signerInfo, name: e.target.value })
                  }
                  className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-slate-900 outline-none"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={signerInfo.email}
                  onChange={(e) =>
                    setSignerInfo({ ...signerInfo, email: e.target.value })
                  }
                  className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-slate-900 outline-none"
                />
              </div>

              {/* Action Bar */}
              <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200">
                <button
                  disabled={!signerInfo.name || !signerInfo.email}
                  onClick={() => setStep("sign")}
                  className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Next: Sign Document <PenTool className="h-4 w-4" />
                </button>
              </div>
            </>
          )}

          {step === "sign" && (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
              <div className="bg-amber-50 text-amber-800 p-4 rounded-xl text-sm border border-amber-100">
                By signing below, you agree to the terms set forth in the{" "}
                <strong>{activeDoc?.title}</strong> version {activeDoc?.version}
                .
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Draw your signature
                </label>
                <SignaturePad
                  onSave={(data) => {
                    setSignatureData(data);
                    handleSignComplete();
                  }}
                  onClear={() => setSignatureData(null)}
                />
              </div>

              <p className="text-xs text-slate-400 text-center">
                Digitally signed by {signerInfo.name} on{" "}
                {new Date().toLocaleDateString()}.
                <br />
                IP Address recorded for security.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
