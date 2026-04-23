import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import styles from './Button.module.css';

const Button = forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading = false, 
  leftIcon, 
  rightIcon, 
  fullWidth = false,
  className = '',
  disabled,
  ...props 
}, ref) => {
  
  const classNames = [
    styles.btn,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button 
      ref={ref} 
      className={classNames} 
      disabled={disabled || isLoading} 
      {...props}
    >
      {isLoading && <Loader2 size={16} className={styles.spinner} />}
      {!isLoading && leftIcon}
      {children && <span>{children}</span>}
      {!isLoading && rightIcon}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;