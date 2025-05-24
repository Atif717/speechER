import { useEffect, useState, useRef } from 'react';
import { PhoneCall, PhoneOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Call {
  id: string;
  agent: string;
  customer: string;
  duration: number;
  startTime: string; // ISO string from backend
}

interface CallActivityCardProps {
  className?: string;
}

export default function CallActivityCard({ className }: CallActivityCardProps) {
  const [calls, setCalls] = useState<Call[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch calls from backend
  useEffect(() => {
    fetch('http://localhost:5000/api/calls/active')
      .then(res => res.json())
      .then(data => setCalls(data));
  }, []);

  // Update durations every second for calls
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCalls(prev =>
        prev.map(call => ({
          ...call,
          duration: Math.floor(
            (Date.now() - new Date(call.startTime).getTime()) / 1000
          ),
        }))
      );
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn(
      "bg-white/10 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 overflow-hidden",
      className
    )}>
      <div className="p-4 border-b border-white/10 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-white">Call Activity</h2>
          <p className="text-white/70 text-sm">Real-time monitoring</p>
        </div>
      </div>
      
      <div className="max-h-[400px] overflow-y-auto">
        <div className="divide-y divide-white/10">
          {calls.length === 0 ? (
            <div className="p-6 text-center text-white/60">
              <PhoneOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No calls at the moment</p>
            </div>
          ) : (
            calls.map((call) => (
              <div 
                key={call.id} 
                className="p-4 flex items-center transition-colors"
              >
                <div className="mr-3">
                  <PhoneCall className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="font-medium text-white">{call.customer}</span>
                    <span className="text-white/70 text-sm">{formatDuration(call.duration)}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-sm text-white/70">Agent: {call.agent}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}