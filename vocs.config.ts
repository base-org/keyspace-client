import { defineConfig } from 'vocs';

export default defineConfig({
  title: 'Keyspace',
  description: 'Key and configuration management for cross-chain applications',
  topNav: [
    {
      text: 'Github',
      link: 'https://github.com/niran/scw-tx/tree/keyspace-beta',
    },
  ],
  sidebar: [
    {
      text: 'Getting Started',
      link: '/',
    },
    {
      text: 'Deployments',
      link: '/deployments',
    },
    {
      text: 'Releases',
      link: '/releases',
    },
    {
      text: 'Architecture',
      link: '/architecture',
    },
    {
      text: 'Using Keyspace',
      items: [
        {
          text: 'Authentication & Circuits',
          link: '/authentication',
        },
        {
          text: 'Contracts',
          link: '/contracts',
        },
        {
          text: 'Clients',
          link: '/clients',
        },
        {
          text: 'Web Services',
          link: '/web-services',
        }
      ]
    },
    {
      text: 'Operating Keyspace',
      items: [
        {
          text: 'Rollup Sequencing',
          link: '/sequencing',
        },
        {
          text: 'Syncing to L2',
          link: '/syncing-l2',
        },
        {
          text: 'Syncing to Other L1s',
          link: '/syncing-other-l1',
        },
        {
          text: 'Running Nodes',
          link: '/nodes',
        },
        {
          text: 'Incident Response',
          link: '/incident-response',
        }
      ]
    },
    {
      text: 'Roadmap',
      link: '/roadmap',
    },
    {
      text: 'Gas Estimates',
      link: '/gas-estimates',
    },
    {
      text: 'Original Specification',
      link: '/original-spec',
    },
    {
      text: 'References',
      link: '/references',
    },
  ],
});
