'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes } from 'react-icons/fa';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationProps {
  type: NotificationType;
  message: string;
  duration?: number;
  onClose?: () => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  showProgress?: boolean;
}

export const Notification: React.FC<NotificationProps> = ({
  type,
  message,
  duration = 5000,
  onClose,
  position = 'top-right',
  showProgress = true,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);
  
  useEffect(() => {
    if (duration <= 0) return;
    
    const timeout = setTimeout(() => {
      handleClose();
    }, duration);
    
    if (showProgress) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - (100 / (duration / 100));
          return newProgress < 0 ? 0 : newProgress;
        });
      }, 100);
      
      return () => {
        clearTimeout(timeout);
        clearInterval(interval);
      };
    }
    
    return () => clearTimeout(timeout);
  }, [duration, showProgress, handleClose]);
  
  const handleClose = React.useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onClose?.();
    }, 300); 
  }, [onClose]);
  
  const positionStyles = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
  };
  
  const icons = {
    success: <FaCheckCircle className="text-green-500 h-5 w-5" />,
    error: <FaExclamationTriangle className="text-red-500 h-5 w-5" />,
    warning: <FaExclamationTriangle className="text-yellow-500 h-5 w-5" />,
    info: <FaInfoCircle className="text-blue-500 h-5 w-5" />,
  };
  
  const bgColors = {
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  };
  
  const progressColors = {
    success: 'bg-green-500 dark:bg-green-400',
    error: 'bg-red-500 dark:bg-red-400',
    warning: 'bg-yellow-500 dark:bg-yellow-400',
    info: 'bg-blue-500 dark:bg-blue-400',
  };
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed z-50 min-w-[300px] max-w-md shadow-lg rounded-lg border ${bgColors[type]} ${positionStyles[position]}`}
        >
          <div className="p-4 flex items-start">
            <div className="flex-shrink-0">
              {icons[type]}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                {message}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="ml-auto flex-shrink-0 flex items-center justify-center h-5 w-5 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              <FaTimes className="h-3 w-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
            </button>
          </div>
          
          {showProgress && (
            <div className="relative h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-b-lg overflow-hidden">
              <div 
                className={`absolute top-0 left-0 h-full ${progressColors[type]} transition-all duration-100 ease-linear`} 
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const NotificationContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="fixed z-50 flex flex-col gap-4">{children}</div>
  );
};

export type NotificationData = {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
};

interface UseNotificationOptions {
  defaultDuration?: number;
  maxNotifications?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export const useNotification = (options: UseNotificationOptions = {}) => {
  const {
    defaultDuration = 5000,
    maxNotifications = 3,
    position = 'top-right',
  } = options;
  
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  
  const addNotification = (type: NotificationType, message: string, duration?: number) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    setNotifications(prev => {
      const newNotifications = [
        { id, type, message, duration: duration ?? defaultDuration },
        ...prev,
      ];
      
      return newNotifications.slice(0, maxNotifications);
    });
    
    return id;
  };
  
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };
  
  const notify = {
    success: (message: string, duration?: number) => 
      addNotification('success', message, duration),
    error: (message: string, duration?: number) => 
      addNotification('error', message, duration),
    warning: (message: string, duration?: number) => 
      addNotification('warning', message, duration),
    info: (message: string, duration?: number) => 
      addNotification('info', message, duration),
  };
  
  const NotificationsView = () => (
    <div className={`fixed z-50 ${positionStyles[position]} space-y-4`}>
      <AnimatePresence>
        {notifications.map(notification => (
          <Notification
            key={notification.id}
            type={notification.type}
            message={notification.message}
            duration={notification.duration}
            position={position}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
  
  return { notify, NotificationsView, notifications, removeNotification };
};

export default Notification;