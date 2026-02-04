import React, { useState, useEffect, useRef } from 'react';
import { CONSTANTS } from '../utils/constants';

const ProjectCard = ({ project, onSelect, onDelete, onRename, onDuplicate, language, translate }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newName, setNewName] = useState('');
  const menuRef = useRef(null);

  // 处理卡片点击
  const handleCardClick = () => {
    onSelect(project);
  };

  // 处理菜单点击
  const handleMenuClick = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  // 处理预览点击
  const handlePreviewClick = (e) => {
    e.stopPropagation();
    onSelect(project);
    setShowMenu(false);
  };

  // 处理删除点击
  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (confirm(translate('deleteProjectConfirm', { name: project.name }))) {
      onDelete(project.id);
      setShowMenu(false);
    }
  };

  // 处理重命名点击
  const handleRenameClick = (e) => {
    e.stopPropagation();
    setNewName(project.name);
    setShowRenameModal(true);
    setShowMenu(false);
  };

  // 处理重命名确认
  const handleRenameConfirm = () => {
    const name = newName.trim();
    
    if (name.length < CONSTANTS.VALIDATION.PROJECT_NAME_MIN_LENGTH) {
      alert(translate('projectNameTooShort'));
      return;
    }
    
    if (name.length > CONSTANTS.VALIDATION.PROJECT_NAME_MAX_LENGTH) {
      alert(translate('projectNameTooLong'));
      return;
    }
    
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(name)) {
      alert(translate('projectNameInvalidChars'));
      return;
    }
    
    onRename(project.id, name);
    setShowRenameModal(false);
  };

  // 处理重命名取消
  const handleRenameCancel = () => {
    setShowRenameModal(false);
    setNewName('');
  };

  // 处理复制点击
  const handleDuplicateClick = (e) => {
    e.stopPropagation();
    onDuplicate(project);
    setShowMenu(false);
  };

  // 点击外部区域关闭菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    // 添加事件监听器
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      // 移除事件监听器
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="group relative flex flex-col overflow-visible rounded-xl border border-border-dark bg-surface-dark transition-all hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 cursor-pointer" onClick={handleCardClick}>
      <div className="aspect-video w-full overflow-hidden rounded-t-xl bg-gray-900 relative">
        {/* HTML预览iframe */}
        <iframe
          className="w-full h-full object-cover"
          srcDoc={project.html}
          sandbox="allow-scripts allow-same-origin"
          title={`Preview of ${project.name}`}
        ></iframe>
        {/* 渐变遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-dark/90 to-transparent opacity-60 transition-transform duration-500 group-hover:scale-105"></div>
      </div>
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors truncate">{project.name}</h3>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-border-dark pt-3">
          <div className="text-xs text-text-secondary">
            {translate('lastEdited', { time: new Date(project.timestamp).toLocaleString() })}
          </div>
          <div className="relative group/menu" ref={menuRef}>
            <button className="flex items-center justify-center text-text-secondary hover:text-white transition-colors" onClick={handleMenuClick}>
              <span className="material-symbols-outlined text-[20px]">more_horiz</span>
            </button>
            <div className={`absolute left-0 bottom-full mb-2 hidden w-32 flex-col overflow-hidden rounded-lg border border-border-dark bg-background-dark py-1 shadow-xl z-10 ${showMenu ? 'block' : 'hidden'}`}>
              <button className="w-full px-4 py-2 text-left text-sm text-text-secondary hover:bg-surface-dark hover:text-white transition-colors" onClick={handlePreviewClick}>{translate('preview')}</button>
              <button className="w-full px-4 py-2 text-left text-sm text-text-secondary hover:bg-surface-dark hover:text-white transition-colors" onClick={handleRenameClick}>{translate('rename')}</button>
              <button className="w-full px-4 py-2 text-left text-sm text-text-secondary hover:bg-surface-dark hover:text-white transition-colors" onClick={handleDuplicateClick}>{translate('duplicate')}</button>
              <button className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-surface-dark hover:text-red-400 transition-colors" onClick={handleDeleteClick}>{translate('deleteProject')}</button>
            </div>
          </div>
        </div>
      </div>
      
      {/* 重命名弹窗 */}
      {showRenameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-background-dark border border-border-dark rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">{translate('renameProject')}</h2>
            <div className="mb-6">
              <label className="block text-sm font-medium text-text-secondary mb-2">{translate('projectName')}</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={translate('enterProjectName')}
                className="w-full px-4 py-2 rounded bg-surface-dark border border-border-dark text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button 
                className="px-4 py-2 rounded bg-surface-dark border border-border-dark text-text-secondary hover:text-white hover:border-primary transition-colors"
                onClick={handleRenameCancel}
              >
                {translate('cancel')}
              </button>
              <button 
                className="px-4 py-2 rounded bg-primary text-white hover:bg-primary-hover transition-colors"
                onClick={handleRenameConfirm}
              >
                {translate('save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectCard;