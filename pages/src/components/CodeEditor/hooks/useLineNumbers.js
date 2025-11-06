import { useCallback, useEffect, useState } from 'react';

const LINE_HEIGHT = 28;
const UI_HEIGHT = 120;
const PADDING = 48;

export const useLineNumbers = (activeTab, tabContents, portfolioData) => {
  const [lineNumbers, setLineNumbers] = useState([]);

  const updateLineNumbers = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const currentContent = tabContents[activeTab] ?? portfolioData[activeTab]?.content ?? '';
    const contentLines = currentContent.split('\n').length;
    const viewportHeight = window.innerHeight;
    const editorHeight = viewportHeight - UI_HEIGHT - PADDING;
    const minLines = Math.max(contentLines, Math.floor(editorHeight / LINE_HEIGHT));

    setLineNumbers(Array.from({ length: minLines }, (_, index) => index + 1));
  }, [activeTab, tabContents, portfolioData]);

  useEffect(() => {
    updateLineNumbers();
  }, [updateLineNumbers]);

  useEffect(() => {
    const handleResize = () => {
      updateLineNumbers();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateLineNumbers]);

  return lineNumbers;
};

