const resolvePublicAssetSrc = (src?: string) => {
  if (!src) {
    return undefined;
  }

  if (/^https?:\/\//i.test(src) || src.startsWith('data:')) {
    return src;
  }

  const normalized = src.replace(/^\//, '');
  return `${import.meta.env.BASE_URL}${normalized}`;
};

const MapVisual = ({
  label = 'Map',
  imageSrc,
}: {
  label?: string;
  imageSrc?: string;
}) => {
  const resolvedSrc = resolvePublicAssetSrc(imageSrc);

  if (resolvedSrc) {
    return (
      <div className="w-full h-full min-h-0 flex items-center justify-center bg-white p-2">
        <img
          src={resolvedSrc}
          alt={label}
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-50">
      <span className="text-lg font-semibold text-blue-600 font-header">🗺️ {label}</span>
    </div>
  );
};

export default MapVisual;
