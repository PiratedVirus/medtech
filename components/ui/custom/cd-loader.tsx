interface LoaderProps {
  height?: string;
}

export default function CdLoader({ height = "90vh" }: LoaderProps) {
  return (
    <div className="flex items-center justify-center py-10" style={{ height }}>
      <div className="w-10 h-10 border-4 border-gray-300 border-t-green-700 rounded-full animate-spin"></div>
    </div>
  );
}