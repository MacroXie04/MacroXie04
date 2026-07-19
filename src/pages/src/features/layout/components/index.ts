// Layout components - unified exports
export { Footer } from './Footer/Footer.tsx';
export { MainMenu } from './MainMenu/MainMenu.tsx';
export { Container } from './Container/Container.tsx';

// Re-export Container as Layout for backward compatibility
export { Container as Layout } from './Container/Container.tsx';

// Layout context provider and hooks
export { LayoutProvider } from './LayoutProvider/LayoutProvider.tsx';
export { useLayout, useMenu, useFooter } from './LayoutProvider/context.ts';
