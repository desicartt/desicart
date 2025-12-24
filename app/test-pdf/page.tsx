"use client";

import { useState } from "react";

export default function TestPdfPage() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const body = {
      docId: formData.get("docId") as string,
      signerName: formData.get("signerName") as string,
      signerEmail: formData.get("signerEmail") as string,
      signerPhone: formData.get("signerPhone") as string,
    };

    const res = await fetch("/api/generate-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `GoJack-${body.docId}.pdf`;
      a.click();
    } else {
      alert("Failed: " + (await res.text()));
    }

    setLoading(false);
  }

  return (
    <div
      style={{ maxWidth: 600, margin: "50px auto", fontFamily: "sans-serif" }}
    >
      <h1>Test PDF Generator</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Document Type:
          <select name="docId" required style={{ marginLeft: 10 }}>
            <option value="nda">NDA</option>
            <option value="store_agreement">Store Agreement</option>
            <option value="driver_agreement">Driver Agreement</option>
            <option value="partnership_agreement">Partnership Agreement</option>
          </select>
        </label>
        <br />
        <br />
        <label>
          Name:
          <input
            name="signerName"
            required
            defaultValue="Test User"
            style={{ marginLeft: 10 }}
          />
        </label>
        <br />
        <br />
        <label>
          Email:
          <input
            name="signerEmail"
            type="email"
            required
            defaultValue="test@example.com"
            style={{ marginLeft: 10 }}
          />
        </label>
        <br />
        <br />
        <label>
          Phone:
          <input
            name="signerPhone"
            defaultValue="+61 400 000 000"
            style={{ marginLeft: 10 }}
          />
        </label>
        <br />
        <br />
        <button type="submit" disabled={loading}>
          {loading ? "Generating..." : "Download PDF"}
        </button>
      </form>
    </div>
  );
}
