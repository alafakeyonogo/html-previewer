import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { updateUserProfile } from '../utils/auth';
import { CONSTANTS } from '../utils/constants';

const AccountSettingsModal = ({ isOpen, onClose, user, language, translate }) => {
  const [activeTab, setActiveTab] = useState('password');
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    newEmail: '',
    emailPassword: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [formSuccess, setFormSuccess] = useState('');
  
  const modalRef = useRef(null);
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validatePasswordForm = () => {
    const errors = {};
    
    if (!formData.currentPassword) {
      errors.currentPassword = translate('currentPasswordRequired');
    }
    
    if (!formData.newPassword) {
      errors.newPassword = translate('newPasswordRequired');
    } else if (formData.newPassword.length < CONSTANTS.VALIDATION.PASSWORD_MIN_LENGTH) {
      errors.newPassword = translate('passwordLength');
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = translate('passwordMatch');
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateEmailForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!formData.newEmail) {
      errors.newEmail = translate('newEmailRequired');
    } else if (!emailRegex.test(formData.newEmail)) {
      errors.newEmail = translate('invalidEmail');
    }
    
    if (!formData.emailPassword) {
      errors.emailPassword = translate('passwordRequired');
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    setFormSuccess('');
    
    if (validatePasswordForm()) {
      const result = updateUserProfile({ password: formData.newPassword }, formData.currentPassword);
      if (result.success) {
        setFormSuccess(translate('passwordChanged'));
        setFormData({
          ...formData,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else if (result.error === 'invalidCurrentPassword') {
        setFormErrors({
          currentPassword: translate('passwordIncorrect')
        });
      } else {
        setFormErrors({
          currentPassword: translate('updateFailed')
        });
      }
    }
  };

  const handleEmailChange = (e) => {
    e.preventDefault();
    setFormSuccess('');
    
    if (validateEmailForm()) {
      const result = updateUserProfile({ email: formData.newEmail }, formData.emailPassword);
      if (result.success) {
        setFormSuccess(translate('emailChanged'));
        setFormData({
          ...formData,
          newEmail: '',
          emailPassword: ''
        });
      } else if (result.error === 'invalidCurrentPassword') {
        setFormErrors({
          emailPassword: translate('passwordIncorrect')
        });
      } else if (result.error === 'emailExists') {
        setFormErrors({
          newEmail: translate('emailExists')
        });
      } else {
        setFormErrors({
          emailPassword: translate('updateFailed')
        });
      }
    }
  };

  const handleClose = () => {
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      newEmail: '',
      emailPassword: ''
    });
    setFormErrors({});
    setFormSuccess('');
    setActiveTab('password');
    onClose();
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2147483647,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={handleClose}
    >
      <div 
        ref={modalRef}
        style={{
          backgroundColor: '#1a1a2e',
          borderRadius: '12px',
          border: '1px solid #2d2d44',
          width: '100%',
          maxWidth: '480px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', margin: 0 }}>{translate('accountSettings')}</h2>
            <button 
              style={{ color: '#a0a0b0', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              onClick={handleClose}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div style={{ display: 'flex', borderBottom: '1px solid #2d2d44', marginBottom: '24px' }}>
            <button 
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '500',
                background: 'none',
                border: 'none',
                color: activeTab === 'password' ? '#0d59f2' : '#a0a0b0',
                borderBottom: activeTab === 'password' ? '2px solid #0d59f2' : 'none',
                cursor: 'pointer'
              }}
              onClick={() => setActiveTab('password')}
            >
              {translate('changePassword')}
            </button>
            <button 
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '500',
                background: 'none',
                border: 'none',
                color: activeTab === 'email' ? '#0d59f2' : '#a0a0b0',
                borderBottom: activeTab === 'email' ? '2px solid #0d59f2' : 'none',
                cursor: 'pointer'
              }}
              onClick={() => setActiveTab('email')}
            >
              {translate('changeEmail')}
            </button>
          </div>

          <div>
            {activeTab === 'password' && (
              <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#a0a0b0', marginBottom: '4px' }}>
                    {translate('currentPassword')}
                  </label>
                  <input 
                    type="password" 
                    name="currentPassword" 
                    value={formData.currentPassword} 
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#12121f',
                      border: '1px solid #2d2d44',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                    placeholder={translate('currentPassword')}
                  />
                  {formErrors.currentPassword && (
                    <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', margin: 0 }}>{formErrors.currentPassword}</p>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#a0a0b0', marginBottom: '4px' }}>
                    {translate('newPassword')}
                  </label>
                  <input 
                    type="password" 
                    name="newPassword" 
                    value={formData.newPassword} 
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#12121f',
                      border: '1px solid #2d2d44',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                    placeholder={translate('newPassword')}
                  />
                  {formErrors.newPassword && (
                    <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', margin: 0 }}>{formErrors.newPassword}</p>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#a0a0b0', marginBottom: '4px' }}>
                    {translate('confirmPassword')}
                  </label>
                  <input 
                    type="password" 
                    name="confirmPassword" 
                    value={formData.confirmPassword} 
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#12121f',
                      border: '1px solid #2d2d44',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                    placeholder={translate('confirmPassword')}
                  />
                  {formErrors.confirmPassword && (
                    <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', margin: 0 }}>{formErrors.confirmPassword}</p>
                  )}
                </div>

                {formSuccess && (
                  <div style={{ padding: '12px', backgroundColor: 'rgba(34, 197, 94, 0.2)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '8px', color: '#4ade80', fontSize: '14px' }}>
                    {formSuccess}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
                  <button 
                    type="button" 
                    onClick={handleClose}
                    style={{
                      flex: 1,
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '1px solid #2d2d44',
                      backgroundColor: '#12121f',
                      color: '#a0a0b0',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    {translate('cancel')}
                  </button>
                  <button 
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#0d59f2',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    {translate('saveChanges')}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'email' && (
              <form onSubmit={handleEmailChange} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#a0a0b0', marginBottom: '4px' }}>
                    {translate('currentEmail')}
                  </label>
                  <input 
                    type="email" 
                    value={user?.email || ''}
                    disabled
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: 'rgba(18, 18, 31, 0.5)',
                      border: '1px solid #2d2d44',
                      borderRadius: '8px',
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '14px',
                      outline: 'none',
                      cursor: 'not-allowed'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#a0a0b0', marginBottom: '4px' }}>
                    {translate('newEmail')}
                  </label>
                  <input 
                    type="email" 
                    name="newEmail" 
                    value={formData.newEmail} 
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#12121f',
                      border: '1px solid #2d2d44',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                    placeholder={translate('newEmail')}
                  />
                  {formErrors.newEmail && (
                    <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', margin: 0 }}>{formErrors.newEmail}</p>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#a0a0b0', marginBottom: '4px' }}>
                    {translate('password')}
                  </label>
                  <input 
                    type="password" 
                    name="emailPassword" 
                    value={formData.emailPassword} 
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#12121f',
                      border: '1px solid #2d2d44',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                    placeholder={translate('enterPassword')}
                  />
                  {formErrors.emailPassword && (
                    <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', margin: 0 }}>{formErrors.emailPassword}</p>
                  )}
                </div>

                {formSuccess && (
                  <div style={{ padding: '12px', backgroundColor: 'rgba(34, 197, 94, 0.2)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '8px', color: '#4ade80', fontSize: '14px' }}>
                    {formSuccess}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
                  <button 
                    type="button" 
                    onClick={handleClose}
                    style={{
                      flex: 1,
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '1px solid #2d2d44',
                      backgroundColor: '#12121f',
                      color: '#a0a0b0',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    {translate('cancel')}
                  </button>
                  <button 
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#0d59f2',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    {translate('saveChanges')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AccountSettingsModal;
