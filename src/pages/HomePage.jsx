import React, { useState, useRef } from 'react';
import ProjectCard from '../components/ProjectCard';
import { CONSTANTS } from '../utils/constants';

const HomePage = ({ projects, onProjectSelect, onNewProject, onProjectDelete, onProjectRename, onProjectDuplicate, onImportHtml, language, translate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('grid');
  const itemsPerPage = CONSTANTS.PAGINATION.ITEMS_PER_PAGE;
  const fileInputRef = useRef(null);

  // 过滤项目 - 搜索项目名称和HTML内容
  const filteredProjects = projects.filter(project => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    const nameMatch = project.name.toLowerCase().includes(query);
    const htmlMatch = project.html && project.html.toLowerCase().includes(query);
    
    return nameMatch || htmlMatch;
  });

  // 分页处理
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProjects = filteredProjects.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);

  // 处理分页切换
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // 处理HTML导入
  const handleImportHtml = () => {
    fileInputRef.current?.click();
  };

  // 处理文件选择
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const htmlContent = event.target.result;
      const fileName = file.name.replace(/\.html?$/i, '');
      onImportHtml(fileName, htmlContent);
    };
    reader.readAsText(file);
    
    e.target.value = '';
  };

  return (
    <main className="flex flex-1 justify-center py-8 px-4 md:px-8 lg:px-12">
      <div className="flex w-full max-w-[1200px] flex-col gap-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">{translate('yourProjects')}</h2>
          <p className="text-base text-text-secondary max-w-xl">
            {translate('manageProjects')}
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover hover:scale-[1.02] active:scale-[0.98]"
            onClick={onNewProject}
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            <span>{translate('newPreview')}</span>
          </button>
          <button 
            className="flex shrink-0 items-center justify-center gap-2 rounded-lg border border-border-dark bg-surface-dark px-5 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-background-dark hover:scale-[1.02] active:scale-[0.98]"
            onClick={handleImportHtml}
          >
            <span className="material-symbols-outlined text-[20px]">upload_file</span>
            <span>{translate('importHtml')}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".html,.htm"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 rounded-xl border border-border-dark bg-surface-dark p-2">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">search</span>
          <input 
            className="w-full rounded-lg bg-background-dark border-transparent py-2.5 pl-10 pr-4 text-sm text-white placeholder-text-secondary focus:border-primary focus:bg-background-dark focus:ring-0 transition-all"
            placeholder={translate('searchPlaceholder')}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between gap-2 px-1 sm:px-0">
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-sm font-medium text-text-secondary hover:bg-background-dark hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[18px]">filter_list</span>
              {translate('filter')}
            </button>
            <button className="flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-sm font-medium text-text-secondary hover:bg-background-dark hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[18px]">sort</span>
              {translate('sort')}
            </button>
          </div>
          <div className="h-4 w-px bg-border-dark hidden sm:block"></div>
          <div className="flex items-center gap-1">
            <button 
              className={`rounded-lg p-2 ${viewMode === 'grid' ? 'text-white bg-background-dark border border-border-dark' : 'text-text-secondary hover:bg-background-dark hover:text-white'} transition-colors`}
              onClick={() => setViewMode('grid')}
            >
              <span className="material-symbols-outlined text-[20px]">grid_view</span>
            </button>
            <button 
              className={`rounded-lg p-2 ${viewMode === 'list' ? 'text-white bg-background-dark border border-border-dark' : 'text-text-secondary hover:bg-background-dark hover:text-white'} transition-colors`}
              onClick={() => setViewMode('list')}
            >
              <span className="material-symbols-outlined text-[20px]">list</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* 项目卡片列表 */}
        {paginatedProjects.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            onSelect={onProjectSelect}
            onDelete={onProjectDelete}
            onRename={onProjectRename}
            onDuplicate={onProjectDuplicate}
            language={language}
            translate={translate}
          />
        ))}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border-dark pt-6 pb-8">
          <p className="text-sm text-text-secondary hidden sm:block">
            {translate('showingResults', { 
              start: startIndex + 1, 
              end: Math.min(endIndex, filteredProjects.length), 
              total: filteredProjects.length 
            })}
          </p>
          <div className="flex flex-1 justify-center sm:justify-end">
            <nav aria-label="Pagination" className="isolate inline-flex -space-x-px rounded-md shadow-sm">
              <button 
                className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-text-secondary ring-1 ring-inset ring-border-dark hover:bg-surface-dark focus:z-20 focus:outline-offset-0 ${currentPage === 1 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <span className="sr-only">Previous</span>
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  className={`relative ${currentPage === page ? 'z-10 bg-primary text-white' : 'text-text-secondary ring-1 ring-inset ring-border-dark hover:bg-surface-dark'} inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              ))}
              
              <button 
                className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-text-secondary ring-1 ring-inset ring-border-dark hover:bg-surface-dark focus:z-20 focus:outline-offset-0 ${currentPage === totalPages ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <span className="sr-only">Next</span>
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </nav>
          </div>
        </div>
      )}
      </div>
    </main>
  );
};

export default HomePage;