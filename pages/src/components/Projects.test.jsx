import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProjectPage from './Projects';

beforeEach(() => localStorage.clear());

function openProject(slug) {
  return render(<MemoryRouter initialEntries={[`/projects/${slug}`]}><Routes><Route path="/projects/:slug" element={<ProjectPage />} /></Routes></MemoryRouter>);
}

test.each([
  ['tokenrouter', 'TokenRouter', 'Settle or refund', 'Actual usage settles the reservation'],
  ['mobileid', 'MobileID', 'Reject revoked access', 'The revoked session cannot continue'],
])('direct links open %s with an accessible architecture walkthrough', (slug, name, lastStep, description) => {
  const originalTitle = document.title;
  const view = openProject(slug);
  expect(screen.getByRole('heading', { level: 1, name })).toHaveFocus();
  expect(document.title).toBe(`${name} | Hongzhe Xie`);
  expect(screen.getByRole('link', { name: 'View source on GitHub' })).toHaveAttribute('href', `https://github.com/MacroXie04/${name}`);
  const step = screen.getByRole('button', { name: lastStep });
  fireEvent.click(step);
  expect(step).toHaveAttribute('aria-current', 'step');
  expect(screen.getByText(new RegExp(description))).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Evidence in the code' })).toBeInTheDocument();
  view.unmount();
  expect(document.title).toBe(originalTitle);
});

test('unknown projects provide a focused message and a route home', () => {
  openProject('missing');
  expect(screen.getByRole('heading', { name: 'Project not found' })).toHaveFocus();
  expect(screen.getByRole('link', { name: 'Back to terminal' })).toHaveAttribute('href', '/#/');
});

test('case studies preserve selected display settings', () => {
  localStorage.setItem('t-theme', 'light');
  localStorage.setItem('t-color', 'purple');
  localStorage.setItem('t-font-size', 'large');
  const { container } = openProject('tokenrouter');
  expect(container.querySelector('.p-page')).toHaveAttribute('data-theme', 'light');
  expect(container.querySelector('.p-page')).toHaveAttribute('data-color', 'purple');
  expect(container.querySelector('.p-page')).toHaveStyle({ fontSize: '1.25rem' });
});
