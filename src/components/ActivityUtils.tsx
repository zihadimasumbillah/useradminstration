'use client';

import React from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer} from 'recharts';

interface ActivityPattern {
  pattern: Record<string, { count: number; minutes: number }>;
  total: {
    minutes: number;
    hours: number;
    displayTime: string;
  };
}

interface UserWithActivity {
  last_activity_time?: string | null;
  last_login_time?: string | null;
  activity_pattern?: ActivityPattern;
}

export const formatDateString = (dateString?: string | null): string => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true 
  });
};

const getUserStatus = (time?: string | null): 'online' | 'away' | 'offline' => {
  if (!time) return 'offline';
  
  const now = new Date();
  const lastActive = new Date(time);
  const diffMinutes = (now.getTime() - lastActive.getTime()) / (1000 * 60);
  
  if (diffMinutes < 5) return 'online';
  if (diffMinutes < 30) return 'away';
  return 'offline';
};

export const formatRelativeTime = (timeString?: string | null): string => {
  if (!timeString) return 'Never';
  
  const date = new Date(timeString);
  const now = new Date();
  const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (secondsAgo < 60) return 'Just now';
  if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)} minutes ago`;
  if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)} hours ago`;
  if (secondsAgo < 604800) return `${Math.floor(secondsAgo / 86400)} days ago`;
  return formatDateString(timeString);
};

const formatActivityTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
};

export const TimeDisplay = ({ time, showStatus = true }: { time?: string | null, showStatus?: boolean }) => {
  const timeRef = React.useRef<HTMLSpanElement>(null);
  const [tooltipPosition, setTooltipPosition] = React.useState({ top: 0, left: 0 });
  const [showTooltip, setShowTooltip] = React.useState(false);
  
  if (!time) return <span className="text-gray-400">No activity</span>;
  const status = showStatus ? getUserStatus(time) : null;
  
  const handleMouseEnter = () => {
    if (timeRef.current) {
      const rect = timeRef.current.getBoundingClientRect();
      setTooltipPosition({
        top: rect.top - 10, 
        left: rect.left + (rect.width / 2)
      });
      setShowTooltip(true);
    }
  };
  
  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  return (
    <div className="relative inline-flex items-center"
         onMouseEnter={handleMouseEnter}
         onMouseLeave={handleMouseLeave}>
      {showStatus && (
        <span className={`h-2 w-2 rounded-full mr-2 transition-colors duration-300 ${
          status === 'online' ? 'bg-green-500 animate-pulse' : 
          status === 'away' ? 'bg-yellow-500' : 
          'bg-gray-400'
        }`} />
      )}
      
      <span 
        ref={timeRef}
        className="text-gray-700 dark:text-gray-300 cursor-help text-sm"
      >
        {formatRelativeTime(time)}
      </span>
      
      {showTooltip && (
        <div 
          style={{
            position: 'fixed',
            top: tooltipPosition.top - 40 + 'px', 
            left: tooltipPosition.left + 'px',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            pointerEvents: 'none',
            transition: 'opacity 150ms ease-in-out',
          }}
          className="bg-gray-800 text-white text-xs rounded shadow-lg py-2 px-3 whitespace-nowrap"
        >
          {new Date(time).toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
          })}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 
                       rotate-45 w-2 h-2 bg-gray-800"></div>
        </div>
      )}
    </div>
  );
};

export const UserActivityDisplay = ({ user }: { user: UserWithActivity }) => {
  return (
    <div className="flex items-center">
      <TimeDisplay 
        time={user.last_activity_time || user.last_login_time} 
        showStatus={true} 
      />
    </div>
  );
};

export const ActivityBarChart = ({ 
  pattern, 
  compact = false,
  className = '' 
}: { 
  pattern: ActivityPattern;
  compact?: boolean;
  className?: string;
}) => {
  if (!pattern || !pattern.pattern) return <div className="text-xs text-gray-400">No activity data</div>;

  const patternData = typeof pattern.pattern === 'object' && !Array.isArray(pattern.pattern) 
    ? Object.keys(pattern.pattern).map(key => pattern.pattern[key])
    : pattern.pattern;

  const days = compact ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const data = days.map((day, index) => {
    const dayData = Array.isArray(patternData) 
      ? patternData[index] || { count: 0, minutes: 0 }
      : pattern.pattern[index] || { count: 0, minutes: 0 };
    
    const minutes = dayData.minutes || 0;
    return {
      name: day,
      minutes,
      displayTime: formatActivityTime(minutes)
    };
  });

  return (
    <div 
      className={`w-full ${className}`} 
      style={{ 
        height: compact ? '70px' : '120px',
        minHeight: compact ? '70px' : '120px',
        width: '100%'
      }}
    >
 
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={data} 
          margin={{ 
            top: 5, 
            right: 5, 
            left: 0, 
            bottom: 0 
          }}
        >
          <defs>
            <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.8}/>
              <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.5}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="name" 
            tick={{ 
              fontSize: compact ? 9 : 10, 
              fill: '#6B7280' 
            }}
            interval={0}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
            contentStyle={{ 
              backgroundColor: '#1F2937', 
              border: 'none', 
              borderRadius: '4px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
            }}
            labelStyle={{ color: '#F3F4F6' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="bg-gray-800 text-white px-2 py-1 rounded text-xs">
                  <p>{`${payload[0].payload.name}: ${payload[0].payload.displayTime}`}</p>
                </div>
              );
            }}
          />
          <Bar 
            dataKey="minutes" 
            radius={[3, 3, 0, 0]}
            maxBarSize={compact ? 12 : 30}
            background={{ fill: 'rgba(229, 231, 235, 0.2)' }}
            fill="url(#activityGradient)"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const TotalActivityTime = ({ pattern }: { pattern: ActivityPattern }) => {
  if (!pattern?.total) return null;
  
  return (
    <div className="text-xs text-gray-500 flex items-center gap-1">
      <span className="font-medium">Total time:</span>
      <span>{pattern.total.displayTime}</span>
    </div>
  );
};