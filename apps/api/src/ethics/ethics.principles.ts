export type EthicsPrinciple = {
  number: number;
  title: string;
  description: string;
};

/** 10 principles from PROFESSIONAL_ETHICS_SITE_SUPERVISOR.txt */
export const ETHICS_VERSION = 'v1';

export const ETHICS_PRINCIPLES: EthicsPrinciple[] = [
  {
    number: 1,
    title: 'PRIORITIZE PUBLIC SAFETY',
    description: 'Protect the lives, health, and welfare of the public above all else.',
  },
  {
    number: 2,
    title: 'BE HONEST & TRANSPARENT',
    description: 'Never falsify reports, test results, or project data.',
  },
  {
    number: 3,
    title: 'MAINTAIN PROFESSIONAL COMPETENCE',
    description: 'Continuously improve your technical knowledge and skills.',
  },
  {
    number: 4,
    title: 'FOLLOW CODES & STANDARDS',
    description: 'Always comply with applicable engineering codes and regulations.',
  },
  {
    number: 5,
    title: 'ENSURE QUALITY WORKMANSHIP',
    description: 'Never compromise quality for cost or schedule.',
  },
  {
    number: 6,
    title: 'RESPECT ENVIRONMENTAL SUSTAINABILITY',
    description: 'Minimize environmental impact and promote sustainable construction.',
  },
  {
    number: 7,
    title: 'AVOID CONFLICTS OF INTEREST',
    description: 'Make decisions based on professional judgment, not personal gain.',
  },
  {
    number: 8,
    title: 'RESPECT CONFIDENTIAL INFORMATION',
    description:
      'Protect client and project information unless disclosure is legally required.',
  },
  {
    number: 9,
    title: 'TREAT EVERYONE FAIRLY',
    description:
      'Respect clients, contractors, workers, and colleagues without discrimination.',
  },
  {
    number: 10,
    title: 'TAKE RESPONSIBILITY',
    description: 'Admit mistakes, correct them promptly, and learn from them.',
  },
];

export const ETHICS_QUOTE = {
  author: 'ABRAHAM A. LAUCARIE — PM',
  text: 'A great site engineer/supervisor is measured not only by technical expertise but also by integrity, responsibility, and ethical decision making',
};
