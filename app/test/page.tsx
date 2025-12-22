export default function TestPage() {
  return (
    <div style={{ background: "red", padding: "50px", color: "white" }}>
      <h1 style={{ fontSize: "48px", fontWeight: "bold" }}>
        Test Page - Inline Styles
      </h1>
      <div className="bg-blue-500 text-white p-8 rounded-lg mt-4">
        This should have blue background if Tailwind works
      </div>
    </div>
  );
}
