// Import all content sections
import { readme } from './sections/readme';
import { contact } from './sections/contact';
import { experience } from './sections/experience';
import { skills } from './sections/skills';
import { education } from './sections/education';

// Import file structure configuration
import { fileStructure } from './fileStructure';

// Combine all portfolio data
export const portfolioData = {
  readme,
  contact,
  experience,
  skills,
  education
};

// Export file structure
export { fileStructure };

// Export individual sections for convenience
export {
  readme,
  contact,
  experience,
  skills,
  education
}; 