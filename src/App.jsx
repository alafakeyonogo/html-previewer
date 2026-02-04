import { useState, useEffect } from 'react';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import PreviewPage from './pages/PreviewPage';
import AuthModal from './components/AuthModal';
import AccountSettingsModal from './components/AccountSettingsModal';
import { translate, translations } from './utils/i18n';
import { getCurrentUser, logoutUser, loginUser, registerUser } from './utils/auth';
import { CONSTANTS } from './utils/constants';
import { safeGetItem, safeSetItem, safeGetJSON, safeSetJSON } from './utils/storage';

function App() {
  // 状态管理
  const [currentPage, setCurrentPage] = useState(() => {
    try {
      const savedPage = safeGetItem('html_preview_current_page', null);
      // 验证保存的页面是否为有效值
      return ['home', 'preview'].includes(savedPage) ? savedPage : 'home';
    } catch (error) {
      return 'home';
    }
  });
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(() => {
    try {
      const savedProject = safeGetJSON('html_preview_selected_project', null);
      return savedProject;
    } catch (error) {
      return null;
    }
  });
  const [showModal, setShowModal] = useState(false);
  const [user, setUser] = useState(null);
  const [language, setLanguage] = useState('en');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [showAccountSettings, setShowAccountSettings] = useState(false);

  // 初始化语言偏好
  useEffect(() => {
    try {
      // 从localStorage获取语言偏好
      const savedLanguage = safeGetItem('html_preview_language', null);
      if (savedLanguage) {
        setLanguage(savedLanguage);
        document.documentElement.lang = savedLanguage;
      } else {
        // 使用浏览器首选语言列表中的第一个支持的语言
        let preferredLanguage = 'en';
        if (navigator.languages) {
          for (const lang of navigator.languages) {
            const code = lang.split('-')[0];
            if (translations[code]) {
              preferredLanguage = code;
              break;
            }
          }
        } else {
          const browserLanguage = navigator.language?.split('-')[0] || 'en';
          preferredLanguage = translations[browserLanguage] ? browserLanguage : 'en';
        }
        setLanguage(preferredLanguage);
        document.documentElement.lang = preferredLanguage;
      }
    } catch (error) {
      console.error('Error loading language preference:', error);
    }
  }, []);

  // 保存语言偏好到localStorage并更新文档语言
  useEffect(() => {
    try {
      document.documentElement.lang = language;
      const result = safeSetItem('html_preview_language', language);
      if (!result.success) {
        console.error('Failed to save language preference:', result.error);
      }
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  }, [language]);

  // 保存当前页面到localStorage
  useEffect(() => {
    try {
      // 仅保存有效值到localStorage
      if (['home', 'preview'].includes(currentPage)) {
        const result = safeSetItem('html_preview_current_page', currentPage);
        if (!result.success) {
          console.error('Failed to save current page:', result.error);
        }
      }
    } catch (error) {
      console.error('Error saving current page:', error);
    }
  }, [currentPage]);

  // 保存选中的项目到localStorage
  useEffect(() => {
    try {
      const result = safeSetJSON('html_preview_selected_project', selectedProject);
      if (!result.success) {
        console.error('Failed to save selected project:', result.error);
      }
    } catch (error) {
      console.error('Error saving selected project:', error);
    }
  }, [selectedProject]);

  // 切换语言
  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
  };

  // 处理注册和登录
  const handleLogin = (email, password) => {
    const result = loginUser(email, password);
    if (result.success) {
      handleLoginSuccess(result.user);
      handleCloseAuthModal();
      return { success: true };
    } else {
      return { success: false, error: translate(result.error, language) };
    }
  };

  const handleRegister = (email, password, name) => {
    const result = registerUser(email, password, name);
    if (result.success) {
      handleRegisterSuccess(result.user);
      handleCloseAuthModal();
      return { success: true };
    } else {
      return { success: false, error: translate(result.error, language) };
    }
  };

  const handleLogout = () => {
    const result = logoutUser();
    if (result.success) {
      setUser(null);
      setProjects([]);
      setCurrentPage('home');
      setSelectedProject(null);
    }
  };

  // Auth Modal 处理函数
  const handleOpenLoginModal = () => {
    setAuthModalMode('login');
    setShowAuthModal(true);
  };

  const handleOpenRegisterModal = () => {
    setAuthModalMode('register');
    setShowAuthModal(true);
  };

  const handleCloseAuthModal = () => {
    setShowAuthModal(false);
  };

  const handleLoginSuccess = (user) => {
    setUser(user);
    // 登录成功后加载用户的项目
    try {
      const storedProjects = safeGetJSON('html_preview_history', []);
      const userProjects = storedProjects.filter(project => project.userId === user.id);
      setProjects(userProjects);
    } catch (error) {
      console.error('Error loading projects after login:', error);
      setProjects([]);
    }
  };

  const handleRegisterSuccess = (user) => {
    setUser(user);
    // 注册成功后初始化为空项目列表
    setProjects([]);
  };

  const handleOpenAccountSettings = () => {
    setShowAccountSettings(true);
  };

  const handleCloseAccountSettings = () => {
    setShowAccountSettings(false);
  };

  // 初始化用户数据
  useEffect(() => {
    try {
      // 使用auth.js中的getCurrentUser函数获取用户
      const currentUser = getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error loading user:', error);
      setUser(null);
    }
  }, []);

  // 初始化项目数据 - 仅在用户数据加载完成后执行
  useEffect(() => {
    if (!user) {
      setProjects([]);
      return;
    }
    
    try {
      // 从localStorage加载项目数据
      const storedProjects = safeGetJSON('html_preview_history', []);
      // 过滤出当前用户的项目
      const userProjects = storedProjects.filter(project => project.userId === user.id);
      setProjects(userProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
      // 出错时使用空数组作为安全回退
      setProjects([]);
    }
  }, [user]);

  // 保存项目到localStorage - 仅保存当前用户的项目
  useEffect(() => {
    if (!user) return;
    
    try {
      // 先获取所有项目
      const allProjects = safeGetJSON('html_preview_history', []);
      // 移除当前用户的旧项目
      const otherUsersProjects = allProjects.filter(project => project.userId !== user.id);
      // Deduplicate user projects by ID to prevent duplicates
      const uniqueUserProjects = Array.from(new Map(projects.map(p => [p.id, p])).values());
      // 合并当前用户的项目和其他用户的项目
      const updatedProjects = [...otherUsersProjects, ...uniqueUserProjects];
      // 保存到localStorage
      const result = safeSetJSON('html_preview_history', updatedProjects);
      if (!result.success) {
        console.error('Failed to save projects:', result.error);
      }
    } catch (error) {
      console.error('Error saving projects:', error);
    }
  }, [projects, user]);

  // 处理新建项目
  const handleNewProject = () => {
    setSelectedProject(null);
    setCurrentPage('preview');
  };

  // 处理项目选择
  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    setCurrentPage('preview');
  };

  // 处理项目保存
  const handleProjectSave = (projectData) => {
    if (!user) return;
    
    if (projectData.id) {
      // 更新现有项目
      setProjects(prevProjects => {
        return prevProjects.map(project => 
          project.id === projectData.id && project.userId === user.id ? { ...project, ...projectData, timestamp: Date.now() } : project
        );
      });
    } else {
      // 创建新项目
      const newProject = {
        ...projectData,
        id: Date.now() + Math.random(), // 添加随机数减少ID冲突
        timestamp: Date.now(),
        versions: [],
        userId: user.id // 关联当前用户ID
      };
      setProjects(prevProjects => [newProject, ...prevProjects]);
      setSelectedProject(newProject);
    }
  };

  // 处理项目删除
  const handleProjectDelete = (id) => {
    setProjects(prevProjects => prevProjects.filter(project => project.id !== id && project.userId === user?.id));
  };

  // 处理项目重命名
  const handleProjectRename = (id, newName) => {
    setProjects(prevProjects => {
      return prevProjects.map(project => 
        project.id === id && project.userId === user?.id ? { ...project, name: newName, timestamp: Date.now() } : project
      );
    });
  };

  // 处理项目复制
  const handleProjectDuplicate = (project) => {
    const duplicatedProject = {
      ...project,
      id: Date.now() + Math.random(),
      name: `${project.name} (Copy)`,
      timestamp: Date.now(),
      versions: []
    };
    setProjects(prevProjects => [duplicatedProject, ...prevProjects]);
  };

  // 处理HTML导入
  const handleImportHtml = (fileName, htmlContent) => {
    if (!user) return;
    
    // 验证HTML内容大小
    if (htmlContent.length > CONSTANTS.VALIDATION.HTML_MAX_SIZE) {
      alert(translate('htmlContentTooLarge', language));
      return;
    }
    
    // 验证文件名
    if (fileName.length < CONSTANTS.VALIDATION.PROJECT_NAME_MIN_LENGTH) {
      alert(translate('projectNameTooShort', language));
      return;
    }
    
    if (fileName.length > CONSTANTS.VALIDATION.PROJECT_NAME_MAX_LENGTH) {
      alert(translate('projectNameTooLong', language));
      return;
    }
    
    const invalidChars = /[<>:\"/\\|?*]/;
    if (invalidChars.test(fileName)) {
      alert(translate('projectNameInvalidChars', language));
      return;
    }
    
    // 创建新项目
    const newProject = {
      id: Date.now() + Math.random(),
      name: fileName,
      html: htmlContent,
      timestamp: Date.now(),
      versions: [],
      userId: user.id
    };
    
    setProjects(prevProjects => [newProject, ...prevProjects]);
  };

  // 渲染页面
  const renderPage = () => {
    // 只显示当前用户的项目
    const userProjects = user ? projects.filter(project => project.userId === user.id) : [];
    
    switch (currentPage) {
      case 'preview':
        return (
          <PreviewPage
            project={selectedProject}
            onSave={handleProjectSave}
            onBack={() => setCurrentPage('home')}
            showModal={showModal}
            setShowModal={setShowModal}
            language={language}
            translate={(key, variables) => translate(key, language, variables)}
          />
        );
      case 'home':
            default:
              return (
                <HomePage
                  projects={userProjects}
                  onProjectSelect={handleProjectSelect}
                  onNewProject={handleNewProject}
                  onProjectDelete={handleProjectDelete}
                  onProjectRename={handleProjectRename}
                  onProjectDuplicate={handleProjectDuplicate}
                  onImportHtml={handleImportHtml}
                  language={language}
                  translate={(key, variables) => translate(key, language, variables)}
                />
              );
    }
  };

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display text-white overflow-x-hidden antialiased">
      <Header
        currentPage={currentPage}
        onBack={() => setCurrentPage('home')}
        user={user}
        language={language}
        translate={(key, variables) => translate(key, language, variables)}
        onLanguageChange={handleLanguageChange}
        onLogout={handleLogout}
        onLogin={handleOpenLoginModal}
        onRegister={handleOpenRegisterModal}
        onAccountSettings={handleOpenAccountSettings}
      />
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={handleCloseAuthModal} 
        onLoginSuccess={handleLoginSuccess} 
        onRegisterSuccess={handleRegisterSuccess}
        initialMode={authModalMode}
        language={language}
        translate={(key, variables) => translate(key, language, variables)}
      />
      <AccountSettingsModal 
        isOpen={showAccountSettings} 
        onClose={handleCloseAccountSettings} 
        user={user}
        language={language}
        translate={(key, variables) => translate(key, language, variables)}
      />
      {renderPage()}
    </div>
  );
}

export default App;