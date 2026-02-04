import React, { useState, useRef, useEffect } from 'react';

const Header = ({ currentPage, onBack, user, language, translate, onLanguageChange, onLogout, onLogin, onRegister, onAccountSettings }) => {
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'zh', name: '中文' }
  ];
  
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const avatarMenuRef = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(event.target)) {
        setShowAvatarMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleAccountSettingsClick = (e) => {
    e.stopPropagation();
    setShowAvatarMenu(false);
    onAccountSettings();
  };
  
  const handleLogoutClick = (e) => {
    e.stopPropagation();
    if (confirm(translate('logoutConfirm', { name: user?.name }))) {
      onLogout();
      setShowAvatarMenu(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border-dark bg-background-dark/80 backdrop-blur-md px-6 py-3">
      <button className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={onBack}>
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <span className="material-symbols-outlined text-[28px]">html</span>
        </div>
        <div>
          <h1 className="text-lg font-bold leading-tight tracking-tight text-white">HTML Previewer</h1>
          <p className="text-xs font-medium text-text-secondary">v2.4.0 • Enterprise</p>
        </div>
      </button>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          {/* 语言切换下拉菜单 */}
          <div className="relative">
            <button 
              className="flex items-center gap-2 rounded-lg border border-border-dark bg-surface-dark px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-white hover:border-primary/50 transition-colors"
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
            >
              <span className="material-symbols-outlined text-[16px]">language</span>
              {language === 'en' ? 'EN' : 'CN'}
            </button>
            {showLanguageMenu && (
              <div className="absolute right-0 mt-2 w-32 rounded-lg border border-border-dark bg-surface-dark shadow-lg py-1 z-50">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors ${language === lang.code ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:text-white'}`}
                    onClick={() => {
                      onLanguageChange(lang.code);
                      setShowLanguageMenu(false);
                    }}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* 用户已登录时显示头像菜单 */}
          {user ? (
            <div className="relative group/avatar" ref={avatarMenuRef}>
              <button 
                className="flex items-center gap-3 pl-2 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setShowAvatarMenu(!showAvatarMenu)}
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold leading-none text-white">{user?.name || 'Alex Morgan'}</p>
                  <p className="text-xs text-text-secondary mt-1">{user?.role === 'pro_member' ? translate('proMember') : translate('basicMember')}</p>
                </div>
                <div 
                  className="size-10 rounded-full bg-cover bg-center border-2 border-border-dark"
                  style={{ 
                    backgroundImage: user?.avatar ? `url(${user.avatar})` : 'url(https://lh3.googleusercontent.com/aida-public/AB6AXuCS24vxWPXzD_G0KUnuMI3WdLKwZBakFVRxYqgBIfjXqjf5dy-I9fDgjqFUtzn6aqjWbLgaVFEgCBm4bGyyL1ay9VHUyDQntZcQw35EkcJWOMqSYrJsHL566PFIy5WxaxCl5FgK6WD48Qn6pSdpLaa6k8zbjLIlycwHPJ1mQKocPiTCzpTSQwIg6vu42lIsKumqs6yznfE89bhjOQmdzw-n0n9nyeBP2ds9Ht3SFayEpmHNHiGLe7CGxuv4n4uZ4_uKo6vhuPDSlPo)' 
                  }}
                ></div>
                <span className="material-symbols-outlined text-text-secondary sm:hidden">expand_more</span>
              </button>
              
              {/* 头像菜单 */}
              {showAvatarMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg border border-border-dark bg-surface-dark shadow-xl py-1 z-50">
                  <button 
                    className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-background-dark hover:text-white transition-colors"
                    onClick={handleAccountSettingsClick}
                  >
                    <span className="material-symbols-outlined text-sm mr-2 inline-block">settings</span>
                    {translate('accountSettings')}
                  </button>
                  <button 
                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-background-dark hover:text-red-400 transition-colors"
                    onClick={handleLogoutClick}
                  >
                    <span className="material-symbols-outlined text-sm mr-2 inline-block">logout</span>
                    {translate('logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button 
                className="px-4 py-2 rounded-lg border border-border-dark bg-surface-dark text-sm font-medium text-text-secondary hover:text-white hover:border-primary/50 transition-colors"
                onClick={onLogin}
              >
                {translate('login')}
              </button>
              <button 
                className="px-4 py-2 rounded-lg bg-primary text-sm font-medium text-white hover:bg-primary-hover transition-colors"
                onClick={onRegister}
              >
                {translate('register')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;