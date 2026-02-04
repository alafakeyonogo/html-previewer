import React, { useState, useEffect, useRef, useCallback } from 'react';
import HTMLHistoryModal from '../components/HTMLHistoryModal';
import CodeMirrorEditor from '../components/CodeMirrorEditor';
import { CONSTANTS } from '../utils/constants';

const PreviewPage = ({ project, onSave, onBack, showModal, setShowModal, language, translate }) => {
  // 状态管理
  const [htmlContent, setHtmlContent] = useState('');
  const [projectName, setProjectName] = useState('');
  const [currentDevice, setCurrentDevice] = useState('web');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveModalName, setSaveModalName] = useState('');
  const [versions, setVersions] = useState([]);
  
  // 引用
  const editorScrollToLineRef = useRef(null);
  const previewFrameRef = useRef(null);

  // 初始化HTML内容
  useEffect(() => {
    if (project) {
      setHtmlContent(project.html);
      setProjectName(project.name || '');
      setVersions(project.versions || []);
    } else {
      setHtmlContent('');
      setProjectName('');
      setVersions([]);
    }
  }, [project]);

  // 更新预览
  useEffect(() => {
    if (previewFrameRef.current) {
      const previewDoc = previewFrameRef.current.contentDocument || previewFrameRef.current.contentWindow.document;
      previewDoc.open();
      previewDoc.write(htmlContent);
      previewDoc.close();
      
      // 添加双击事件监听器
      const handleDoubleClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // 获取被双击的元素
        const target = e.target;
        if (!target) return;
        
        // 获取元素的HTML
        const elementHtml = target.outerHTML;
        
        // 在代码中查找对应位置
        const codePosition = findCodePosition(elementHtml, target.tagName);
        
        if (codePosition !== -1) {
          // 滚动到该位置
          scrollToCodePosition(codePosition);
        }
      };
      
      // 移除旧的事件监听器
      const oldListener = previewDoc._doubleClickListener;
      if (oldListener) {
        previewDoc.removeEventListener('dblclick', oldListener);
      }
      
      // 添加新的事件监听器
      previewDoc._doubleClickListener = handleDoubleClick;
      previewDoc.addEventListener('dblclick', handleDoubleClick);
    }
  }, [htmlContent]);

  // 查找代码位置
  const findCodePosition = (elementHtml, tagName) => {
    // 移除多余空格和换行，但保留基本结构
    const normalizedHtml = elementHtml.replace(/\s+/g, ' ').trim();
    const normalizedContent = htmlContent.replace(/\s+/g, ' ');
    
    // 尝试直接匹配
    let index = normalizedContent.indexOf(normalizedHtml);
    
    // 如果直接匹配失败，尝试匹配标签开始位置
    if (index === -1) {
      // 提取标签的class和id属性
      const classMatch = elementHtml.match(/class=["']([^"']+)["']/);
      const idMatch = elementHtml.match(/id=["']([^"']+)["']/);
      
      let searchPattern = `<${tagName}`;
      
      if (idMatch) {
        searchPattern += `[^>]*id=["']${idMatch[1]}["']`;
      }
      
      if (classMatch) {
        searchPattern += `[^>]*class=["'][^"']*${classMatch[1]}[^"']*["']`;
      }
      
      searchPattern += '[^>]*>';
      
      const regex = new RegExp(searchPattern, 'i');
      const match = normalizedContent.match(regex);
      
      if (match) {
        // 在原始内容中找到对应位置
        index = htmlContent.indexOf(match[0]);
      }
    }
    
    return index;
  };

  // 滚动到代码位置
  const scrollToCodePosition = (position) => {
    if (!editorScrollToLineRef.current) return;
    
    // 计算行号
    const textBeforePosition = htmlContent.substring(0, position);
    const lineNumber = textBeforePosition.split('\n').length;
    
    // 使用CodeMirror的scrollToLine方法
    editorScrollToLineRef.current(lineNumber);
  };

  // 处理HTML内容变化
  const handleHtmlChange = (value) => {
    setHtmlContent(value);
  };

  // 处理设备切换
  const handleDeviceChange = (device) => {
    setCurrentDevice(device);
  };

  // 处理全屏切换
  const handleFullscreenToggle = () => {
    const elem = previewFrameRef.current;
    if (!isFullscreen) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  // 处理全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
      document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // 处理保存项目
  const handleSaveProject = () => {
    if (!htmlContent.trim()) {
      alert(translate('pleaseEnterHtml'));
      return;
    }

    // 自动生成项目名称
    const autoName = projectName.trim() || `Project ${new Date().toLocaleString()}`;
    
    // 设置弹窗中的项目名称并显示弹窗
    setSaveModalName(autoName);
    setShowSaveModal(true);
  };

  // 处理弹窗保存确认
  const handleSaveConfirm = () => {
    // 确保项目名称不为空
    const name = saveModalName.trim() || `Project ${new Date().toLocaleString()}`;
    
    // 验证项目名称
    if (name.length < CONSTANTS.VALIDATION.PROJECT_NAME_MIN_LENGTH) {
      alert(translate('projectNameTooShort'));
      return;
    }
    
    if (name.length > CONSTANTS.VALIDATION.PROJECT_NAME_MAX_LENGTH) {
      alert(translate('projectNameTooLong'));
      return;
    }
    
    // 检查特殊字符
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(name)) {
      alert(translate('projectNameInvalidChars'));
      return;
    }
    
    // 验证HTML内容大小
    if (htmlContent.length > CONSTANTS.VALIDATION.HTML_MAX_SIZE) {
      alert(translate('htmlContentTooLarge'));
      return;
    }
    
    // 准备新版本数据
    const newVersion = {
      id: Date.now(),
      html: htmlContent,
      timestamp: Date.now(),
      name: `Version ${(project?.versions?.length || 0) + 1}`
    };
    
    // 准备项目数据
    const projectData = {
      ...project,
      name: name,
      html: htmlContent,
      timestamp: Date.now(),
      versions: [
        newVersion,
        ...(project?.versions || [])
      ].slice(0, CONSTANTS.STORAGE.MAX_VERSIONS)
    };
    
    onSave(projectData);
    
    // 更新组件中的项目名称
    setProjectName(name);
    
    // 关闭弹窗并显示成功消息
    setShowSaveModal(false);
    alert('项目保存成功！');
  };

  // 处理弹窗取消
  const handleSaveCancel = () => {
    setShowSaveModal(false);
  };

  // 处理历史版本
  const handleShowHistory = () => {
    setShowHistoryModal(true);
  };

  // 处理下载HTML
  const handleDownloadHtml = () => {
    if (!htmlContent.trim()) {
      alert(translate('htmlEmpty'));
      return;
    }

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 处理清空HTML
  const handleClearHtml = () => {
    if (confirm(translate('clearConfirm'))) {
      setHtmlContent('');
    }
  };

  // 处理版本预览
  const handleVersionPreview = (version) => {
    setHtmlContent(version.html);
    setShowHistoryModal(false);
  };

  // 处理版本恢复
  const handleVersionRestore = (version) => {
    if (confirm(translate('restoreConfirm'))) {
      // 恢复选中的版本内容
      setHtmlContent(version.html);
      
      // 创建新版本记录（恢复操作也会创建新版本）
      const newVersion = {
        id: Date.now(),
        html: version.html,
        timestamp: Date.now(),
        name: `Version ${(project?.versions?.length || 0) + 1} (Restored from ${version.name})`
      };
      
      // 更新项目数据
      const updatedProject = {
        ...project,
        html: version.html,
        timestamp: Date.now(),
        versions: [
          newVersion,
          ...(project?.versions || [])
        ].slice(0, CONSTANTS.STORAGE.MAX_VERSIONS)
      };
      
      // 保存更新后的项目
      onSave(updatedProject);
      
      // 更新组件中的版本列表
      setVersions(updatedProject.versions);
      
      setShowHistoryModal(false);
      alert(translate('restoreSuccess'));
    }
  };

  const [isEditorCollapsed, setIsEditorCollapsed] = useState(false);

  const handleToggleEditor = () => {
    console.log('Toggle editor:', !isEditorCollapsed);
    setIsEditorCollapsed(!isEditorCollapsed);
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display h-screen flex flex-col overflow-hidden text-slate-900 dark:text-white antialiased">
      {/* 历史版本模态框 */}
      {showHistoryModal && (
        <HTMLHistoryModal
          versions={versions}
          onPreview={handleVersionPreview}
          onRestore={handleVersionRestore}
          onClose={() => setShowHistoryModal(false)}
          language={language}
          translate={translate}
        />
      )}
      
      {/* 保存项目弹窗 */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-background-dark border border-border-dark rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">{translate('saveProjectTitle')}</h2>
            <p className="text-text-secondary mb-4">
              {project ? translate('projectExists', { id: project.id }) : translate('newProject')}
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-text-secondary mb-2">{translate('projectName')}</label>
              <input
                type="text"
                value={saveModalName}
                onChange={(e) => setSaveModalName(e.target.value)}
                placeholder={translate('enterProjectName')}
                className="w-full px-4 py-2 rounded bg-surface-dark border border-border-dark text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button 
                className="px-4 py-2 rounded bg-surface-dark border border-border-dark text-text-secondary hover:text-white hover:border-primary transition-colors"
                onClick={handleSaveCancel}
              >
                {translate('cancel')}
              </button>
              <button 
                className="px-4 py-2 rounded bg-primary text-white hover:bg-primary-hover transition-colors"
                onClick={handleSaveConfirm}
              >
                {translate('save')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-1 overflow-hidden relative">
        {/* 编辑器区域 */}
        <aside 
          className={`flex flex-col ${isEditorCollapsed ? 'w-0' : 'w-[450px]'} border-r border-gray-200 dark:border-border-dark bg-white dark:bg-background-dark relative shrink-0 transition-all duration-300 ease-in-out overflow-hidden`}
          style={{ opacity: isEditorCollapsed ? 0 : 1 }}
        >
          <div className="flex flex-col gap-2 px-4 py-2 border-b border-gray-200 dark:border-border-dark bg-gray-50/50 dark:bg-surface-dark">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">{translate('editor')}</h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400">index.html</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder={translate('enterProjectName')}
                className="flex-1 px-3 py-1.5 rounded bg-white dark:bg-background-dark border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <div className="flex gap-1">
                <button 
                  className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors group relative"
                  title={translate('historyVersions')}
                  onClick={handleShowHistory}
                >
                  <span className="material-symbols-outlined text-[20px]">history</span>
                </button>
                <button 
                  className="p-1.5 rounded-md text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/10 transition-colors"
                  title={translate('downloadHtml')}
                  onClick={handleDownloadHtml}
                >
                  <span className="material-symbols-outlined text-[20px]">download</span>
                </button>
                <div className="w-px h-5 bg-gray-300 dark:bg-gray-700 mx-1 self-center"></div>
                <button 
                  className="p-1.5 rounded-md text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title={translate('clearAll')}
                  onClick={handleClearHtml}
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex-1 relative bg-editor-bg group/code overflow-hidden">
            <CodeMirrorEditor
              value={htmlContent}
              onChange={handleHtmlChange}
              onScrollToLine={(scrollToLine) => {
                editorScrollToLineRef.current = scrollToLine;
              }}
              theme="dark"
            />
          </div>
          
          <div className="bg-gray-50 dark:bg-surface-dark border-t border-gray-200 dark:border-border-dark p-3 overflow-hidden whitespace-nowrap">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mr-1">{translate('insert')}</span>
              <button className="h-7 px-3 rounded bg-white dark:bg-background-dark border border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary text-xs font-mono text-gray-600 dark:text-gray-300 transition-colors">&lt;div&gt;</button>
              <button className="h-7 px-3 rounded bg-white dark:bg-background-dark border border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary text-xs font-mono text-gray-600 dark:text-gray-300 transition-colors">&lt;span&gt;</button>
              <button className="h-7 px-3 rounded bg-white dark:bg-background-dark border border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary text-xs font-mono text-gray-600 dark:text-gray-300 transition-colors">&lt;img /&gt;</button>
              <button className="h-7 px-3 rounded bg-white dark:bg-background-dark border border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary text-xs font-mono text-gray-600 dark:text-gray-300 transition-colors">&lt;a&gt;</button>
              <button className="h-7 px-3 rounded bg-white dark:bg-background-dark border border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary text-xs font-mono text-gray-600 dark:text-gray-300 transition-colors">&lt;button&gt;</button>
              <button className="h-7 px-3 rounded bg-white dark:bg-background-dark border border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary text-xs font-mono text-gray-600 dark:text-gray-300 transition-colors">&lt;ul&gt;</button>
            </div>
          </div>
        </aside>
        
        {/* 编辑器折叠按钮 */}
        <button 
          className={`absolute z-50 top-1/2 -translate-y-1/2 ${isEditorCollapsed ? 'left-4' : 'left-[450px]'} -translate-x-1/2 cursor-pointer transition-all duration-300 ease-in-out`}
          onClick={handleToggleEditor}
          aria-label={isEditorCollapsed ? 'Expand Editor' : 'Collapse Editor'}
        >
          <div className="size-8 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-md text-gray-500 hover:text-primary transition-colors hover:scale-110">
            <span className="material-symbols-outlined text-[20px] transition-all duration-300">{isEditorCollapsed ? 'chevron_right' : 'chevron_left'}</span>
          </div>
        </button>
        
        {/* 预览区域 */}
        <main className="flex-1 flex flex-col bg-gray-100 dark:bg-[#0c0e12] relative overflow-hidden">
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-border-dark/50 bg-white dark:bg-background-dark">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{translate('previewMode')}</span>
              <div className="flex bg-white dark:bg-surface-dark rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-700">
                <button 
                  className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${currentDevice === 'mobile' ? 'bg-primary/10 text-primary dark:text-primary' : 'text-gray-500 dark:text-gray-400'}`}
                  onClick={() => handleDeviceChange('mobile')}
                  title={translate('mobileView')}
                >
                  <span className="material-symbols-outlined text-[20px]">smartphone</span>
                </button>
                <button 
                  className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${currentDevice === 'tablet' ? 'bg-primary/10 text-primary dark:text-primary' : 'text-gray-500 dark:text-gray-400'}`}
                  onClick={() => handleDeviceChange('tablet')}
                  title={translate('tabletView')}
                >
                  <span className="material-symbols-outlined text-[20px]">tablet</span>
                </button>
                <button 
                  className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${currentDevice === 'web' ? 'bg-primary/10 text-primary dark:text-primary' : 'text-gray-500 dark:text-gray-400'}`}
                  onClick={() => handleDeviceChange('web')}
                  title={translate('desktopView')}
                >
                  <span className="material-symbols-outlined text-[20px]">desktop_windows</span>
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                onClick={onBack}
                title={translate('backToHome')}
              >
                <span className="material-symbols-outlined text-[18px] mr-2">home</span>
                <span>{translate('backToHome')}</span>
              </button>
              <button 
                className="save-project-btn flex items-center gap-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary-hover transition-colors font-medium shadow-sm shadow-blue-900/20"
                onClick={handleSaveProject}
              >
                <span className="material-symbols-outlined text-[18px] mr-2">save</span>
                <span>{translate('saveProject')}</span>
              </button>
              <button 
                className="p-1.5 rounded-lg bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-primary transition-colors"
                onClick={handleFullscreenToggle}
                title={isFullscreen ? translate('exitFullscreen') : translate('fullscreen')}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
                </span>
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto relative bg-white dark:bg-background-dark w-full h-full">
            <div className={`w-full h-full min-h-full flex flex-col items-center justify-center bg-slate-50 text-center p-12`}>
              <iframe
                ref={previewFrameRef}
                id="previewFrame"
                sandbox="allow-scripts allow-same-origin"
                className={`w-full h-full bg-white ${currentDevice === 'mobile' ? 'max-w-[324px] h-[720px] border border-border-dark rounded-[20px] mx-auto my-5 shadow-lg' : currentDevice === 'tablet' ? 'max-w-[810px] h-[1080px] border border-border-dark rounded-[16px] mx-auto my-5 shadow-lg' : 'shadow-sm'}`}
              ></iframe>
            </div>
            <div className="absolute bottom-4 right-6 bg-black/75 backdrop-blur-sm text-white text-[10px] font-mono px-2 py-1 rounded pointer-events-none z-10">
              1920 x 1080
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PreviewPage;