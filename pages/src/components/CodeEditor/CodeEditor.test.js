import { render, screen, fireEvent } from '@testing-library/react';
import CodeEditor from './index';

describe('CodeEditor Component', () => {
  test('renders without crashing', () => {
    const { container } = render(<CodeEditor />);
    const editorContainer = container.querySelector('.code-editor-container');
    expect(editorContainer).toBeInTheDocument();
  });

  test('displays title bar with name', () => {
    const { container } = render(<CodeEditor />);
    // Be specific - look for the title text in the title bar
    const titleBar = container.querySelector('.title-text');
    expect(titleBar).toBeInTheDocument();
    expect(titleBar.textContent).toBe('Hongzhe Xie');
  });

  test('shows README.md tab by default', () => {
    const { container } = render(<CodeEditor />);
    // Check if README.md tab is visible - be specific to tab area
    const tab = container.querySelector('.tab.active span');
    expect(tab).toBeInTheDocument();
    expect(tab.textContent).toBe('README.md');
  });

  test('displays portfolio content', () => {
    render(<CodeEditor />);
    // Check for content from the README
    const heading = screen.getByText(/Hi, I'm Hongzhe Xie/i);
    expect(heading).toBeInTheDocument();
    
    // Check for professional summary
    const summary = screen.getByText(/Professional Summary/i);
    expect(summary).toBeInTheDocument();
  });

  test('has project and structure view buttons', () => {
    render(<CodeEditor />);
    // Check for Project button
    const projectButton = screen.getByTitle('Project');
    expect(projectButton).toBeInTheDocument();
    
    // Check for Structure button
    const structureButton = screen.getByTitle('Structure');
    expect(structureButton).toBeInTheDocument();
  });

  test('can toggle between project and structure views', () => {
    render(<CodeEditor />);
    const projectButton = screen.getByTitle('Project');
    const structureButton = screen.getByTitle('Structure');
    
    // Click structure button
    fireEvent.click(structureButton);
    
    // Structure view should be active (button gets different styling)
    expect(structureButton.className).toContain('tool-button');
    
    // Click project button to go back
    fireEvent.click(projectButton);
    expect(projectButton.className).toContain('tool-button');
  });

  test('displays status bar with correct info', () => {
    render(<CodeEditor />);
    // Check status bar content
    const githubPages = screen.getByText('GitHub Pages');
    expect(githubPages).toBeInTheDocument();
    
    const markdown = screen.getByText('markdown');
    expect(markdown).toBeInTheDocument();
  });

  test('has markdown preview toggle', () => {
    render(<CodeEditor />);
    // Check for markdown toggle buttons
    const codeButton = screen.getByText('Code');
    const previewButton = screen.getByText('Preview');
    
    expect(codeButton).toBeInTheDocument();
    expect(previewButton).toBeInTheDocument();
    
    // Preview should be active by default
    expect(previewButton.className).toContain('active');
  });
});
