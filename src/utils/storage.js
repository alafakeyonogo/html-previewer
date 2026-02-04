// localStorage 工具函数 - 提供安全的localStorage操作和错误处理

// 检查localStorage是否可用
export const isLocalStorageAvailable = () => {
  try {
    const testKey = '__localStorage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    console.error('localStorage is not available:', error);
    return false;
  }
};

// 安全的getItem操作
export const safeGetItem = (key, defaultValue = null) => {
  try {
    if (!isLocalStorageAvailable()) {
      return defaultValue;
    }
    
    const item = localStorage.getItem(key);
    if (item === null || item === undefined) {
      return defaultValue;
    }
    
    return item;
  } catch (error) {
    console.error(`Error getting item from localStorage (key: ${key}):`, error);
    return defaultValue;
  }
};

// 安全的setItem操作
export const safeSetItem = (key, value) => {
  try {
    if (!isLocalStorageAvailable()) {
      console.warn('localStorage is not available, cannot set item');
      return { success: false, error: 'localStorageUnavailable' };
    }
    
    localStorage.setItem(key, value);
    return { success: true };
  } catch (error) {
    console.error(`Error setting item to localStorage (key: ${key}):`, error);
    
    // 检查是否是存储空间不足的错误
    if (error.name === 'QuotaExceededError' || error.code === 22) {
      return { success: false, error: 'quotaExceeded' };
    }
    
    return { success: false, error: 'unknown' };
  }
};

// 安全的removeItem操作
export const safeRemoveItem = (key) => {
  try {
    if (!isLocalStorageAvailable()) {
      return { success: false, error: 'localStorageUnavailable' };
    }
    
    localStorage.removeItem(key);
    return { success: true };
  } catch (error) {
    console.error(`Error removing item from localStorage (key: ${key}):`, error);
    return { success: false, error: 'unknown' };
  }
};

// 安全的JSON解析
export const safeParseJSON = (jsonString, defaultValue = null) => {
  try {
    if (!jsonString || jsonString.trim() === '') {
      return defaultValue;
    }
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return defaultValue;
  }
};

// 安全的JSON字符串化
export const safeStringifyJSON = (obj) => {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    console.error('Error stringifying JSON:', error);
    return null;
  }
};

// 获取并解析JSON
export const safeGetJSON = (key, defaultValue = null) => {
  const item = safeGetItem(key, null);
  if (item === null) {
    return defaultValue;
  }
  return safeParseJSON(item, defaultValue);
};

// 设置JSON对象
export const safeSetJSON = (key, obj) => {
  const jsonString = safeStringifyJSON(obj);
  if (jsonString === null) {
    return { success: false, error: 'stringifyFailed' };
  }
  return safeSetItem(key, jsonString);
};

// 清空所有数据（谨慎使用）
export const clearAllData = () => {
  try {
    if (!isLocalStorageAvailable()) {
      return { success: false, error: 'localStorageUnavailable' };
    }
    
    localStorage.clear();
    return { success: true };
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    return { success: false, error: 'unknown' };
  }
};

// 获取存储空间使用情况（估算）
export const getStorageUsage = () => {
  try {
    if (!isLocalStorageAvailable()) {
      return { used: 0, available: 0, percentage: 0 };
    }
    
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    
    // localStorage通常限制为5-10MB
    const maxStorage = 5 * 1024 * 1024; // 5MB
    const percentage = (total / maxStorage) * 100;
    
    return {
      used: total,
      available: maxStorage - total,
      percentage: percentage
    };
  } catch (error) {
    console.error('Error calculating storage usage:', error);
    return { used: 0, available: 0, percentage: 0 };
  }
};

// 检查存储空间是否足够
export const checkStorageSpace = (requiredBytes) => {
  const usage = getStorageUsage();
  return usage.available >= requiredBytes;
};

// 清理旧数据（保留最新的N个项目）
export const cleanupOldData = (key, maxItems = 100) => {
  try {
    const data = safeGetJSON(key, []);
    if (!Array.isArray(data) || data.length <= maxItems) {
      return { success: true, removed: 0 };
    }
    
    // 按时间戳排序，保留最新的
    const sortedData = data.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    const trimmedData = sortedData.slice(0, maxItems);
    const removedCount = data.length - trimmedData.length;
    
    const result = safeSetJSON(key, trimmedData);
    return { ...result, removed: removedCount };
  } catch (error) {
    console.error('Error cleaning up old data:', error);
    return { success: false, error: 'unknown', removed: 0 };
  }
};
