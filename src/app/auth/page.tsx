'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import axiosInstance, { axios } from '@/config/axios'; 
import { motion, AnimatePresence } from 'framer-motion';

function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [offlineMode, setOfflineMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Use proper mounting to prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user) {
      router.push('/admin');
    }
    const registered = searchParams.get('registered');
    if (registered) {
      setSuccess('Registration successful! Please log in with your credentials.');
      setIsLogin(true);
    }
  }, [user, router, searchParams]);

  useEffect(() => {
    const handleOnline = () => setOfflineMode(false);
    const handleOffline = () => setOfflineMode(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setOfflineMode(!navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (!email || !password) {
        setError('Please enter both email and password');
        setLoading(false);
        return;
      }
      
      try {
        await login(email, password);
        router.push('/admin');
      } catch (error: unknown) {
        localStorage.removeItem('token');

        if ((typeof error === 'object' && error !== null && '__blockedAccount' in error) || 
            (axios.isAxiosError(error) && error.response?.status === 403 && 
             error.response.data?.code === 'ACCOUNT_BLOCKED')) {
          setError('Your account has been blocked. Please contact the administrator for assistance.');
          
          const form = document.querySelector('form');
          if (form) {
            form.classList.add('animate-shake');
            setTimeout(() => form.classList.remove('animate-shake'), 500);
          }
        } else if (axios.isAxiosError(error) && error.response?.status === 401) {
          setError('Invalid email or password. Please try again.');
        } else {
          setError(axios.isAxiosError(error) ? error.response?.data?.message || 'Login failed. Please try again.' : 'Login failed. Please try again.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      // Basic validation
      if (!name.trim() || !email.trim() || !password) {
        setError('All fields are required');
        setLoading(false);
        return;
      }
      
      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        setLoading(false);
        return;
      }
      
      try {
        await axiosInstance.post('/api/auth/register', { 
          name: name.trim(), 
          email: email.trim(), 
          password 
        });
        
        setSuccess('Registration successful! Please log in with your credentials.');
        setIsLogin(true);
        setName('');
        setEmail('');
        setPassword('');
      } catch (error: unknown) {
        console.log('Registration error:', error);
        
        if (typeof error === 'object' && error !== null && '__blockedAccount' in error) {
          setError('This account has been blocked. Please contact the administrator.');
          
          const form = document.querySelector('form');
          if (form) {
            form.classList.add('animate-shake');
            setTimeout(() => form.classList.remove('animate-shake'), 500);
          }
        } 
        else if (axios.isAxiosError(error) && error.response) {
          if (error.response.status === 403 && error.response.data?.code === 'ACCOUNT_BLOCKED') {
            setError('This account has been blocked. Please contact the administrator.');
            
            const form = document.querySelector('form');
            if (form) {
              form.classList.add('animate-shake');
              setTimeout(() => form.classList.remove('animate-shake'), 500);
            }
          } else if (error.response.data?.message) {
            setError(error.response.data.message);
          
            if (error.response.data.field) {
              const field = document.getElementById(`register-${error.response.data.field}`);
              if (field) field.focus();
            }
          } else {
            setError('Registration failed. Please try again.');
          }
        } else {
          // Better error message
          setError(axios.isAxiosError(error) ? error.response?.data?.message || 'Unable to register account. Please check your connection and try again.' : 'Unable to register account. Please check your connection and try again.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Enhanced animations
  const formVariants = {
    initial: { opacity: 0, x: isLogin ? 100 : -100 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } },
    exit: { opacity: 0, x: isLogin ? -100 : 100, transition: { duration: 0.4 } }
  };

  const bannerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.7, delay: 0.2 } }
  };

  const bannerTextVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.8, 
        delay: 0.5,
        ease: "easeOut" 
      } 
    }
  };

  const bannerShapeVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: (custom: number) => ({
      scale: 1,
      opacity: 0.8,
      transition: { 
        delay: 0.3 + (custom * 0.2), 
        duration: 0.7, 
        ease: "easeOut"
      }
    })
  };

  const inputGroupVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: (custom: number) => ({
      y: 0,
      opacity: 1,
      transition: { delay: custom * 0.15, duration: 0.5 }
    })
  };

  if (!mounted) {
    return null; // Prevent hydration issues
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Banner side - left panel */}
      <motion.div 
        className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 to-violet-800 flex-col justify-center items-center text-white p-12 relative overflow-hidden"
        initial="hidden"
        animate="visible"
        variants={bannerVariants}
      >
        {/* Enhanced glass-like shapes in background */}
        <motion.div 
          className="absolute top-[15%] left-[20%] w-32 h-32 rounded-full bg-white/20 backdrop-blur-md shadow-lg"
          variants={bannerShapeVariants}
          custom={0}
          initial="hidden"
          animate="visible"
        />
        <motion.div 
          className="absolute bottom-[25%] right-[18%] w-48 h-48 rounded-full bg-white/15 backdrop-blur-sm shadow-lg"
          variants={bannerShapeVariants}
          custom={1}
          initial="hidden"
          animate="visible"
        />
        <motion.div 
          className="absolute top-[55%] left-[10%] w-40 h-40 rounded-full bg-white/10 backdrop-blur-sm shadow-lg"
          variants={bannerShapeVariants}
          custom={2}
          initial="hidden"
          animate="visible"
        />
        <motion.div 
          className="absolute top-[30%] right-[15%] w-20 h-20 rounded-full bg-indigo-300/20 backdrop-blur-md shadow-lg"
          variants={bannerShapeVariants}
          custom={3}
          initial="hidden"
          animate="visible"
        />
        
        {/* Background overlay gradient for better text visibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-600/40 to-violet-800/40 backdrop-blur-[2px]"></div>

        <motion.div
          className="relative z-10 max-w-lg"
          variants={bannerTextVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div 
            className="flex items-center gap-3 mb-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <div className="h-12 w-12 bg-white/20 backdrop-blur-md shadow-lg rounded-xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <span className="text-xl font-medium text-white drop-shadow-md">Administration System</span>
          </motion.div>
          
          <h1 className="text-5xl font-bold mb-6 leading-tight text-white drop-shadow-lg">User Administration Panel</h1>
          <p className="text-xl mb-10 text-white/90 drop-shadow-md">
            {isLogin 
              ? "Welcome back! Manage your organization, users, and permissions with ease." 
              : "Join our platform and start managing your organization with powerful admin tools."}
          </p>
          
          <div className="h-1 w-28 bg-white/30 backdrop-blur-sm mb-10 rounded-full"></div>
          
          <motion.button 
            onClick={() => setIsLogin(!isLogin)}
            className="group px-8 py-4 rounded-full bg-white/90 backdrop-blur-sm text-indigo-700 font-medium hover:bg-white/100 hover:shadow-lg transition duration-300 flex items-center"
            whileHover={{ scale: 1.03, boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.4)" }}
            whileTap={{ scale: 0.98 }}
          >
            {isLogin ? (
              <>
                <span>Create an account</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
                <span>Back to login</span>
              </>
            )}
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Form side - right panel */}
      <div className="w-full lg:w-1/2 flex justify-center items-center bg-white dark:bg-gray-900 p-6 sm:p-8 md:p-10 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile header with logo */}
          <div className="block lg:hidden mb-10">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="h-12 w-12 bg-gradient-to-br from-indigo-600 to-violet-800 rounded-xl flex items-center justify-center shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <span className="text-xl font-medium text-gray-900 dark:text-white">Administration System</span>
            </div>
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="w-full flex justify-center items-center py-3.5 px-4 bg-indigo-50 dark:bg-gray-800/50 text-indigo-600 dark:text-indigo-400 font-medium rounded-xl hover:bg-indigo-100 dark:hover:bg-gray-700 transition duration-300 shadow-sm"
            >
              {isLogin ? "Need an account? Register" : "Already have an account? Login"}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {success && (
              <motion.div 
                key="success-message" 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl shadow-sm" 
                role="alert"
              >
                <span className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{success}</span>
                </span>
              </motion.div>
            )}

            {error && (
              <motion.div 
                key="error-message" 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mb-6 px-4 py-3 rounded-xl shadow-sm ${
                  error.includes('account has been blocked') || error.includes('Account blocked')
                    ? 'bg-orange-50 dark:bg-orange-900/10 border border-orange-300 dark:border-orange-700 text-orange-800 dark:text-orange-400'
                    : 'bg-red-50 dark:bg-red-900/10 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400'
                }`}
                role="alert"
              >
                <span className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">{error}</span>
                </span>
                
                {(error.includes('account has been blocked') || error.includes('Account blocked')) && (
                  <div className="mt-2 ml-7 text-sm">
                    Please contact an administrator to restore access to your account.
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {offlineMode && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-500 px-4 py-3 rounded-xl flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span><strong>Offline Mode:</strong> You are currently offline. Some features may be limited.</span>
              </motion.div>
            )}

            {isLogin ? (
              <motion.div
                key="login-form" 
                variants={formVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="bg-white dark:bg-gray-900 rounded-xl"
              >
                <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
                  Welcome back
                  <span className="block text-lg font-normal text-gray-600 dark:text-gray-400 mt-1">Sign in to your account</span>
                </h2>

                <form onSubmit={handleLogin} className="space-y-6">
                  <motion.div 
                    className="relative"
                    variants={inputGroupVariants}
                    initial="hidden"
                    animate="visible"
                    custom={1}
                  >
                    <input
                      id="login-email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="peer w-full px-4 py-3.5 border-2 border-gray-300 dark:border-gray-700 rounded-xl placeholder-transparent focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors dark:bg-gray-800/50 dark:text-white"
                      placeholder="Email address"
                    />
                    <label 
                      htmlFor="login-email" 
                      className="absolute left-4 -top-2.5 text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 px-1 transition-all peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-focus:-top-2.5 peer-focus:text-indigo-600 dark:peer-focus:text-indigo-400 peer-focus:text-sm"
                    >
                      Email address
                    </label>
                  </motion.div>

                  <motion.div 
                    className="relative"
                    variants={inputGroupVariants}
                    initial="hidden"
                    animate="visible"
                    custom={2}
                  >
                    <input
                      id="login-password"
                      name="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="peer w-full px-4 py-3.5 border-2 border-gray-300 dark:border-gray-700 rounded-xl placeholder-transparent focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors dark:bg-gray-800/50 dark:text-white"
                      placeholder="Password"
                    />
                    <label 
                      htmlFor="login-password" 
                      className="absolute left-4 -top-2.5 text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 px-1 transition-all peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-focus:-top-2.5 peer-focus:text-indigo-600 dark:peer-focus:text-indigo-400 peer-focus:text-sm"
                    >
                      Password
                    </label>
                  </motion.div>

                  <motion.button
                    variants={inputGroupVariants}
                    initial="hidden"
                    animate="visible"
                    custom={3}
                    type="submit"
                    disabled={loading}
                    className={`relative w-full flex justify-center py-3.5 px-4 border border-transparent text-md font-medium rounded-xl text-white ${
                      loading 
                        ? 'bg-indigo-400 dark:bg-indigo-500/50 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:from-indigo-600 dark:to-indigo-800'
                    } shadow-md transition-all duration-200`}
                    whileHover={!loading ? { scale: 1.02, boxShadow: "0 10px 15px -3px rgba(79, 70, 229, 0.3)" } : {}}
                    whileTap={!loading ? { scale: 0.98 } : {}}
                  >
                    {loading ? (
                      <>
                        <span className="absolute left-4 inset-y-0 flex items-center">
                          <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="h-5 w-5 rounded-full border-2 border-white border-t-transparent"
                          ></motion.div>
                        </span>
                        <span>Signing in...</span>
                      </>
                    ) : 'Sign in'}
                  </motion.button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="register-form" 
                variants={formVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="bg-white dark:bg-gray-900 rounded-xl"
              >
                <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
                  Create account
                  <span className="block text-lg font-normal text-gray-600 dark:text-gray-400 mt-1">Join our platform</span>
                </h2>

                <form onSubmit={handleRegister} className="space-y-6">
                  <motion.div 
                    className="relative"
                    variants={inputGroupVariants}
                    initial="hidden"
                    animate="visible"
                    custom={1}
                  >
                    <input
                      id="register-name"
                      name="name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="peer w-full px-4 py-3.5 border-2 border-gray-300 dark:border-gray-700 rounded-xl placeholder-transparent focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors dark:bg-gray-800/50 dark:text-white"
                      placeholder="Full name"
                    />
                    <label 
                      htmlFor="register-name" 
                      className="absolute left-4 -top-2.5 text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 px-1 transition-all peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-focus:-top-2.5 peer-focus:text-indigo-600 dark:peer-focus:text-indigo-400 peer-focus:text-sm"
                    >
                      Full name
                    </label>
                  </motion.div>

                  <motion.div 
                    className="relative"
                    variants={inputGroupVariants}
                    initial="hidden"
                    animate="visible"
                    custom={2}
                  >
                    <input
                      id="register-email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="peer w-full px-4 py-3.5 border-2 border-gray-300 dark:border-gray-700 rounded-xl placeholder-transparent focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors dark:bg-gray-800/50 dark:text-white"
                      placeholder="Email address"
                    />
                    <label 
                      htmlFor="register-email" 
                      className="absolute left-4 -top-2.5 text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 px-1 transition-all peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-focus:-top-2.5 peer-focus:text-indigo-600 dark:peer-focus:text-indigo-400 peer-focus:text-sm"
                    >
                      Email address
                    </label>
                  </motion.div>

                  <motion.div 
                    className="relative"
                    variants={inputGroupVariants}
                    initial="hidden"
                    animate="visible"
                    custom={3}
                  >
                    <input
                      id="register-password"
                      name="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="peer w-full px-4 py-3.5 border-2 border-gray-300 dark:border-gray-700 rounded-xl placeholder-transparent focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors dark:bg-gray-800/50 dark:text-white"
                      placeholder="Password"
                    />
                    <label 
                      htmlFor="register-password" 
                      className="absolute left-4 -top-2.5 text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 px-1 transition-all peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-focus:-top-2.5 peer-focus:text-indigo-600 dark:peer-focus:text-indigo-400 peer-focus:text-sm"
                    >
                      Password
                    </label>
                  </motion.div>

                  <motion.div 
                    className="text-xs text-gray-500 dark:text-gray-400 flex items-center pl-1"
                    variants={inputGroupVariants}
                    initial="hidden"
                    animate="visible"
                    custom={4}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Password should be at least 8 characters long.
                  </motion.div>

                  <motion.button
                    variants={inputGroupVariants}
                    initial="hidden"
                    animate="visible"
                    custom={5}
                    type="submit"
                    disabled={loading}
                    className={`relative w-full flex justify-center py-3.5 px-4 border border-transparent text-md font-medium rounded-xl text-white ${
                      loading 
                        ? 'bg-indigo-400 dark:bg-indigo-500/50 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:from-indigo-600 dark:to-indigo-800'
                    } shadow-md transition-all duration-200`}
                    whileHover={!loading ? { scale: 1.02, boxShadow: "0 10px 15px -3px rgba(79, 70, 229, 0.3)" } : {}}
                    whileTap={!loading ? { scale: 0.98 } : {}}
                  >
                    {loading ? (
                      <>
                        <span className="absolute left-4 inset-y-0 flex items-center">
                          <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="h-5 w-5 rounded-full border-2 border-white border-t-transparent"
                          ></motion.div>
                        </span>
                        <span>Registering...</span>
                      </>
                    ) : 'Create account'}
                  </motion.button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Additional information section */}
          <motion.div 
            className="mt-10 text-center text-sm text-gray-600 dark:text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            <p>By using this service, you agree to our</p>
            <div className="mt-2 flex justify-center space-x-3 text-indigo-600 dark:text-indigo-400">
              <a href="#" className="hover:underline hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors">Terms of Service</a>
              <span>•</span>
              <a href="#" className="hover:underline hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors">Privacy Policy</a>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Optimized loading indicator with pulsing effect
const LoadingSpinner = () => (
  <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
    <div className="relative">
      <div className="h-16 w-16 rounded-full border-t-4 border-b-4 border-indigo-600 animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-8 w-8 bg-white dark:bg-gray-900 rounded-full animate-pulse"></div>
      </div>
    </div>
  </div>
);

export default function AuthPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AuthForm />
    </Suspense>
  );
}