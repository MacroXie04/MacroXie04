// Import all content sections
import { readme } from './sections/readme.js';
import { experience } from './sections/experience.js';
import { skills } from './sections/skills.js';

// Import file structure configuration
import { fileStructure } from './fileStructure.js';

// Combine all portfolio data
export const portfolioData = {
  readme,
  experience,
  skills,
};

// Export file structure
export { fileStructure };

// Export individual sections for convenience
export {
  readme,
  experience,
  skills,
}; 