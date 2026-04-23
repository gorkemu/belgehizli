import React, { forwardRef } from 'react';
import styles from './Input.module.css';

const Input = forwardRef(({
  label,
  error,
  helperText,
  id,
  className = '',
  fullWidth = true,
  ...props
}, ref) => {
  
  const inputId = id || Math.random().toString(36).substring(2, 9);

  return (
    <div className={`${styles.inputWrapper} ${fullWidth ? styles.fullWidth : ''} ${className}`}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      
      <div className={styles.inputContainer}>
        <input
          ref={ref}
          id={inputId}
          className={`${styles.input} ${error ? styles.errorInput : ''}`}
          aria-invalid={error ? "true" : "false"}
          {...props}
        />
      </div>

      {error && <span className={styles.errorText}>{error}</span>}
      {!error && helperText && <span className={styles.helperText}>{helperText}</span>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;