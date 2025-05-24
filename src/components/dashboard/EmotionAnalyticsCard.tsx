import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { cn } from '@/lib/utils';

type Emotion = 'happy' | 'neutral' | 'sad' | 'angry' | 'surprised' | 'fearful';

interface EmotionData {
  name: Emotion;
  value: number;
  color: string;
}

interface EmotionTrend {
  time: string;
  happy: number;
  neutral: number;
  sad: number;
  angry: number;
}

const COLORS = {
  happy: '#22c55e',    // green-500
  neutral: '#64748b',  // slate-500
  sad: '#3b82f6',      // blue-500
  angry: '#ef4444',    // red-500
  surprised: '#eab308', // yellow-500
  fearful: '#8b5cf6',   // violet-500
};

export default function EmotionAnalyticsCard() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [emotionData, setEmotionData] = useState<EmotionData[]>([]);
  const [trendData, setTrendData] = useState<EmotionTrend[]>([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/analytics/emotions')
      .then(res => res.json())
      .then(data => {
        setEmotionData(data.emotionData);
        setTrendData(data.trendData);
      });
  }, []);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;
    return (
      <g>
        <text x={cx} y={cy - 5} textAnchor="middle" fill="#ffffff" fontSize={16} fontWeight="medium">
          {payload.name}
        </text>
        <text x={cx} y={cy + 20} textAnchor="middle" fill="#ffffff" fontSize={24} fontWeight="bold">
          {value}%
        </text>
        <Pie
          activeIndex={activeIndex}
          activeShape={renderActiveShape}
          data={emotionData}
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          fill={fill}
          dataKey="value"
          startAngle={startAngle}
          endAngle={endAngle}
        />
      </g>
    );
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 overflow-hidden h-full">
      <div className="p-4 border-b border-white/10">
        <h2 className="text-xl font-semibold text-white">Emotion Analytics</h2>
        <p className="text-white/70 text-sm">Call sentiment monitoring</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        <div className="bg-white/5 rounded-xl p-4 shadow-inner">
          <h3 className="text-white text-center mb-4 font-medium">Emotion Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  data={emotionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  onMouseEnter={onPieEnter}
                  onMouseLeave={onPieLeave}
                >
                  {emotionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Percentage']}
                  contentStyle={{ backgroundColor: 'rgba(23, 23, 23, 0.9)', borderColor: 'rgba(255, 255, 255, 0.2)' }}
                  itemStyle={{ color: '#ffffff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {emotionData.map((emotion) => (
              <div key={emotion.name} className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-1" 
                  style={{ backgroundColor: emotion.color }}
                ></div>
                <span className="text-white/80 text-xs capitalize">{emotion.name}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white/5 rounded-xl p-4 shadow-inner">
          <h3 className="text-white text-center mb-4 font-medium">Emotion Trends (Last 8 hours)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(23, 23, 23, 0.9)', borderColor: 'rgba(255, 255, 255, 0.2)' }}
                  itemStyle={{ color: '#ffffff' }}
                />
                <Legend 
                  formatter={(value) => <span className="text-white/80 capitalize">{value}</span>}
                />
                <Line 
                  type="monotone" 
                  dataKey="happy" 
                  stroke={COLORS.happy} 
                  activeDot={{ r: 8 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="neutral" 
                  stroke={COLORS.neutral} 
                />
                <Line 
                  type="monotone" 
                  dataKey="sad" 
                  stroke={COLORS.sad} 
                />
                <Line 
                  type="monotone" 
                  dataKey="angry" 
                  stroke={COLORS.angry} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}