export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Hockey Directory</h3>
            <p className="text-gray-600 text-sm">
              Your comprehensive source for hockey players, teams, and league information.
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Browse</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#" className="hover:text-ice-600">Players</a></li>
              <li><a href="#" className="hover:text-ice-600">Teams</a></li>
              <li><a href="#" className="hover:text-ice-600">Leagues</a></li>
              <li><a href="#" className="hover:text-ice-600">Statistics</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Resources</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#" className="hover:text-ice-600">About</a></li>
              <li><a href="#" className="hover:text-ice-600">Contact</a></li>
              <li><a href="#" className="hover:text-ice-600">API</a></li>
              <li><a href="#" className="hover:text-ice-600">Help</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Connect</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#" className="hover:text-ice-600">Twitter</a></li>
              <li><a href="#" className="hover:text-ice-600">Instagram</a></li>
              <li><a href="#" className="hover:text-ice-600">Facebook</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-center text-sm text-gray-500">
            © 2025 Hockey Directory. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}