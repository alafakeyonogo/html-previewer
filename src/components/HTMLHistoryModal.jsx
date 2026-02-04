import React from 'react';

const HTMLHistoryModal = ({ versions, onPreview, onRestore, onClose, language, translate }) => {
  // 格式化日期
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="modal-overlay fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="modal-content bg-background-dark rounded shadow-lg w-9/10 max-w-[800px] max-h-[80vh] overflow-hidden flex flex-col">
        <div className="modal-header p-4 border-b border-border-dark bg-surface-dark flex justify-between items-center">
          <h2 className="modal-title text-lg font-semibold">{translate('historyVersionsTitle')}</h2>
          <button 
            className="modal-close bg-transparent border-none text-text-secondary cursor-pointer transition-colors hover:text-text-primary"
            onClick={onClose}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="modal-body p-4 overflow-y-auto flex-1">
          {versions.length === 0 ? (
            <p className="text-center text-text-secondary">{translate('noHistoryVersions')}</p>
          ) : (
            <div className="versions-list space-y-4">
              {versions.slice().reverse().map((version, index) => (
                <div key={index} className="version-item bg-surface-dark border border-border-dark rounded p-4 hover:border-primary transition-colors">
                  <div className="version-header flex justify-between items-center mb-2">
                    <div className="version-info">
                      <h4 className="font-semibold">{translate('versionNumber', { number: versions.length - index })}</h4>
                      <p className="version-date text-xs text-text-secondary">{formatDate(version.timestamp)}</p>
                    </div>
                    <div className="version-actions flex gap-2">
                      <button 
                        className="preview-version-btn px-3 py-1.5 bg-primary text-white rounded hover:bg-primary-hover transition-colors text-sm"
                        onClick={() => onPreview(version)}
                        title={translate('preview')}
                      >
                        {translate('preview')}
                      </button>
                      <button 
                        className="restore-version-btn px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                        onClick={() => onRestore(version)}
                        title={translate('restore')}
                      >
                        {translate('restore')}
                      </button>
                    </div>
                  </div>
                  <div className="version-content font-mono text-xs text-text-primary bg-background-dark p-3 rounded overflow-x-auto max-h-[100px] overflow-y-auto">
                    {version.html.slice(0, 200)}{version.html.length > 200 ? '...' : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HTMLHistoryModal;