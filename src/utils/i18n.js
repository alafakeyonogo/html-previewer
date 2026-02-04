// 翻译字典
export const translations = {
  en: {
    // Header
    home: 'Home',
    preview: 'Preview',
    backToHome: 'Back to Home',
    
    // Home Page
    yourProjects: 'Your Projects',
    manageProjects: 'Manage and view your history of rendered HTML code snippets. Access your past work or start a new experiment.',
    newPreview: 'New Preview',
    importHtml: 'Import HTML',
    searchPlaceholder: 'Search by project name or tag...',
    filter: 'Filter',
    sort: 'Sort',
    showingResults: 'Showing {{start}} to {{end}} of {{total}} results',
    
    // Project Card
    deleteProject: 'Delete Project',
    deleteProjectConfirm: 'Are you sure you want to delete project "{{name}}"?',
    lastEdited: 'Last edited: {{time}}',
    rename: 'Rename',
    renameProject: 'Rename Project',
    duplicate: 'Duplicate',
    
    // Preview Page
    editor: 'Editor',
    historyVersions: 'History Versions',
    downloadHtml: 'Download HTML',
    clearAll: 'Clear All',
    insert: 'Insert',
    previewMode: 'Preview Mode',
    mobileView: 'Mobile View',
    tabletView: 'Tablet View',
    desktopView: 'Desktop View',
    saveProject: 'Save Project',
    fullscreen: 'Fullscreen',
    exitFullscreen: 'Exit Fullscreen',
    enterProjectName: 'Enter project name...',
    startTypingHtml: '<!-- Start typing your HTML here... -->',
    
    // Save Modal
    saveProjectTitle: 'Save Project',
    projectExists: 'Project ID {{id}} already exists. Saving will update the original project.',
    newProject: 'A new project will be created.',
    projectName: 'Project Name',
    cancel: 'Cancel',
    save: 'Save',
    
    // History Modal
    historyVersionsTitle: 'History Versions',
    noHistoryVersions: 'No history versions available',
    versionNumber: 'Version {{number}}',
    preview: 'Preview',
    restore: 'Restore',
    close: 'Close',
    restoreConfirm: 'Are you sure you want to restore this version? The current content will be replaced.',
    restoreSuccess: 'Version restored successfully!',
    
    // Alerts
    pleaseEnterHtml: 'Please enter HTML code first!',
    projectSaved: 'Project saved successfully!',
    htmlEmpty: 'HTML content is empty, cannot download!',
    clearConfirm: 'Are you sure you want to clear the editor content?',
    projectNameTooShort: 'Project name must be at least 2 characters',
    projectNameTooLong: 'Project name must not exceed 100 characters',
    projectNameInvalidChars: 'Project name contains invalid characters. Please avoid: < > : " / \\ | ? *',
    htmlContentTooLarge: 'HTML content is too large. Maximum size is 1MB.',
    
    // User Info
    proMember: 'Pro Member',
    basicMember: 'Basic Member',
    
    // User Account
    accountSettings: 'Account Settings',
    logout: 'Logout',
    changePassword: 'Change Password',
    changeEmail: 'Change Email',
    currentPassword: 'Current Password',
    currentPasswordRequired: 'Current password is required',
    newPassword: 'New Password',
    newPasswordRequired: 'New password is required',
    confirmPassword: 'Confirm Password',
    currentEmail: 'Current Email',
    newEmail: 'New Email',
    newEmailRequired: 'New email is required',
    saveChanges: 'Save Changes',
    cancel: 'Cancel',
    passwordChanged: 'Password changed successfully!',
    emailChanged: 'Email changed successfully!',
    login: 'Login',
    register: 'Register',
    pleaseLogin: 'Please login to continue',
    passwordMatch: 'Passwords must match',
    passwordLength: 'Password must be at least 6 characters',
    invalidEmail: 'Invalid email format',
    passwordIncorrect: 'Current password is incorrect',
    emailExists: 'Email already exists',
    logoutConfirm: 'Are you sure you want to logout, {{name}}?',
    enterPassword: 'Enter password',
    updateFailed: 'Update failed. Please try again.',
    // Auth Modal
    email: 'Email',
    password: 'Password',
    name: 'Name',
    emailRequired: 'Email is required',
    passwordRequired: 'Password is required',
    nameRequired: 'Name is required',
    invalidCredentials: 'Invalid email or password',
    unknownError: 'An unknown error occurred',
    loginSuccess: 'Login successful!',
    registerSuccess: 'Registration successful!',
    noAccount: "Don't have an account?",
    haveAccount: 'Already have an account?'
  },
  
  zh: {
    // Header
    home: '首页',
    preview: '预览',
    backToHome: '返回首页',
    
    // Home Page
    yourProjects: '你的项目',
    manageProjects: '管理和查看你渲染过的HTML代码片段历史。访问你的过去的工作或开始新的实验。',
    newPreview: '新建预览',
    importHtml: '导入HTML',
    searchPlaceholder: '按项目名称或标签搜索...',
    filter: '筛选',
    sort: '排序',
    showingResults: '显示 {{start}} 到 {{end}} 共 {{total}} 个结果',
    
    // Project Card
    deleteProject: '删除项目',
    deleteProjectConfirm: '确定要删除项目 "{{name}}" 吗？',
    lastEdited: '最后编辑: {{time}}',
    rename: '重命名',
    renameProject: '重命名项目',
    duplicate: '复制',
    
    // Preview Page
    editor: '编辑器',
    historyVersions: '历史版本',
    downloadHtml: '下载HTML',
    clearAll: '清空所有',
    insert: '插入',
    previewMode: '预览模式',
    mobileView: '移动视图',
    tabletView: '平板视图',
    desktopView: '桌面视图',
    saveProject: '保存项目',
    fullscreen: '全屏',
    exitFullscreen: '退出全屏',
    enterProjectName: '输入项目名称...',
    startTypingHtml: '<!-- 在这里开始输入你的HTML代码... -->',
    
    // Save Modal
    saveProjectTitle: '保存项目',
    projectExists: '项目ID {{id}} 已存在。保存将更新原项目。',
    newProject: '将创建一个新项目。',
    projectName: '项目名称',
    cancel: '取消',
    save: '保存',
    
    // History Modal
    historyVersionsTitle: '历史版本',
    noHistoryVersions: '暂无历史版本记录',
    versionNumber: '版本 {{number}}',
    preview: '预览',
    restore: '恢复',
    close: '关闭',
    restoreConfirm: '确定要恢复此版本吗？当前内容将被替换。',
    restoreSuccess: '版本恢复成功！',
    
    // Alerts
    pleaseEnterHtml: '请先输入HTML代码！',
    projectSaved: '项目保存成功！',
    htmlEmpty: 'HTML内容为空，无法下载！',
    clearConfirm: '确定要清空编辑器内容吗？',
    projectNameTooShort: '项目名称至少需要2个字符',
    projectNameTooLong: '项目名称不能超过100个字符',
    projectNameInvalidChars: '项目名称包含无效字符。请避免使用: < > : " / \\ | ? *',
    htmlContentTooLarge: 'HTML内容过大。最大大小为1MB。',
    
    // User Info
    proMember: '专业会员',
    basicMember: '基础会员',
    
    // User Account
    accountSettings: '账号设置',
    logout: '退出登录',
    changePassword: '修改密码',
    changeEmail: '修改邮箱',
    currentPassword: '当前密码',
    currentPasswordRequired: '请输入当前密码',
    newPassword: '新密码',
    newPasswordRequired: '请输入新密码',
    confirmPassword: '确认密码',
    currentEmail: '当前邮箱',
    newEmail: '新邮箱',
    newEmailRequired: '请输入新邮箱',
    saveChanges: '保存修改',
    cancel: '取消',
    passwordChanged: '密码修改成功！',
    emailChanged: '邮箱修改成功！',
    login: '登录',
    register: '注册',
    pleaseLogin: '请登录以继续',
    passwordMatch: '密码必须匹配',
    passwordLength: '密码至少需要6个字符',
    invalidEmail: '邮箱格式无效',
    passwordIncorrect: '当前密码不正确',
    emailExists: '邮箱已存在',
    logoutConfirm: '确定要退出登录吗，{{name}}？',
    enterPassword: '请输入密码',
    updateFailed: '更新失败，请重试。',
    // Auth Modal
    email: '邮箱',
    password: '密码',
    name: '姓名',
    emailRequired: '请输入邮箱',
    passwordRequired: '请输入密码',
    nameRequired: '请输入姓名',
    invalidCredentials: '邮箱或密码错误',
    unknownError: '发生未知错误',
    loginSuccess: '登录成功！',
    registerSuccess: '注册成功！',
    noAccount: '还没有账号？',
    haveAccount: '已经有账号？'
  }
};

// 翻译函数
export const translate = (key, language = 'en', variables = {}) => {
  // 获取对应语言的翻译
  let translation = translations[language][key] || key;
  
  // 替换变量
  if (Object.keys(variables).length) {
    Object.keys(variables).forEach(variable => {
      translation = translation.replace(`{{${variable}}}`, variables[variable]);
    });
  }
  
  return translation;
};