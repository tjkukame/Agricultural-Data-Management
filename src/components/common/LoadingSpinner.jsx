export default function LoadingSpinner({ size = 'md', color = 'green', fullScreen = false }) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
  };
  
  const colorClasses = {
    green: 'border-green-600',
    blue: 'border-blue-600',
    gray: 'border-gray-600',
    white: 'border-white',
  };

  const spinner = (
    <div className="flex justify-center items-center">
      <div
        className={`animate-spin rounded-full border-4 border-t-transparent ${colorClasses[color]} ${sizeClasses[size]}`}
      />
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}

export const LoadingOverlay = ({ children, loading }) => {
  if (!loading) return children;
  
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded">
        <LoadingSpinner />
      </div>
      <div className="opacity-50 pointer-events-none">{children}</div>
    </div>
  );
};