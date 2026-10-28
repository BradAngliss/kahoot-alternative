import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/mdx-components.tsx',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Outlines, hard shadows and text on light surfaces
        ink: '#1a1033',
        // The violet background behind the game screens
        stage: {
          light: '#6d3cf0',
          DEFAULT: '#4b1fb8',
          dark: '#2e0f7a',
        },
        // Light background for the host dashboard
        mist: '#f4f1ff',
        // Answer colours, in choice order
        choice: {
          red: '#ff5c7a',
          blue: '#4d94ff',
          yellow: '#ffc93c',
          green: '#2fd9a5',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        // Solid offset shadow used on cards, buttons and answer tiles
        chunky: '0 4px 0 0 #1a1033',
        'chunky-lg': '0 6px 0 0 #1a1033',
      },
      keyframes: {
        'pop-in': {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'pop-in': 'pop-in 200ms ease-out',
      },
    },
  },
  plugins: [],
}
export default config
