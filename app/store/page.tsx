export default function Store() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Store Dashboard</h1>
      <div className="card bg-yellow-100">
        <h2 className="font-semibold mb-2">Order #123</h2>
        <p className="text-sm mb-4">Prep time: 1h 45m left</p>
        <button className="btn-primary">Mark Ready</button>
      </div>
    </div>
  );
}
