import { Wrench } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-[#3d9166] to-[#1a5c3a] rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse shadow-lg">
          <Wrench size={28} className="text-white" />
        </div>
        <p className="text-gray-400 text-sm font-medium">Loading ToolShare Africa...</p>
      </div>
    </div>
  );
}
