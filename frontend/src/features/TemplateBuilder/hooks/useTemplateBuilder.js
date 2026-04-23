import { useContext } from 'react';
import { TemplateBuilderContext } from '../context/TemplateBuilderContext';

export const useTemplateBuilder = () => {
  const context = useContext(TemplateBuilderContext);
  if (!context) {
    throw new Error('useTemplateBuilder must be used within a TemplateBuilderProvider');
  }
  return context;
};