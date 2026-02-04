import React, { useState, useRef, useEffect } from 'react';
import { loginUser, registerUser } from '../utils/auth';
import { CONSTANTS } from '../utils/constants';

const AuthModal = ({ isOpen, onClose, onLoginSuccess, onRegisterSuccess, language, translate, initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode); // 'login' or 'register'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [authError, setAuthError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  
  const modalRef = useRef(null);
  
  // 当isOpen或initialMode变化时更新模式
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);
  
  // 点击外部区域关闭模态框
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // 阻止页面滚动
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);
  
  // 处理表单输入变化
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: '' }));
    setAuthError('');
  };
  
  // 验证登录表单
  const validateLoginForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!formData.email) {
      errors.email = translate('emailRequired');
    } else if (!emailRegex.test(formData.email)) {
      errors.email = translate('invalidEmail');
    }
    
    if (!formData.password) {
      errors.password = translate('passwordRequired');
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // 验证注册表单
  const validateRegisterForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!formData.email) {
      errors.email = translate('emailRequired');
    } else if (!emailRegex.test(formData.email)) {
      errors.email = translate('invalidEmail');
    }
    
    if (!formData.password) {
      errors.password = translate('passwordRequired');
    } else if (formData.password.length < CONSTANTS.VALIDATION.PASSWORD_MIN_LENGTH) {
      errors.password = translate('passwordLength');
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = translate('passwordMatch');
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // 处理登录
  const handleLogin = (e) => {
    e.preventDefault();
    setFormSuccess('');
    setAuthError('');
    
    if (validateLoginForm()) {
      const result = loginUser(formData.email, formData.password);
      if (result.success) {
        setFormSuccess(translate('loginSuccess'));
        // 延迟关闭模态框，让用户看到成功消息
        setTimeout(() => {
          onLoginSuccess(result.user);
          onClose();
        }, 1500);
      } else {
        if (result.error === 'invalidCredentials') {
          setAuthError(translate('invalidCredentials'));
        } else {
          setAuthError(translate('unknownError'));
        }
      }
    }
  };
  
  // 处理注册
  const handleRegister = (e) => {
    e.preventDefault();
    setFormSuccess('');
    setAuthError('');
    
    if (validateRegisterForm()) {
        const result = registerUser(formData.email, formData.password);
      if (result.success) {
        setFormSuccess(translate('registerSuccess'));
        // 延迟关闭模态框，让用户看到成功消息
        setTimeout(() => {
          onRegisterSuccess(result.user);
          onClose();
        }, 1500);
      } else {
        if (result.error === 'emailExists') {
          setAuthError(translate('emailExists'));
        } else {
          setAuthError(translate('unknownError'));
        }
      }
    }
  };
  
  // 切换模式
  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setFormData({
      email: '',
      password: '',
      confirmPassword: ''
    });
    setFormErrors({});
    setAuthError('');
    setFormSuccess('');
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative bg-surface-dark rounded-xl border border-border-dark w-full max-w-md" ref={modalRef}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">
              {mode === 'login' ? translate('login') : translate('register')}
            </h2>
            <button 
              className="text-text-secondary hover:text-white transition-colors"
              onClick={onClose}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          
          {authError && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm mb-4">
              {authError}
            </div>
          )}
          
          {formSuccess && (
            <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-sm mb-4">
              {formSuccess}
            </div>
          )}
          
          {/* 登录表单 */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  {translate('email')}
                </label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-background-dark border border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white"
                  placeholder={translate('email')}
                />
                {formErrors.email && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  {translate('password')}
                </label>
                <input 
                  type="password" 
                  name="password" 
                  value={formData.password} 
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-background-dark border border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white"
                  placeholder={translate('password')}
                />
                {formErrors.password && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.password}</p>
                )}
              </div>
              
              <div className="pt-2">
                <button 
                  type="submit"
                  className="w-full px-4 py-2 rounded-lg bg-primary text-sm font-medium text-white hover:bg-primary-hover transition-colors"
                >
                  {translate('login')}
                </button>
              </div>
            </form>
          )}
          
          {/* 注册表单 */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">

              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  {translate('email')}
                </label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-background-dark border border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white"
                  placeholder={translate('email')}
                />
                {formErrors.email && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  {translate('password')}
                </label>
                <input 
                  type="password" 
                  name="password" 
                  value={formData.password} 
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-background-dark border border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white"
                  placeholder={translate('password')}
                />
                {formErrors.password && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.password}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  {translate('confirmPassword')}
                </label>
                <input 
                  type="password" 
                  name="confirmPassword" 
                  value={formData.confirmPassword} 
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-background-dark border border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white"
                  placeholder={translate('confirmPassword')}
                />
                {formErrors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.confirmPassword}</p>
                )}
              </div>
              
              <div className="pt-2">
                <button 
                  type="submit"
                  className="w-full px-4 py-2 rounded-lg bg-primary text-sm font-medium text-white hover:bg-primary-hover transition-colors"
                >
                  {translate('register')}
                </button>
              </div>
            </form>
          )}
          
          {/* 切换登录/注册 */}
          <div className="mt-6 text-center">
            <p className="text-sm text-text-secondary">
              {mode === 'login' ? translate('noAccount') : translate('haveAccount')}
              <button 
                className="ml-1 text-primary hover:text-primary-hover font-medium transition-colors"
                onClick={toggleMode}
              >
                {mode === 'login' ? translate('register') : translate('login')}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
