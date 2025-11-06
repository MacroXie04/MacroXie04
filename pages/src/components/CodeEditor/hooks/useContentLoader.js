import { useEffect } from 'react';

const resolveContentPath = (path) => {
  if (!path) {
    return '';
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const publicUrl = process.env.PUBLIC_URL || '';
  if (path.startsWith('/')) {
    return `${publicUrl}${path}`;
  }

  if (publicUrl.endsWith('/')) {
    return `${publicUrl}${path}`;
  }

  return `${publicUrl}/${path}`;
};

export const useContentLoader = ({ openTabs, portfolioData, tabContents, setTabContents }) => {
  useEffect(() => {
    let isCancelled = false;

    const loadContent = async (tabKey, tabData) => {
      try {
        const resourcePath = resolveContentPath(tabData.contentPath);
        if (!resourcePath) {
          throw new Error('Missing content path');
        }

        const response = await fetch(resourcePath, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`${response.status} ${response.statusText}`);
        }

        const text = await response.text();
        if (!isCancelled) {
          setTabContents((prev) => ({
            ...prev,
            [tabKey]: text,
          }));
        }
      } catch (error) {
        if (!isCancelled) {
          const fallbackMessage =
            tabData.language && tabData.language.toLowerCase() === 'python'
              ? `# Failed to load content for ${tabData.title}\n# ${error.message}`
              : `/* Failed to load content for ${tabData.title}: ${error.message} */`;
          setTabContents((prev) => ({
            ...prev,
            [tabKey]: fallbackMessage,
          }));
        }
      }
    };

    openTabs.forEach((tabKey) => {
      const tabData = portfolioData[tabKey];
      if (!tabData) {
        return;
      }

      const existingContent = tabContents[tabKey];
      if (existingContent && existingContent !== 'Loading...') {
        return;
      }

      if (tabData.content) {
        setTabContents((prev) => ({
          ...prev,
          [tabKey]: tabData.content,
        }));
        return;
      }

      if (tabData.contentPath) {
        if (!existingContent) {
          setTabContents((prev) => ({
            ...prev,
            [tabKey]: 'Loading...'
          }));
          loadContent(tabKey, tabData);
        }
        return;
      }

      setTabContents((prev) => ({
        ...prev,
        [tabKey]: '',
      }));
    });

    return () => {
      isCancelled = true;
    };
  }, [openTabs, portfolioData, tabContents, setTabContents]);
};

