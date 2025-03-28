'use client';

import React, { useState, useEffect, useCallback, useRef , useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FaSort, FaSortUp, FaSortDown, FaSearch, FaFilter, FaLock, FaUnlock, FaTrash, FaEllipsisV } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import useClickOutside from '@/hooks/useClickOutside';
import { User } from '@/types';
import axiosInstance from '@/config/axios';
import { isAxiosError } from 'axios';
import { ActivityBarChart, TimeDisplay, formatDateString,formatRelativeTime  } from '@/components/ActivityUtils';
import { motion, AnimatePresence } from 'framer-motion';
import debounce from 'lodash.debounce';

const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};


const pageTransition = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 }
};

const listItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.3
    }
  }),
  exit: { opacity: 0, y: -20 }
};

interface MobileUserCardProps {
  user: User;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}

const MobileUserCard = ({ user, index, isSelected, onSelect }: MobileUserCardProps) => (
  <motion.div
    variants={listItemVariants}
    initial="hidden"
    animate="visible"
    exit="exit"
    custom={index}
    layoutId={user.id}
    className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border py-5 px-4 
      ${isSelected ? 'border-indigo-500' : 'border-gray-200 dark:border-gray-700'}
      transition-all duration-200`}
  >
    <div className="flex items-start justify-between mb-3">
      <div>
        <h3 className="font-medium text-gray-900 dark:text-white">{user.name}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
      </div>
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onSelect}
        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
      />
    </div>

    <div className="flex items-center justify-between text-sm mb-3">
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        user.status === 'active' 
          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      }`}>
        {user.status}
      </span>
    </div>
    
    <div className="flex flex-col space-y-1 text-sm text-gray-500 dark:text-gray-400 mt-2">
      <div>Last active: {formatRelativeTime(user.last_activity_time)}</div>
      <div className="text-xs">Last login: {formatDateString(user.last_login_time)}</div>
    </div>

    <div className="h-32 mt-4 border-t pt-3 border-gray-100 dark:border-gray-700 overflow-visible"> 
      <div style={{ height: 90, width: '100%' }}> 
        <ActivityBarChart 
          pattern={user.activity_pattern}
          compact={false}
        />
      </div>
    </div>
  </motion.div>
);

MobileUserCard.displayName = 'MobileUserCard';

const ActionButton = ({ onClick, disabled, type, children }: {
  onClick: () => void;
  disabled: boolean;
  type: 'block' | 'unblock' | 'delete';
  children: React.ReactNode;
}) => (
  <motion.button
    whileHover={{ scale: disabled ? 1 : 1.05 }}
    whileTap={{ scale: disabled ? 1 : 0.95 }}
    onClick={onClick}
    disabled={disabled}
    className={`
      px-4 py-2 flex items-center justify-center rounded-md
      transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md
      ${disabled 
        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
        : type === 'block'
          ? 'bg-red-600 hover:bg-red-700 text-white'
          : type === 'unblock'
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
            : 'bg-gray-600 hover:bg-gray-700 text-white'
      }
    `}
  >
    {children}
  </motion.button>
);

ActionButton.displayName = 'ActionButton';

const AlertMessage = ({ type, message, onClose }: {
  type: 'success' | 'error';
  message: string;
  onClose: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className={`mb-4 ${
      type === 'success' 
        ? 'bg-green-50 border-green-300 text-green-800' 
        : 'bg-red-50 border-red-300 text-red-800'
    } px-4 py-3 rounded-lg relative`}
  >
    {message}
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClose}
      className="absolute top-0 right-0 px-4 py-3"
    >
    </motion.button>
  </motion.div>
);

AlertMessage.displayName = 'AlertMessage';

interface MobileViewProps {
  users: User[];
  selectedUsers: string[];
  handleSelect: (userId: string) => void;
  handleSelectAll: () => void;
  loading: boolean;
  actionInProgress: boolean;
  actionType: 'block' | 'unblock' | 'delete' | null;
  processAction: (action: 'block' | 'unblock' | 'delete') => void;
}

const MobileView = ({ 
  users, 
  selectedUsers, 
  handleSelect,
  handleSelectAll,
  loading,
}: MobileViewProps) => (
  <motion.div 
    initial="initial"
    animate="animate"
    exit="exit"
    variants={pageTransition}
    className="md:hidden space-y-4"
  >
    <div className="sticky top-16 z-10 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={users.length > 0 && selectedUsers.length === users.length}
              onChange={handleSelectAll}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {selectedUsers.length} of {users.length} selected
            </span>
          </div>
        </div>
      </div>
    </div>
    
    {loading ? (
      // Mobile skeleton loader
      [...Array(3)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-4 animate-pulse">
          <div className="flex items-start justify-between mb-3">
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
            <div className="h-4 w-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-3"></div>
          <div className="h-20 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
        </div>
      ))
    ) : (
      users.map((user, index) => (
        <MobileUserCard
          key={user.id}
          user={user}
          index={index}
          isSelected={selectedUsers.includes(user.id)}
          onSelect={() => handleSelect(user.id)}
        />
      ))
    )}
  </motion.div>
);

MobileView.displayName = 'MobileView';

const ActionButtons = ({ 
  selectedUsers, 
  loading, 
  actionInProgress, 
  actionType,
  processAction 
}: {
  selectedUsers: string[];
  loading: boolean;
  actionInProgress: boolean;
  actionType: 'block' | 'unblock' | 'delete' | null;
  processAction: (action: 'block' | 'unblock' | 'delete') => void;
}) => {
  return (
    <motion.div className="flex gap-2">
      <ActionButton
        type="block"
        onClick={() => processAction('block')}
        disabled={selectedUsers.length === 0 || loading || actionInProgress}
      >
        {actionInProgress && actionType === 'block' ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-3 w-3 border-2 border-white border-t-transparent rounded-full mr-1.5"
          />
        ) : (
          <FaLock className="mr-1.5" size={12} />
        )}
        <span>Block</span>
      </ActionButton>

      <ActionButton
        type="unblock"
        onClick={() => processAction('unblock')}
        disabled={selectedUsers.length === 0 || loading || actionInProgress}
      >
        {actionInProgress && actionType === 'unblock' ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-3 w-3 border-2 border-white border-t-transparent rounded-full mr-1.5"
          />
        ) : (
          <FaUnlock className="mr-1.5" size={12} />
        )}
        <span>Unblock</span>
      </ActionButton>

      <ActionButton
        type="delete"
        onClick={() => processAction('delete')}
        disabled={selectedUsers.length === 0 || loading || actionInProgress}
      >
        {actionInProgress && actionType === 'delete' ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-3 w-3 border-2 border-white border-t-transparent rounded-full mr-1.5"
          />
        ) : (
          <FaTrash className="mr-1.5" size={12} />
        )}
        <span>Delete</span>
      </ActionButton>
    </motion.div>
  );
};

ActionButtons.displayName = 'ActionButtons';

interface FilterDropdownProps {
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  sortOrder: string;
  setSortOrder: (order: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  onApplyFilters: () => void;
  setPage: (page: number) => void;
  setLoading: (loading: boolean) => void;
  clearUsers: () => void;
}

const FilterDropdown = ({ 
  showFilters,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  statusFilter,
  setStatusFilter,
  onApplyFilters,
  setPage,
  setLoading,
  clearUsers
}: FilterDropdownProps) => {
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [newSortBy, newSortOrder] = e.target.value.split('-');
    
    setLoading(true);
    clearUsers();
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setPage(1);
    
    setTimeout(() => onApplyFilters(), 10);
  };

  return (
    <AnimatePresence>
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute z-20 mt-2 right-0 w-80 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border dark:border-gray-700"
        >
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sort by
              </label>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={handleSortChange}
                className="w-full p-2 text-sm border rounded-md shadow-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="name-ASC">Name (A to Z)</option>
                <option value="name-DESC">Name (Z to A)</option>
                <option value="last_login_time-DESC">Most recently logged in</option>
                <option value="last_login_time-ASC">Least recently logged in</option>
                <option value="created_at-DESC">Newest accounts</option>
                <option value="created_at-ASC">Oldest accounts</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                  setTimeout(() => onApplyFilters(), 10);
                }}
                className="w-full p-2 text-sm border rounded-md shadow-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">All</option>
                <option value="active">Active Only</option>
                <option value="blocked">Blocked Only</option>
              </select>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

FilterDropdown.displayName = 'FilterDropdown';

const SortButton = React.memo(({ column, currentSort, currentOrder, onClick }: {
  column: string;
  currentSort: string;
  currentOrder: string;
  onClick: () => void;
}) => (
  <span 
    onClick={(e) => {
      e.stopPropagation(); 
      onClick();
    }}
    className="ml-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
    title={`Sort by ${column} ${currentSort === column && currentOrder === 'ASC' ? '(descending)' : '(ascending)'}`}
  >
    {currentSort === column ? (
      currentOrder === 'ASC' ? 
        <FaSortUp className="text-indigo-500" /> : 
        <FaSortDown className="text-indigo-500" />
    ) : (
      <FaSort className="text-gray-300 dark:text-gray-500" />
    )}
  </span>
));

SortButton.displayName = 'SortButton';

interface TableHeaderProps {
  handleSelectAll: () => void;
  users: User[];
  selectedUsers: string[];
  sortBy: string;
  sortOrder: string;
  toggleSort: (column: string) => void;
}

const TableHeader = ({ handleSelectAll, users, selectedUsers, sortBy, sortOrder, toggleSort }: TableHeaderProps) => (
  <thead className="bg-gray-50 dark:bg-gray-700">
    <tr>
      <th className="px-4 py-3">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          checked={users.length > 0 && selectedUsers.length === users.length}
          onChange={handleSelectAll}
          disabled={users.length === 0}
        />
      </th>
      <th className="px-4 py-3 text-left">
        <div 
          className="flex items-center cursor-pointer"
          onClick={() => toggleSort('name')}
        >
          <span className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</span>
          <SortButton 
            column="name" 
            currentSort={sortBy} 
            currentOrder={sortOrder} 
            onClick={() => toggleSort('name')} 
          />
        </div>
      </th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
        Email
      </th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
        <div 
          className="flex items-center cursor-pointer"
          onClick={() => toggleSort('last_login_time')}
        >
          Last Login
          <SortButton 
            column="last_login_time" 
            currentSort={sortBy} 
            currentOrder={sortOrder} 
            onClick={() => toggleSort('last_login_time')} 
          />
        </div>
      </th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
        <div 
          className="flex items-center cursor-pointer"
          onClick={() => toggleSort('created_at')}
        >
          Registered
          <SortButton 
            column="created_at" 
            currentSort={sortBy} 
            currentOrder={sortOrder} 
            onClick={() => toggleSort('created_at')} 
          />
        </div>
      </th>
      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
        <div 
          className="flex items-center justify-center cursor-pointer" 
          onClick={() => toggleSort('status')}
        >
          Status
          <SortButton 
            column="status" 
            currentSort={sortBy} 
            currentOrder={sortOrder} 
            onClick={() => toggleSort('status')} 
          />
        </div>
      </th>
    </tr>
  </thead>
);

TableHeader.displayName = 'TableHeader';

interface DesktopViewProps {
  users: User[];
  selectedUsers: string[];
  handleSelect: (id: string) => void;
  handleSelectAll: () => void;
  sortBy: string;
  sortOrder: string;
  toggleSort: (column: string) => void;
}

const VirtualizedTable = React.memo(({ users, selectedUsers, handleSelect }) => {
  const visibleRows = useMemo(() => {
    return users.map((user) => (
      <div 
        key={user.id}
        className={`flex items-center border-b border-gray-200 dark:border-gray-700 py-4 relative ${
          selectedUsers.includes(user.id) ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
        } hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200`}
      >
        <div className="px-4 w-10">
          <input
            type="checkbox"
            checked={selectedUsers.includes(user.id)}
            onChange={() => handleSelect(user.id)}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
        </div>
        <div className="px-4 w-1/6">
          <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
        </div>
        <div className="px-4 w-1/4">
          <div className="text-sm text-gray-500 dark:text-gray-300">{user.email}</div>
        </div>
        <div className="px-4 w-1/4">
          <TimeDisplay time={user.last_activity_time || user.last_login_time} showStatus={true} />
          <span className="text-xs text-gray-400 block mt-1.5">
            Last login: {formatDateString(user.last_login_time)}
          </span>
          <div className="w-full h-20 mt-2 border-t pt-2 border-gray-100 dark:border-gray-700 overflow-visible">
            <ActivityBarChart 
              pattern={user.activity_pattern} 
              compact={true}
            />
          </div>
        </div>
        <div className="px-4 w-1/6 hidden sm:block">
          <div className="text-sm text-gray-500 dark:text-gray-300">
            {formatDateString(user.created_at)}
          </div>
        </div>
        <div className="px-4 w-1/6 text-center">
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
            user.status === 'active'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
          }`}>
            {user.status}
          </span>
        </div>
      </div>
    ));
  }, [users, selectedUsers, handleSelect]);

  return (
    <div className="overflow-auto relative" style={{height: "70vh"}}>
      {visibleRows}
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.users === nextProps.users && 
         prevProps.selectedUsers === nextProps.selectedUsers;
});

VirtualizedTable.displayName = 'VirtualizedTable';

const DesktopView = ({ 
  users, 
  selectedUsers, 
  handleSelect,
  handleSelectAll,
  sortBy, 
  sortOrder, 
  toggleSort 
}: DesktopViewProps) => (
  <div className="hidden md:block">
    <div className="flex bg-gray-50 dark:bg-gray-700 py-3">
      <div className="px-4 w-10">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          checked={users.length > 0 && selectedUsers.length === users.length}
          onChange={handleSelectAll}
          disabled={users.length === 0}
        />
      </div>
      <div className="px-4 w-1/6">
        <div className="flex items-center cursor-pointer" onClick={() => toggleSort('name')}>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</span>
          <SortButton column="name" currentSort={sortBy} currentOrder={sortOrder} onClick={() => toggleSort('name')} />
        </div>
      </div>
      <div className="px-4 w-1/4">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Email</span>
      </div>
      <div className="px-4 w-1/4">
        <div className="flex items-center cursor-pointer" onClick={() => toggleSort('last_login_time')}>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Last Login</span>
          <SortButton column="last_login_time" currentSort={sortBy} currentOrder={sortOrder} onClick={() => toggleSort('last_login_time')} />
        </div>
      </div>
      <div className="px-4 w-1/6 hidden sm:block">
        <div className="flex items-center cursor-pointer" onClick={() => toggleSort('created_at')}>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Registered</span>
          <SortButton column="created_at" currentSort={sortBy} currentOrder={sortOrder} onClick={() => toggleSort('created_at')} />
        </div>
      </div>
      <div className="px-4 w-1/6 text-center">
        <div className="flex items-center justify-center cursor-pointer" onClick={() => toggleSort('status')}>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</span>
          <SortButton column="status" currentSort={sortBy} currentOrder={sortOrder} onClick={() => toggleSort('status')} />
        </div>
      </div>
    </div>
    {users.length === 0 && (
      <TableSkeletonLoader />
    )}
    <VirtualizedTable
      users={users}
      selectedUsers={selectedUsers}
      handleSelect={handleSelect}
    />
  </div>
);

DesktopView.displayName = 'DesktopView';

const TableSkeletonLoader = React.memo(() => (
  <div className="hidden md:block">
    {/* Header skeleton */}
    <div className="flex bg-gray-50 dark:bg-gray-700 py-3">
      <div className="px-4 w-10">
        <div className="h-4 w-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
      </div>
      <div className="px-4 w-1/6">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
      </div>
      <div className="px-4 w-1/4">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
      </div>
      <div className="px-4 w-1/4">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
      </div>
      <div className="px-4 w-1/6 hidden sm:block">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
      </div>
      <div className="px-4 w-1/6 text-center">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-12 mx-auto"></div>
      </div>
    </div>
    
    {/* Body skeleton */}
    <div style={{height: "70vh"}} className="overflow-auto relative">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="flex items-center border-b border-gray-200 dark:border-gray-700 py-4 animate-pulse">
          <div className="px-4 w-10">
            <div className="h-4 w-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
          <div className="px-4 w-1/6">
            <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
          </div>
          <div className="px-4 w-1/4">
            <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
          </div>
          <div className="px-4 w-1/4">
            <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-24 mb-2"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-2"></div>
            <div className="h-16 bg-gray-300 dark:bg-gray-600 rounded w-full mt-3"></div>
          </div>
          <div className="px-4 w-1/6 hidden sm:block">
            <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-28"></div>
          </div>
          <div className="px-4 w-1/6 flex justify-center">
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded-full w-16"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
));

TableSkeletonLoader.displayName = 'TableSkeletonLoader';

const Pagination = ({ currentPage, totalPages, onPageChange }: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) => (
  <div className="flex items-center justify-center mt-8">
    <button
      onClick={() => onPageChange(currentPage - 1)}
      disabled={currentPage <= 1}
      className="px-3 py-1 rounded border text-sm mr-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Previous
    </button>
    
    <div className="flex space-x-1">
      {[...Array(totalPages)].map((_, i) => (
        <button
          key={i}
          onClick={() => onPageChange(i + 1)}
          className={`w-8 h-8 flex items-center justify-center rounded text-sm
            ${currentPage === i + 1 
              ? 'bg-indigo-600 text-white' 
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
        >
          {i + 1}
        </button>
      ))}
    </div>
    
    <button
      onClick={() => onPageChange(currentPage + 1)}
      disabled={currentPage >= totalPages}
      className="px-3 py-1 rounded border text-sm ml-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Next
    </button>
  </div>
);

Pagination.displayName = 'Pagination';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <h2 className="text-lg font-medium text-red-800">Something went wrong</h2>
          <p className="text-sm text-red-600">{this.state.error?.message || 'Unknown error'}</p>
        </div>
      );
    }

    return this.props.children;
  }
}


const LoadingOverlay = () => (
  <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 flex items-center justify-center z-20">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [actionType, setActionType] = useState<'block' | 'unblock' | 'delete' | null>(null);
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>('online');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('ASC');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const filterRef = useRef<HTMLDivElement>(null);

  useClickOutside(filterRef, () => setShowFilters(false));

  useEffect(() => {
    const handleOnline = () => setNetworkStatus('online');
    const handleOffline = () => setNetworkStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    setNetworkStatus(navigator.onLine ? 'online' : 'offline');

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const clearUsers = useCallback(() => {
    setUsers([]);
  }, []);

  const fetchUsers = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setUsers([]); 
      }
      
      if (networkStatus === 'offline') {
        const cached = localStorage.getItem('cached_users');
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < 5 * 60 * 1000) {
            setUsers(data.users);
            setTotalPages(data.totalPages);
            return;
          }
        }
        throw new Error('You are offline');
      }

      const response = await axiosInstance.get('/api/users', {
        params: {
          page,
          search: searchTerm,
          status: statusFilter,
          sortBy,
          order: sortOrder
        }
      });

      setUsers(response.data.users);
      setTotalPages(response.data.totalPages);

      localStorage.setItem('cached_users', JSON.stringify({
        data: response.data,
        timestamp: Date.now()
      }));

    } catch (err) {
      if (!silent) {
        if (isAxiosError(err)) {
          if (err.response?.status === 401) {
            logout();
            router.push('/auth');
          } else {
            setError(err.response?.data?.message || 'Failed to fetch users');
          }
        } else {
          setError(err instanceof Error ? err.message : 'Failed to fetch users');
        }
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [page, searchTerm, statusFilter, sortBy, sortOrder, networkStatus, logout, router]);

  const handleFetchUsers = useCallback(() => {
    setPage(1); 
    fetchUsers();
  }, [fetchUsers, setPage]);

  const debouncedFetchUsers = useMemo(
    () => debounce(handleFetchUsers, 300),
    [handleFetchUsers]
  );

  useEffect(() => {
    return () => {
      debouncedFetchUsers.cancel();
    };
  }, [debouncedFetchUsers]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth');
    } else if (!isLoading && user) {
      fetchUsers();
    }
  }, [isLoading, user, router, fetchUsers]);

  useEffect(() => {
    if (!user) return;

    const updateInterval = setInterval(() => {
      fetchUsers(true); 
    }, 30000); 

    return () => clearInterval(updateInterval);
  }, [user, fetchUsers]);

  const handleSelectAll = useCallback(() => {
    setSelectAll(!selectAll);
    setSelectedUsers(selectAll ? [] : users.map(user => user.id));
  }, [selectAll, users]);

  const handleSelect = useCallback((userId: string) => {
    setSelectedUsers(prev => {
      const newSelection = prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId];
      setSelectAll(newSelection.length === users.length);
      return newSelection;
    });
  }, [users.length]);

  const processAction = async (action: 'block' | 'unblock' | 'delete') => {
    if (selectedUsers.length === 0 || actionInProgress) return;

    setActionInProgress(true);
    setActionType(action);

    try {
      if (action === 'delete' && selectedUsers.includes(user!.id)) {
        const confirmed = window.confirm(
          'Are you sure you want to delete your account? This action cannot be undone.'
        );
        if (!confirmed) {
          setActionInProgress(false);
          setActionType(null);
          return;
        }
      }

      const response = await axiosInstance.post(`/api/users/${action}`, {
        userIds: selectedUsers
      });

      if (response.data.selfDeleted || response.data.selfBlocked) {
        setSuccess(response.data.message);
        setTimeout(() => {
          logout();
          router.push('/auth');
        }, 1500);
        return;
      }

      setSuccess(response.data.message);
      setSelectedUsers([]);
      setSelectAll(false);
      await fetchUsers();

    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message || `Failed to ${action} users`);
      } else {
        setError(`An error occurred while trying to ${action} users`);
      }
    } finally {
      setActionInProgress(false);
      setActionType(null);
    }
  };

  const toggleSort = useCallback((column: string) => {
    let newOrder: 'ASC' | 'DESC';
    
    if (sortBy === column) {
      newOrder = sortOrder === 'ASC' ? 'DESC' : 'ASC';
    } else {
      switch (column) {
        case 'name':
        case 'status':
          newOrder = 'ASC'; 
          break;
        case 'last_login_time':
        case 'created_at':
        case 'last_activity_time':
          newOrder = 'DESC'; 
          break;
        default:
          newOrder = 'ASC';
      }
    }
  
    setSortBy(column);
    setSortOrder(newOrder);
    setPage(1);

    const currentData = [...users];

    const localSorted = [...users].sort((a, b) => {
      const aVal = column in a ? a[column] || '' : '';
      const bVal = column in b ? b[column] || '' : '';
      
      if (column === 'name' || column === 'status' || column === 'email') {
        return newOrder === 'ASC' 
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      } else {
        const dateA = aVal ? new Date(aVal).getTime() : 0;
        const dateB = bVal ? new Date(bVal).getTime() : 0;
        return newOrder === 'ASC' ? dateA - dateB : dateB - dateA;
      }
    });

    setUsers(localSorted);

    const silentFetch = async () => {
      try {
        setLoading(true);
        
        const response = await axiosInstance.get('/api/users', {
          params: {
            page,
            search: searchTerm,
            status: statusFilter,
            sortBy: column,
            order: newOrder
          }
        });
        
        setUsers(response.data.users);
        setTotalPages(response.data.totalPages);
        localStorage.setItem('cached_users', JSON.stringify({
          data: response.data,
          timestamp: Date.now()
        }));
      } catch (err) {
        console.error('Error fetching sorted data:', err);
        setUsers(currentData);
      } finally {
        setLoading(false);
      }
    };

    setTimeout(silentFetch, 300);
  }, [sortBy, sortOrder, users, page, searchTerm, statusFilter]);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (debouncedSearchTerm !== undefined) {
      setLoading(true); 
      fetchUsers();
    }
  }, [debouncedSearchTerm, fetchUsers]);

  const handleApplyFilters = useCallback(() => {
    setLoading(true);
    setUsers([]); 
    setPage(1);
    setTimeout(() => fetchUsers(), 10);
  }, [setPage, fetchUsers]);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    setLoading(true);
    setUsers([]); 
    setTimeout(() => fetchUsers(), 10);
  }, [fetchUsers, setPage]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <span className="text-lg md:text-xl font-bold">User Administration</span>
              
              {/* Mobile menu button */}
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 focus:outline-none"
              >
                <FaEllipsisV />
              </button>
              
              {/* Desktop user info */}
              <div className="hidden md:flex items-center space-x-4">
                {/* Network status indicator */}
                <div className={`flex items-center text-xs ${networkStatus === 'online' ? 'text-green-600' : 'text-red-600'}`}>
                  <div className={`w-2 h-2 rounded-full mr-1 ${networkStatus === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  {networkStatus}
                </div>
                <span className="text-sm">
                  Welcome, <span className="font-medium">{user?.name || 'User'}</span>
                </span>
                <button 
                  onClick={logout}
                  className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-sm transition-colors duration-200"
                >
                  Logout
                </button>
              </div>
            </div>
            
            {/* Mobile menu */}
            {isMenuOpen && (
              <div className="md:hidden py-2 border-t border-gray-200 dark:border-gray-700 animate-fade-in">
                <div className="flex flex-col space-y-2 pb-3">
                  <span className="text-sm">
                    Welcome, <span className="font-medium">{user?.name || 'User'}</span>
                  </span>
                  <button
                    onClick={logout}
                    className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-sm transition-colors duration-200"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-grow">
          {/* Success Message */}
          {success && (
            <AlertMessage type="success" message={success} onClose={() => setSuccess(null)} />
          )}
          
          {/* Error Message */}
          {error && (
            <AlertMessage type="error" message={error} onClose={() => setError(null)} />
          )}

          {/* Search and Actions */}
          <div className="mb-6 space-y-4 md:space-y-0 md:flex md:gap-4 md:justify-between">
            <div className="flex flex-col w-full md:max-w-[60%] space-y-2">
              {/* Search and Filter Row */}
              <div className="flex items-center gap-2">
                {/* Search Box */}
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      debouncedFetchUsers();
                    }}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm
                      focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500
                      transition-all dark:bg-gray-700 dark:border-gray-600
                      dark:text-white text-sm"
                  />
                </div>

                {/* Filter Button */}
                <div className="relative" ref={filterRef}>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 flex items-center gap-1 shadow-sm transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
                  >
                    <FaFilter size={14} />
                    <span className="text-xs whitespace-nowrap ml-1">
                      Filters {(sortBy !== 'name' || sortOrder !== 'ASC' || statusFilter !== '') && (
                        <span className="inline-flex items-center justify-center w-4 h-4 ml-1 text-[10px] font-bold text-white bg-indigo-600 rounded-full">
                          {((sortBy !== 'name' || sortOrder !== 'ASC') ? 1 : 0) + (statusFilter !== '' ? 1 : 0)}
                        </span>
                      )}
                    </span>
                  </button>

                  <FilterDropdown
                    showFilters={showFilters}
                    setShowFilters={setShowFilters}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    sortOrder={sortOrder}
                    setSortOrder={setSortOrder}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    onApplyFilters={handleApplyFilters}
                    setPage={setPage}
                    setLoading={setLoading}
                    clearUsers={clearUsers}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons - Both Mobile and Desktop Views */}
            <div className="flex justify-center md:justify-start">
              <ActionButtons 
                selectedUsers={selectedUsers}
                loading={loading}
                actionInProgress={actionInProgress}
                actionType={actionType}
                processAction={processAction}
              />
            </div>
          </div>

          {/* Active Filters - Desktop View */}
          {(statusFilter || (sortBy !== 'name') || (sortOrder !== 'ASC')) && (
            <div className="flex flex-wrap gap-2 mb-6">
              <div className="text-xs text-gray-500 dark:text-gray-400 mr-1">Active filters:</div>
              
              {statusFilter && (
                <div className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 flex items-center gap-1">
                  Status: {statusFilter}
                  <button 
                    onClick={() => {
                      setStatusFilter('');
                      setPage(1);
                      fetchUsers();
                    }}
                    className="ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    <span className="sr-only">Remove filter</span>
                  </button>
                </div>
              )}
              
              {(sortBy !== 'name' || sortOrder !== 'ASC') && (
                <div className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 flex items-center gap-1">
                  Sort: {
                    sortBy === 'name' ? `Name (${sortOrder === 'ASC' ? 'A-Z' : 'Z-A'})` : 
                    sortBy === 'created_at' ? `${sortOrder === 'ASC' ? 'Oldest' : 'Newest'} accounts` : 
                    sortBy === 'last_activity_time' ? `${sortOrder === 'ASC' ? 'Least' : 'Most'} time spent` :
                    sortBy === 'last_login_time' ? `${sortOrder === 'ASC' ? 'Least' : 'Most'} recently logged in` :
                    sortBy === 'status' ? `Status (${sortOrder === 'ASC' ? 'Active' : 'Blocked'} first)` :
                    'Default'
                  }
                  <button 
                    onClick={() => {
                      setSortBy('name');
                      setSortOrder('ASC');
                      setPage(1);
                      fetchUsers();
                    }}
                    className="ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    ×
                  </button>
                </div>
              )}
              
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                  setSortBy('name');
                  setSortOrder('ASC');
                  setPage(1);
                  fetchUsers();
                }}
                className="px-2 py-1 text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Clear all
              </button>
            </div>
          )}
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg mt-4 relative">
            {loading && <LoadingOverlay />}
            {loading && users.length === 0 ? (
              <TableSkeletonLoader />
            ) : (
              <DesktopView 
                users={users}
                selectedUsers={selectedUsers}
                handleSelect={handleSelect}
                handleSelectAll={handleSelectAll}
                sortBy={sortBy}
                sortOrder={sortOrder}
                toggleSort={toggleSort}
              />
            )}
            
            {/* Mobile View */}
            <MobileView 
              users={users}
              selectedUsers={selectedUsers}
              handleSelect={handleSelect}
              handleSelectAll={handleSelectAll}
              loading={loading}
              actionInProgress={actionInProgress}
              actionType={actionType}
              processAction={processAction}
            />
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination 
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}

