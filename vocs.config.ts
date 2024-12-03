import { defineConfig } from 'vocs';

export default defineConfig({
  title: 'Keyspace',
  description: 'Key and configuration management for cross-chain applications',
  topNav: [
    {
      text: 'Github',
      link: 'https://github.com/base-org/keyspace-client',
    },
  ],
  sidebar: [
    {
      text: 'Getting Started',
      link: '/',
    },
    {
      text: 'Using Keyspace',
      items: [
        {
          text: 'Keystore Basics',
          link: '/keystore-basics',
        },
        {
          text: 'Updating Your Keystore',
          link: '/updating-keystore',
        },
        {
          text: 'Using New Signers',
          link: '/using-new-signers',
        },
        {
          text: 'Revoking Signers',
          link: '/revoking-signers',
        },
        {
          text: 'Maintaining Wallets',
          link: '/maintaining-wallets',
        },
      ]
    },
    {
      text: 'Releases',
      link: '/releases',
    },
    {
      text: 'Roadmap',
      link: '/roadmap',
    },
    {
      text: 'References',
      link: '/references',
    },
  ],
});
