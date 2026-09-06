import profile from '@assets/data/content/profile.json';
import education from '@assets/data/content/education.json';

export const PROFILE = { ...profile, education: `${education[0].shortName} · ${education[0].expected}` };
