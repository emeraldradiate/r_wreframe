const MapVisual = ({ label = 'Map' }: { label?: string }) => (
  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-50">
    <span className="text-lg font-semibold text-blue-600 font-header">🗺️ {label}</span>
  </div>
);

export default MapVisual;
