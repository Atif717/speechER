import { useState, useEffect } from 'react';
import { Phone, Mic, MicOff, MoreVertical, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

type Emotion = 'happy' | 'neutral' | 'sad' | 'angry' | 'surprised' | 'fearful';

interface Call {
  id: string;
  customerName: string;
  timestamp: string; // ISO string from backend
  duration: number; // in seconds
  emotion: Emotion;
  audioUrl?: string;
  transcript?: string;
  status: 'active' | 'completed' | 'missed';
}

const EMOTIONS: Record<Emotion, { emoji: string, color: string }> = {
  happy: { emoji: '😊', color: 'text-green-400' },
  neutral: { emoji: '😐', color: 'text-gray-400' },
  sad: { emoji: '😔', color: 'text-blue-400' },
  angry: { emoji: '😡', color: 'text-red-400' },
  surprised: { emoji: '😲', color: 'text-yellow-400' },
  fearful: { emoji: '😨', color: 'text-purple-400' },
};

interface CallListProps {
  agentId?: string;
}

export default function CallList({ agentId }: CallListProps) {
  const [calls, setCalls] = useState<Call[]>([]);
  const [expandedCall, setExpandedCall] = useState<string | null>(null);

  useEffect(() => {
    let url = 'http://localhost:5000/api/calls';
    if (agentId) url += `?agentId=${agentId}`;
    fetch(url)
      .then(res => res.json())
      .then(setCalls);
  }, [agentId]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    if (date.toDateString() === now.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 overflow-hidden">
      <div className="p-4 border-b border-white/10 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Call Activity</h2>
      </div>
      
      <div className="divide-y divide-white/10 max-h-[650px] overflow-y-auto">
        {calls.length === 0 ? (
          <div className="p-8 text-center text-white/60">
            <Phone className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>No calls found</p>
          </div>
        ) : (
          <>
            {calls.map(call => (
              <div 
                key={call.id} 
                className={cn(
                  "transition-colors",
                  call.status === 'active' && "bg-green-900/10",
                  call.status === 'missed' && "bg-red-900/10"
                )}
              >
                <div 
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedCall(expandedCall === call.id ? null : call.id)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center mr-3",
                        call.status === 'active' 
                          ? "bg-green-500/20 text-green-500" 
                          : call.status === 'missed'
                            ? "bg-red-500/20 text-red-500"
                            : "bg-white/10 text-white/80"
                      )}>
                        <Phone className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center">
                          <span className="text-white font-medium">{call.customerName}</span>
                          {call.status === 'active' && (
                            <span className="ml-2 bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full animate-pulse flex items-center">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
                              Live
                            </span>
                          )}
                        </div>
                        <div className="flex text-sm text-white/60">
                          <span className="flex items-center">
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            {formatTime(call.timestamp)}
                          </span>
                          <span className="mx-1.5">•</span>
                          <span>{formatDate(call.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className={cn(
                        "text-2xl mr-4",
                        EMOTIONS[call.emotion].color
                      )}>
                        {EMOTIONS[call.emotion].emoji}
                      </div>
                      {call.status !== 'missed' && (
                        <div className="text-white/80 mr-4">
                          {formatDuration(call.duration)}
                        </div>
                      )}
                      <button className="text-white/60 hover:text-white/80 transition-colors">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
                
                {expandedCall === call.id && (
                  <div className="px-4 pb-4 pt-2 bg-white/5">
                    <div className="p-4 bg-white/5 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-white font-medium">Call Transcript</h4>
                        <div className="flex">
                          {call.status === 'active' ? (
                            <div className="flex items-center text-white/80 text-sm">
                              <Mic className="w-4 h-4 mr-1 text-green-400 animate-pulse" />
                              Recording...
                            </div>
                          ) : call.status === 'completed' ? (
                            <div className="flex items-center text-white/80 text-sm">
                              <MicOff className="w-4 h-4 mr-1" />
                              Completed
                            </div>
                          ) : (
                            <div className="flex items-center text-red-400 text-sm">
                              <MicOff className="w-4 h-4 mr-1" />
                              Missed Call
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {call.status === 'missed' ? (
                        <div className="text-white/60 text-sm italic">
                          No transcript available for missed calls
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 mr-2 flex-shrink-0">
                              A
                            </div>
                            <div className="bg-white/10 rounded-lg p-2 text-white/90 text-sm max-w-[80%]">
                              Hello, thank you for calling CallSense. How may I assist you today?
                            </div>
                          </div>
                          
                          <div className="flex justify-end">
                            <div className="bg-blue-500/20 rounded-lg p-2 text-white/90 text-sm max-w-[80%]">
                              Hi, I'm calling about my recent order. It seems like there's been a delay in shipping.
                            </div>
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 ml-2 flex-shrink-0">
                              C
                            </div>
                          </div>
                          
                          <div className="flex">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 mr-2 flex-shrink-0">
                              A
                            </div>
                            <div className="bg-white/10 rounded-lg p-2 text-white/90 text-sm max-w-[80%]">
                              I'm sorry to hear about the delay. Let me check the status of your order right away. Could you please provide your order number?
                            </div>
                          </div>
                          
                          {call.status === 'active' && (
                            <div className="text-center text-white/50 text-sm py-2">
                              Transcribing in real-time...
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <div className="bg-white/5 p-3 rounded-lg">
                        <div className="text-white/60 text-sm mb-1">Sentiment</div>
                        <div className="flex items-center">
                          <span className={cn("text-xl mr-2", EMOTIONS[call.emotion].color)}>
                            {EMOTIONS[call.emotion].emoji}
                          </span>
                          <span className="text-white capitalize">{call.emotion}</span>
                        </div>
                      </div>
                      
                      <div className="bg-white/5 p-3 rounded-lg">
                        <div className="text-white/60 text-sm mb-1">Duration</div>
                        <div className="text-white">
                          {call.status === 'missed' ? 'N/A' : formatDuration(call.duration)}
                        </div>
                      </div>
                      
                      <div className="bg-white/5 p-3 rounded-lg">
                        <div className="text-white/60 text-sm mb-1">Call ID</div>
                        <div className="text-white">{call.id}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}