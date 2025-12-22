export default function Driver() {
  return (
    <div className="p-4 space-y-4 min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Driver Jobs</h1>
        <div className="text-2xl font-bold text-emerald-600">$10/job</div>
      </div>
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <span className="flex items-center space-x-2 font-semibold">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            Ready
          </span>
          <div className="text-emerald-600 font-bold">2.3km</div>
        </div>
        <h3 className="font-semibold text-lg mb-4">Store → Customer</h3>
        <div className="flex space-x-2">
          <button className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-xl font-semibold">
            Accept
          </button>
          <button className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-xl font-semibold">
            Navigate
          </button>
        </div>
      </div>
      <div className="bottom-nav flex space-x-12 justify-center pt-4">
        <div className="flex flex-col items-center text-emerald-600">
          <span className="text-2xl">📱</span>
          <span className="text-xs">Jobs</span>
        </div>
        <div className="flex flex-col items-center text-gray-500">
          <span className="text-2xl">💰</span>
          <span className="text-xs">Earnings</span>
        </div>
        <div className="flex flex-col items-center text-gray-500">
          <span className="text-2xl">👤</span>
          <span className="text-xs">Profile</span>
        </div>
      </div>
    </div>
  );
}
