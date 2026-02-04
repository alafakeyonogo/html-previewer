// 用户认证工具函数
import { safeGetJSON, safeSetJSON, safeSetItem, safeRemoveItem, checkStorageSpace } from './storage';

// 用户数据模型
const User = {
  id: null,
  email: '',
  password: '',
  name: '',
  avatar: '',
  registrationTime: null,
  role: 'basic_member'
};

// 存储键名
const STORAGE_KEYS = {
  USERS: 'html_preview_users',
  CURRENT_USER: 'html_preview_current_user'
};

// 简单的密码哈希函数（生产环境应使用bcrypt等专业库）
const hashPassword = (password) => {
  let hash = 0;
  const str = password + 'html_preview_salt';
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'hashed_' + Math.abs(hash).toString(16);
};

// 验证密码
const verifyPassword = (password, hashedPassword) => {
  return hashPassword(password) === hashedPassword;
};

// 初始化用户存储
const initUsersStorage = () => {
  try {
    const users = safeGetJSON(STORAGE_KEYS.USERS, null);
    if (!users) {
      safeSetJSON(STORAGE_KEYS.USERS, []);
    }
  } catch (error) {
    console.error('Error initializing users storage:', error);
  }
};

// 生成唯一用户ID
const generateUserId = () => {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// 注册新用户
export const registerUser = (email, password, name = '') => {
  initUsersStorage();
  
  try {
    const users = safeGetJSON(STORAGE_KEYS.USERS, []);
    
    // 检查邮箱是否已存在
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      return { success: false, error: 'emailExists' };
    }
    
    // 创建新用户
    const newUser = {
      ...User,
      id: generateUserId(),
      email,
      password: hashPassword(password),
      name: name || email.split('@')[0],
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email.split('@')[0])}&background=random&color=fff&size=128`,
      registrationTime: Date.now()
    };
    
    // 检查存储空间
    const estimatedSize = JSON.stringify([...users, newUser]).length * 2; // 估算大小
    if (!checkStorageSpace(estimatedSize)) {
      return { success: false, error: 'quotaExceeded' };
    }
    
    // 保存新用户
    users.push(newUser);
    const saveResult = safeSetJSON(STORAGE_KEYS.USERS, users);
    if (!saveResult.success) {
      return { success: false, error: saveResult.error };
    }
    
    // 自动登录新用户
    loginUser(email, password);
    
    return { success: true, user: newUser };
  } catch (error) {
    console.error('Error registering user:', error);
    return { success: false, error: 'unknown' };
  }
};

// 用户登录
export const loginUser = (email, password) => {
  try {
    const users = safeGetJSON(STORAGE_KEYS.USERS, []);
    
    // 查找用户
    const user = users.find(user => user.email === email);
    if (!user) {
      return { success: false, error: 'invalidCredentials' };
    }
    
    // 验证密码
    const isHashed = user.password.startsWith('hashed_');
    const isValid = isHashed 
      ? verifyPassword(password, user.password)
      : password === user.password;
    
    if (!isValid) {
      return { success: false, error: 'invalidCredentials' };
    }
    
    // 保存当前登录用户
    const saveResult = safeSetJSON(STORAGE_KEYS.CURRENT_USER, user);
    if (!saveResult.success) {
      return { success: false, error: saveResult.error };
    }
    
    return { success: true, user };
  } catch (error) {
    console.error('Error logging in user:', error);
    return { success: false, error: 'unknown' };
  }
};

// 用户登出
export const logoutUser = () => {
  try {
    const result = safeRemoveItem(STORAGE_KEYS.CURRENT_USER);
    return result;
  } catch (error) {
    console.error('Error logging out user:', error);
    return { success: false, error: 'unknown' };
  }
};

// 获取当前登录用户
export const getCurrentUser = () => {
  try {
    const currentUser = safeGetJSON(STORAGE_KEYS.CURRENT_USER, null);
    return currentUser;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// 检查用户是否已登录
export const isUserLoggedIn = () => {
  return getCurrentUser() !== null;
};

// 更新用户信息
export const updateUserProfile = (userData, currentPassword = null) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'notLoggedIn' };
    }
    
    const users = safeGetJSON(STORAGE_KEYS.USERS, []);
    const userIndex = users.findIndex(user => user.id === currentUser.id);
    
    if (userIndex === -1) {
      return { success: false, error: 'userNotFound' };
    }
    
    const targetUser = users[userIndex];
    
    // 如果要修改密码，需要验证当前密码
    if (userData.password && currentPassword !== null) {
      // 检查用户密码是否已加密
      const isHashed = targetUser.password.startsWith('hashed_');
      const isValid = isHashed 
        ? verifyPassword(currentPassword, targetUser.password)
        : currentPassword === targetUser.password;
      
      if (!isValid) {
        return { success: false, error: 'invalidCurrentPassword' };
      }
      
      // 加密新密码
      userData.password = hashPassword(userData.password);
    }
    
    // 如果要修改邮箱，需要验证当前密码
    if (userData.email && currentPassword !== null) {
      // 检查邮箱是否已被其他用户使用
      const emailExists = users.find(user => user.email === userData.email && user.id !== currentUser.id);
      if (emailExists) {
        return { success: false, error: 'emailExists' };
      }
      
      // 检查用户密码是否已加密
      const isHashed = targetUser.password.startsWith('hashed_');
      const isValid = isHashed 
        ? verifyPassword(currentPassword, targetUser.password)
        : currentPassword === targetUser.password;
      
      if (!isValid) {
        return { success: false, error: 'invalidCurrentPassword' };
      }
    }
    
    const updatedUsers = users.map(user => {
      if (user.id === currentUser.id) {
        return { ...user, ...userData };
      }
      return user;
    });
    
    const saveResult = safeSetJSON(STORAGE_KEYS.USERS, updatedUsers);
    if (!saveResult.success) {
      return { success: false, error: saveResult.error };
    }
    
    const updatedCurrentUser = { ...currentUser, ...userData };
    const saveCurrentUserResult = safeSetJSON(STORAGE_KEYS.CURRENT_USER, updatedCurrentUser);
    if (!saveCurrentUserResult.success) {
      return { success: false, error: saveCurrentUserResult.error };
    }
    
    return { success: true, user: updatedCurrentUser };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { success: false, error: 'unknown' };
  }
};

// 初始化认证系统
initUsersStorage();
