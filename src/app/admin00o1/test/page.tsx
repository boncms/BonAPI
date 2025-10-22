export default function AdminTestPage() {
  return (
    <div className="min-h-screen bg-dark-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-4">Admin Test Page</h1>
        <p className="text-dark-300 mb-6">This is a test page to verify admin routing works correctly.</p>
        
        <div className="bg-dark-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Available Admin Routes:</h2>
          <ul className="space-y-2 text-dark-300">
            <li>• <a href="/admin00o1" className="text-primary-400 hover:text-primary-300">/admin00o1</a> - Dashboard</li>
            <li>• <a href="/admin00o1/videos" className="text-primary-400 hover:text-primary-300">/admin00o1/videos</a> - Videos Management</li>
            <li>• <a href="/admin00o1/models" className="text-primary-400 hover:text-primary-300">/admin00o1/models</a> - Models Management</li>
            <li>• <a href="/admin00o1/categories" className="text-primary-400 hover:text-primary-300">/admin00o1/categories</a> - Categories Management</li>
            <li>• <a href="/admin00o1/ads" className="text-primary-400 hover:text-primary-300">/admin00o1/ads</a> - Ads Management</li>
            <li>• <a href="/admin00o1/test" className="text-primary-400 hover:text-primary-300">/admin00o1/test</a> - This test page</li>
          </ul>
        </div>
        
        <div className="bg-green-800 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold text-white mb-2">✅ Admin Panel Status</h2>
          <p className="text-green-200">Admin panel is working correctly!</p>
        </div>
      </div>
    </div>
  )
}
