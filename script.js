// HTML预览器核心功能
class HTMLPreviewer {
    constructor() {
        this.historyKey = 'html_preview_history';
        this.maxHistoryItems = 20;
        this.currentLanguage = 'zh';
        this.currentDevice = 'web';
        this.isFullscreen = false;
    }
    
    // 初始化应用
    init() {
        // 检查当前页面
        if (window.location.pathname.includes('preview.html')) {
            this.initPreview();
        } else if (window.location.pathname.includes('history.html')) {
            this.initHistory();
        } else {
            this.initHome();
        }
    }
    
    // 初始化首页
    initHome() {
        // 加载历史记录
        this.loadProjects();
        
        // 绑定事件
        this.bindHomeEvents();
    }
    
    // 初始化历史记录页面
    initHistory() {
        // 加载历史记录
        this.loadHistory();
        
        // 绑定事件
        this.bindHistoryEvents();
    }
    
    // 初始化预览页面
    initPreview() {
        // 初始化实时预览
        this.initRealTimePreview();
        
        // 绑定事件
        this.bindPreviewEvents();
        
        // 从URL获取项目ID
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('id');
        
        if (projectId) {
            // 如果有项目ID，加载对应的HTML代码
            this.loadProject(projectId);
        } else {
            // 否则初始加载空白预览 - 清空textarea内容
            const htmlEditor = Array.from(document.querySelectorAll('textarea')).find(textarea => textarea.placeholder === '<!-- Start typing your HTML here... -->');
            if (htmlEditor) {
                htmlEditor.value = '';
                this.updatePreview();
            }
        }
    }
    
    // 加载项目
    loadProject(id) {
        const history = this.getHistory();
        const project = history.find(p => p.id == id);
        if (project) {
            // 找到项目，加载HTML代码
            const htmlEditor = document.getElementById('htmlEditor');
            if (htmlEditor) {
                htmlEditor.value = project.html;
                this.updatePreview();
                this.updateLineNumbers();
            }
        } else {
            // 未找到项目，显示错误信息
            alert('项目未找到！');
        }
    }
    
    // 绑定首页事件
    bindHomeEvents() {
        // 新建预览按钮
        const newPreviewBtn = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('New Preview'));
        if (newPreviewBtn) {
            newPreviewBtn.addEventListener('click', () => {
                window.location.href = 'preview.html';
            });
        }
        
        // 为硬编码的项目卡片添加点击事件
        const projectCards = document.querySelectorAll('.group.relative');
        projectCards.forEach((card, index) => {
            // 为卡片添加点击事件（简化版，移除条件判断）
            card.addEventListener('click', (e) => {
                // 简单版本：直接跳转到预览页，不进行任何条件判断
                window.location.href = `preview.html?id=${index + 1}`;
            });
            
            // 为菜单按钮添加点击事件，防止事件冒泡
            const menuButton = card.querySelector('.relative button');
            if (menuButton) {
                menuButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                });
            }
            
            // 为菜单中的预览按钮添加点击事件
            const menuDropdown = card.querySelector('.absolute.left-0.bottom-full');
            if (menuDropdown) {
                const previewBtn = menuDropdown.querySelector('button:first-child');
                if (previewBtn) {
                    previewBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        // 使用索引作为项目ID，实际项目中应该使用真实的ID
                        window.location.href = `preview.html?id=${index + 1}`;
                    });
                }
            }
        });
        
        // 搜索功能
        const searchInput = document.querySelector('.search-box input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchProjects(e.target.value);
            });
        }
        
        // 筛选功能
        const filterBtn = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('Filter'));
        if (filterBtn) {
            filterBtn.addEventListener('click', () => {
                this.showFilterOptions();
            });
        }
        
        // 排序功能
        const sortBtn = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('Sort'));
        if (sortBtn) {
            sortBtn.addEventListener('click', () => {
                this.showSortOptions();
            });
        }
        
        // 视图切换功能
        const gridViewBtn = document.querySelector('.view-btn.grid-view');
        const listViewBtn = document.querySelector('.view-btn.list-view');
        if (gridViewBtn) {
            gridViewBtn.addEventListener('click', () => {
                this.switchView('grid');
            });
        }
        if (listViewBtn) {
            listViewBtn.addEventListener('click', () => {
                this.switchView('list');
            });
        }
        
        // 分页功能
        const paginationBtns = document.querySelectorAll('.pagination-btn');
        paginationBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchPage(btn.textContent);
            });
        });
    }
    
    // 绑定历史记录页面事件
    bindHistoryEvents() {
        // 清空所有记录按钮
        const clearAllBtn = document.getElementById('clearAllBtn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                if (confirm('确定要清空所有历史记录吗？')) {
                    this.clearAllHistory();
                }
            });
        }
    }
    
    // 搜索项目
    searchProjects(keyword) {
        const projectCards = document.querySelectorAll('.group.relative');
        projectCards.forEach(card => {
            const projectName = card.querySelector('h3');
            if (projectName) {
                if (projectName.textContent.toLowerCase().includes(keyword.toLowerCase())) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            }
        });
    }
    
    // 显示筛选选项
    showFilterOptions() {
        alert('筛选功能已点击');
    }
    
    // 显示排序选项
    showSortOptions() {
        alert('排序功能已点击');
    }
    
    // 切换视图（网格视图/列表视图）
    switchView(view) {
        const gridViewBtn = document.querySelector('.view-btn.grid-view');
        const listViewBtn = document.querySelector('.view-btn.list-view');
        const projectsGrid = document.querySelector('.grid[class*="grid-cols-"]');
        
        if (view === 'grid') {
            // 切换到网格视图
            gridViewBtn.classList.add('active');
            listViewBtn.classList.remove('active');
            projectsGrid.className = 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3';
        } else {
            // 切换到列表视图
            gridViewBtn.classList.remove('active');
            listViewBtn.classList.add('active');
            projectsGrid.className = 'grid grid-cols-1 gap-6';
        }
    }
    
    // 切换分页
    switchPage(pageNumber) {
        const paginationBtns = document.querySelectorAll('.pagination-btn');
        paginationBtns.forEach(btn => {
            btn.classList.remove('active');
        });
        const currentBtn = Array.from(paginationBtns).find(btn => btn.textContent === pageNumber);
        if (currentBtn) {
            currentBtn.classList.add('active');
        }
        alert(`切换到第 ${pageNumber} 页`);
    }
    
    // 绑定预览页面事件
    bindPreviewEvents() {
        // 返回首页按钮
        const backHomeBtn = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('Back to Home'));
        if (backHomeBtn) {
            backHomeBtn.addEventListener('click', () => {
                window.location.href = 'index.html';
            });
        }
        
        // 保存项目按钮
        const saveProjectBtn = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('Save Project'));
        if (saveProjectBtn) {
            saveProjectBtn.addEventListener('click', () => {
                this.saveProject();
            });
        }
        
        // 清空按钮
        const clearBtn = Array.from(document.querySelectorAll('button')).find(btn => {
            const icon = btn.querySelector('.material-symbols-outlined');
            return icon && icon.textContent === 'delete';
        });
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('确定要清空编辑器内容吗？')) {
                    const htmlEditor = document.getElementById('htmlEditor');
                    if (htmlEditor) {
                        htmlEditor.value = '';
                        this.updatePreview();
                        this.updateLineNumbers();
                    }
                }
            });
        }
        
        // 下载按钮
        const downloadBtn = Array.from(document.querySelectorAll('button')).find(btn => {
            const icon = btn.querySelector('.material-symbols-outlined');
            return icon && icon.textContent === 'download';
        });
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                this.downloadHTML();
            });
        }
        
        // 历史版本按钮
        const historyBtn = Array.from(document.querySelectorAll('button')).find(btn => {
            const icon = btn.querySelector('.material-symbols-outlined');
            return icon && icon.textContent === 'history';
        });
        if (historyBtn) {
            historyBtn.addEventListener('click', () => {
                this.showHistoryVersions();
            });
        }
        
        // 设备切换
        const smartphoneBtn = Array.from(document.querySelectorAll('button')).find(btn => {
            const icon = btn.querySelector('.material-symbols-outlined');
            return icon && icon.textContent === 'smartphone';
        });
        const tabletBtn = Array.from(document.querySelectorAll('button')).find(btn => {
            const icon = btn.querySelector('.material-symbols-outlined');
            return icon && icon.textContent === 'tablet';
        });
        const desktopBtn = Array.from(document.querySelectorAll('button')).find(btn => {
            const icon = btn.querySelector('.material-symbols-outlined');
            return icon && icon.textContent === 'desktop_windows';
        });
        
        if (smartphoneBtn) {
            smartphoneBtn.addEventListener('click', () => {
                this.switchDevice('mobile');
            });
        }
        if (tabletBtn) {
            tabletBtn.addEventListener('click', () => {
                this.switchDevice('tablet');
            });
        }
        if (desktopBtn) {
            desktopBtn.addEventListener('click', () => {
                this.switchDevice('web');
            });
        }
        
        // 全屏按钮
        const fullscreenBtn = Array.from(document.querySelectorAll('button')).find(btn => {
            const icon = btn.querySelector('.material-symbols-outlined');
            return icon && icon.textContent === 'fullscreen';
        });
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                this.toggleFullscreen();
            });
        }
        
        // 侧边栏折叠功能
        const sidebarToggle = document.getElementById('sidebar-toggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('change', () => {
                this.toggleSidebar();
            });
        }
    }
    
    // 切换侧边栏
    toggleSidebar() {
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const aside = document.querySelector('aside');
        const label = document.querySelector('label[for="sidebar-toggle"]');
        
        if (sidebarToggle && aside && label) {
            if (sidebarToggle.checked) {
                // 折叠侧边栏
                aside.classList.add('peer-checked:w-0', 'peer-checked:opacity-0', 'peer-checked:overflow-hidden');
                label.classList.add('peer-checked:left-4', 'peer-checked:translate-x-0');
            } else {
                // 展开侧边栏
                aside.classList.remove('peer-checked:w-0', 'peer-checked:opacity-0', 'peer-checked:overflow-hidden');
                label.classList.remove('peer-checked:left-4', 'peer-checked:translate-x-0');
            }
        }
    }
    
    // 更新行号
    updateLineNumbers() {
        const htmlEditor = document.getElementById('htmlEditor');
        const lineNumbers = document.getElementById('lineNumbers');
        
        if (htmlEditor && lineNumbers) {
            const lines = htmlEditor.value.split('\n').length;
            let lineNumberHtml = '';
            
            for (let i = 1; i <= lines; i++) {
                lineNumberHtml += `${i}<br/>`;
            }
            
            lineNumbers.innerHTML = lineNumberHtml;
        }
    }
    
    // 初始化实时预览
    initRealTimePreview() {
        const htmlEditor = document.getElementById('htmlEditor');
        if (htmlEditor) {
            // 更新行号
            htmlEditor.addEventListener('input', () => {
                this.updatePreview();
                this.updateLineNumbers();
            });
            
            // 初始化行号
            this.updateLineNumbers();
        }
    }
    
    // 更新预览
    updatePreview() {
        const htmlEditor = document.getElementById('htmlEditor');
        const previewFrame = document.getElementById('previewFrame');
        if (htmlEditor && previewFrame) {
            const html = htmlEditor.value;
            const previewDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
            previewDoc.open();
            previewDoc.write(html);
            previewDoc.close();
        }
    }
    
    // 切换设备预览
    switchDevice(device) {
        this.currentDevice = device;
        
        // 更新按钮状态
        const deviceBtns = document.querySelectorAll('.device-btn');
        deviceBtns.forEach(btn => {
            btn.classList.remove('active');
            btn.classList.remove('bg-primary/10', 'text-primary', 'shadow-sm');
        });
        const activeBtn = document.querySelector(`[data-device="${device}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
            activeBtn.classList.add('bg-primary/10', 'text-primary', 'shadow-sm');
        }
        
        // 更新预览内容样式
        const previewContent = document.getElementById('previewContent');
        const resolutionDisplay = document.querySelector('.absolute.bottom-4.right-6');
        
        if (previewContent) {
            // 移除所有设备类
            previewContent.classList.remove('mobile', 'tablet', 'web');
            // 添加当前设备类
            previewContent.classList.add(device);
            
            // 更新分辨率显示
            if (resolutionDisplay) {
                if (device === 'mobile') {
                    resolutionDisplay.textContent = '375 x 812';
                } else if (device === 'tablet') {
                    resolutionDisplay.textContent = '768 x 1024';
                } else {
                    resolutionDisplay.textContent = '1920 x 1080';
                }
            }
        }
    }
    
    // 切换全屏
    toggleFullscreen() {
        const previewContent = document.getElementById('previewContent');
        const fullscreenBtn = document.querySelector('[title="Fullscreen"]');
        const icon = fullscreenBtn.querySelector('.material-symbols-outlined');
        
        if (!document.fullscreenElement) {
            // 进入全屏模式
            if (previewContent.requestFullscreen) {
                previewContent.requestFullscreen();
            } else if (previewContent.webkitRequestFullscreen) {
                previewContent.webkitRequestFullscreen();
            } else if (previewContent.msRequestFullscreen) {
                previewContent.msRequestFullscreen();
            }
            
            // 更新按钮图标
            if (icon) {
                icon.textContent = 'fullscreen_exit';
            }
        } else {
            // 退出全屏模式
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            
            // 更新按钮图标
            if (icon) {
                icon.textContent = 'fullscreen';
            }
        }
    }
    
    // 保存项目
    saveProject() {
        const htmlEditor = document.getElementById('htmlEditor');
        if (htmlEditor) {
            const html = htmlEditor.value;
            if (!html.trim()) {
                alert('请先输入HTML代码！');
                return;
            }
            
            // 从URL获取项目ID
            const urlParams = new URLSearchParams(window.location.search);
            let projectId = urlParams.get('id');
            
            // 获取当前历史记录
            const history = this.getHistory();
            let projectIndex = -1;
            let existingProject = null;
            
            if (projectId) {
                // 查找现有项目
                projectIndex = history.findIndex(p => p.id == projectId);
                existingProject = history[projectIndex];
            }
            
            let projectName = existingProject ? existingProject.name : `项目 ${Date.now().toString().slice(-4)}`;
            
            // 显示确认消息
            let confirmMessage = '';
            if (existingProject) {
                confirmMessage = `项目ID ${projectId} 已存在，保存后会覆盖原项目。确定要保存吗？`;
            } else {
                confirmMessage = `将创建一个新项目：${projectName}。确定要保存吗？`;
            }
            
            if (confirm(confirmMessage)) {
                // 准备项目数据
                const projectData = {
                    id: existingProject ? existingProject.id : Date.now(),
                    name: projectName,
                    html: html,
                    timestamp: Date.now(),
                    thumbnail: this.generateThumbnail()
                };
                
                // 处理版本记录
                if (existingProject) {
                    // 覆盖现有项目，添加版本记录
                    const versions = existingProject.versions || [];
                    
                    // 添加当前版本到版本记录（最多保存10个版本）
                    versions.push({
                        html: existingProject.html,
                        timestamp: existingProject.timestamp
                    });
                    
                    // 限制版本记录数量为10个
                    if (versions.length > 10) {
                        versions.shift(); // 移除最旧的版本
                    }
                    
                    // 更新项目数据，添加版本记录
                    projectData.versions = versions;
                } else {
                    // 新建项目，初始化版本记录
                    projectData.versions = [];
                }
                
                // 保存到历史记录
                if (existingProject) {
                    // 更新现有项目
                    history[projectIndex] = projectData;
                } else {
                    // 添加新项目
                    history.unshift(projectData);
                    
                    // 限制历史记录数量
                    if (history.length > this.maxHistoryItems) {
                        history.pop();
                    }
                }
                
                // 保存到localStorage
                localStorage.setItem(this.historyKey, JSON.stringify(history));
                
                alert('项目保存成功！');
                
                // 跳转到首页
                window.location.href = 'index.html';
            }
        }
    }
    
    // 生成缩略图（简化版，实际项目中可以使用canvas或截图API）
    generateThumbnail() {
        // 返回默认缩略图
        return 'https://picsum.photos/id/237/300/200';
    }
    
    // 下载HTML
    downloadHTML() {
        const htmlEditor = document.getElementById('htmlEditor');
        if (htmlEditor) {
            const html = htmlEditor.value;
            if (!html.trim()) {
                alert('HTML内容为空，无法下载！');
                return;
            }
            
            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'index.html';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }
    
    // 加载项目到首页
    loadProjects() {
        const history = this.getHistory();
        const projectsGrid = document.querySelector('.grid[class*="grid-cols-"]');
        
        if (projectsGrid) {
            // 清除现有卡片（保留第一个示例卡片）
            const cards = projectsGrid.querySelectorAll('.group.relative');
            cards.forEach((card, index) => {
                if (index > 0) {
                    card.remove();
                }
            });
            
            // 添加历史记录卡片
            history.forEach(project => {
                const card = this.createProjectCard(project);
                projectsGrid.appendChild(card);
            });
        }
    }
    
    // 加载历史记录到历史页面
    loadHistory() {
        const history = this.getHistory();
        const historyList = document.querySelector('.grid[class*="grid-cols-"]');
        
        if (historyList) {
            // 清除现有记录（保留第一个示例卡片）
            const cards = historyList.querySelectorAll('.group.relative');
            cards.forEach((card, index) => {
                if (index > 0) {
                    card.remove();
                }
            });
            
            // 添加历史记录项
            history.forEach(project => {
                const item = this.createHistoryItem(project);
                historyList.appendChild(item);
            });
        }
    }
    
    // 创建项目卡片
    createProjectCard(project) {
        const card = document.createElement('div');
        card.className = 'group relative flex flex-col overflow-visible rounded-xl border border-border-dark bg-surface-dark transition-all hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5';
        card.innerHTML = `
            <div class="aspect-video w-full overflow-hidden rounded-t-xl bg-cover bg-center" style="background-image: url('${project.thumbnail}');">
                <div class="h-full w-full bg-gradient-to-t from-surface-dark/90 to-transparent opacity-60 transition-transform duration-500 group-hover:scale-105"></div>
            </div>
            <div class="flex flex-1 flex-col justify-between p-4">
                <div>
                    <div class="flex items-center justify-between">
                        <h3 class="text-lg font-bold text-white group-hover:text-primary transition-colors">${project.name}</h3>
                    </div>
                </div>
                <div class="mt-4 flex items-center justify-between border-t border-border-dark pt-3">
                    <div class="relative group/menu">
                        <button class="flex items-center justify-center text-text-secondary hover:text-white transition-colors">
                            <span class="material-symbols-outlined text-[20px]">more_horiz</span>
                        </button>
                        <div class="absolute left-0 bottom-full mb-2 hidden w-32 flex-col overflow-hidden rounded-lg border border-border-dark bg-background-dark py-1 shadow-xl group-focus-within/menu:flex hover:flex group-hover/menu:flex z-10">
                            <button class="w-full px-4 py-2 text-left text-sm text-text-secondary hover:bg-surface-dark hover:text-white transition-colors preview-btn" data-id="${project.id}">Preview</button>
                            <button class="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-surface-dark hover:text-red-400 transition-colors delete" data-id="${project.id}">Delete</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // 绑定卡片点击事件
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.group/menu') && !e.target.closest('.menu-dropdown')) {
                window.location.href = `preview.html?id=${project.id}`;
            }
        });
        
        // 绑定菜单展开事件
        const projectMenu = card.querySelector('.group/menu');
        const menuDropdown = card.querySelector('.menu-dropdown');
        projectMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            menuDropdown.classList.toggle('flex');
        });
        
        // 点击其他区域关闭菜单
        document.addEventListener('click', (e) => {
            if (!card.contains(e.target)) {
                menuDropdown.classList.remove('flex');
            }
        });
        
        // 绑定预览按钮事件
        const previewBtn = card.querySelector('.preview-btn');
        if (previewBtn) {
            previewBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                window.location.href = `preview.html?id=${project.id}`;
            });
        }
        
        // 绑定删除按钮事件
        const deleteBtn = card.querySelector('.delete');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('确定要删除这个项目吗？')) {
                    this.deleteProject(project.id);
                    // 重新加载项目
                    this.loadProjects();
                }
            });
        }
        
        return card;
    }
    
    // 创建历史记录项
    createHistoryItem(project) {
        const item = document.createElement('div');
        item.className = 'group relative flex flex-col overflow-visible rounded-xl border border-border-dark bg-surface-dark transition-all hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5';
        item.innerHTML = `
            <div class="aspect-video w-full overflow-hidden rounded-t-xl bg-cover bg-center" style="background-image: url('${project.thumbnail}');">
                <div class="h-full w-full bg-gradient-to-t from-surface-dark/90 to-transparent opacity-60 transition-transform duration-500 group-hover:scale-105"></div>
            </div>
            <div class="flex flex-1 flex-col justify-between p-4">
                <div>
                    <div class="flex items-center justify-between">
                        <h3 class="text-lg font-bold text-white group-hover:text-primary transition-colors">${project.name}</h3>
                    </div>
                </div>
                <div class="mt-4 flex items-center justify-between border-t border-border-dark pt-3">
                    <div class="relative group/menu">
                        <button class="flex items-center justify-center text-text-secondary hover:text-white transition-colors">
                            <span class="material-symbols-outlined text-[20px]">more_horiz</span>
                        </button>
                        <div class="absolute left-0 bottom-full mb-2 hidden w-32 flex-col overflow-hidden rounded-lg border border-border-dark bg-background-dark py-1 shadow-xl group-focus-within/menu:flex hover:flex group-hover/menu:flex z-10">
                            <button class="w-full px-4 py-2 text-left text-sm text-text-secondary hover:bg-surface-dark hover:text-white transition-colors">Preview</button>
                            <button class="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-surface-dark hover:text-red-400 transition-colors delete" data-id="${project.id}">Delete</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // 绑定卡片点击事件
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.group/menu') && !e.target.closest('.menu-dropdown')) {
                window.location.href = `preview.html?id=${project.id}`;
            }
        });
        
        // 绑定菜单展开事件
        const projectMenu = item.querySelector('.group/menu');
        const menuDropdown = item.querySelector('.menu-dropdown');
        projectMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            menuDropdown.classList.toggle('flex');
        });
        
        // 点击其他区域关闭菜单
        document.addEventListener('click', (e) => {
            if (!item.contains(e.target)) {
                menuDropdown.classList.remove('flex');
            }
        });
        
        // 绑定删除按钮事件
        const deleteBtn = item.querySelector('.delete');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('确定要删除这个记录吗？')) {
                    this.deleteProject(project.id);
                    // 重新加载历史记录
                    this.loadHistory();
                }
            });
        }
        
        return item;
    }
    
    // 删除项目
    deleteProject(id) {
        const history = this.getHistory();
        const updatedHistory = history.filter(project => project.id !== id);
        localStorage.setItem(this.historyKey, JSON.stringify(updatedHistory));
    }
    
    // 清空所有历史记录
    clearAllHistory() {
        localStorage.removeItem(this.historyKey);
        this.loadHistory();
    }
    
    // 保存到历史记录
    saveToHistory(project) {
        const history = this.getHistory();
        
        // 添加到历史记录开头
        history.unshift(project);
        
        // 限制历史记录数量
        if (history.length > this.maxHistoryItems) {
            history.splice(this.maxHistoryItems);
        }
        
        // 保存到localStorage
        localStorage.setItem(this.historyKey, JSON.stringify(history));
    }
    
    // 获取历史记录
    getHistory() {
        const history = localStorage.getItem(this.historyKey);
        return history ? JSON.parse(history) : [];
    }
    
    // 格式化日期
    formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    // 显示历史版本
    showHistoryVersions() {
        // 从URL获取项目ID
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('id');
        
        if (!projectId) {
            alert('当前没有打开的项目，无法查看历史版本！');
            return;
        }
        
        // 获取当前历史记录
        const history = this.getHistory();
        const project = history.find(p => p.id == projectId);
        
        if (!project) {
            alert('项目未找到！');
            return;
        }
        
        // 获取版本记录
        const versions = project.versions || [];
        
        if (versions.length === 0) {
            alert('该项目没有历史版本记录！');
            return;
        }
        
        // 创建弹窗容器
        let modal = document.getElementById('historyModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'historyModal';
            modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
            document.body.appendChild(modal);
        }
        
        // 创建弹窗内容
        let modalContent = `
            <div class="bg-background-dark dark:bg-background-dark rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <div class="flex items-center justify-between p-6 border-b border-border-dark">
                    <h2 class="text-xl font-bold text-white">历史版本</h2>
                    <button id="closeHistoryModal" class="text-gray-400 hover:text-white transition-colors">
                        <span class="material-symbols-outlined text-[24px]">close</span>
                    </button>
                </div>
                <div class="p-6 overflow-y-auto flex-1">
                    <div class="space-y-4">
        `;
        
        // 添加版本记录
        versions.slice().reverse().forEach((version, index) => {
            modalContent += `
                <div class="p-4 bg-surface-dark rounded-lg border border-border-dark">
                    <div class="flex items-center justify-between mb-2">
                        <div>
                            <h3 class="font-bold text-white">版本 ${versions.length - index}</h3>
                            <p class="text-sm text-gray-500">${this.formatDate(version.timestamp)}</p>
                        </div>
                        <button class="preview-version-btn px-3 py-1 bg-primary text-white rounded hover:bg-primary-hover transition-colors text-sm font-medium" data-version-index="${index}">
                            预览
                        </button>
                    </div>
                    <div class="text-sm text-gray-300 font-mono truncate">
                        ${version.html.slice(0, 100)}${version.html.length > 100 ? '...' : ''}
                    </div>
                </div>
            `;
        });
        
        modalContent += `
                    </div>
                </div>
            </div>
        `;
        
        modal.innerHTML = modalContent;
        
        // 绑定关闭事件
        const closeBtn = document.getElementById('closeHistoryModal');
        closeBtn.addEventListener('click', () => {
            modal.remove();
        });
        
        // 点击模态框外部关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // 绑定预览按钮事件
        const previewBtns = document.querySelectorAll('.preview-version-btn');
        previewBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const versionIndex = e.target.dataset.versionIndex;
                const version = versions[versionIndex];
                
                // 预览版本
                const htmlEditor = document.getElementById('htmlEditor');
                if (htmlEditor) {
                    htmlEditor.value = version.html;
                    this.updatePreview();
                    this.updateLineNumbers();
                }
                
                // 关闭弹窗
                modal.remove();
            });
        });
    }
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', () => {
    const previewer = new HTMLPreviewer();
    previewer.init();
});

// 全屏事件监听
document.addEventListener('fullscreenchange', () => {
    const previewer = new HTMLPreviewer();
    previewer.isFullscreen = !!document.fullscreenElement;
});

document.addEventListener('webkitfullscreenchange', () => {
    const previewer = new HTMLPreviewer();
    previewer.isFullscreen = !!document.webkitFullscreenElement;
});

document.addEventListener('msfullscreenchange', () => {
    const previewer = new HTMLPreviewer();
    previewer.isFullscreen = !!document.msFullscreenElement;
});