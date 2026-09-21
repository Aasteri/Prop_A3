import type { Metadata } from 'next';
import { ProjectsClient } from './projects-client';
import { fetchPublicProjects } from '@/lib/public-server';

export const metadata: Metadata = {
  title: 'Construction projects in Abuja',
  description:
    'See active Triple A Realty construction projects across Abuja with milestone progress — Guzape, Jikwoyi, and more on Propa3.',
  alternates: { canonical: '/projects' },
  openGraph: {
    title: 'Construction projects in Abuja | Propa3',
    description: 'Open-book project progress from Triple A Realty Projects Ltd.',
    url: '/projects',
  },
};

export default async function PublicProjectsPage() {
  const projects = (await fetchPublicProjects()) ?? [];
  return <ProjectsClient initialProjects={projects} />;
}
