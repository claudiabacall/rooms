/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./app/**/*.{js,jsx}",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      fontSize: {
        'h1': '24px',
        'h2': '20px',
        'body': '16px',
        'caption': '14px',
        'label': '14px',
      },
      fontWeight: {
        'h1': '700', // bold
        'h2': '600', // semibold
        'body': '400', // regular
        'label': '500', // medium
        'caption': '500', // medium
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))", // #276EF1
          foreground: "hsl(var(--primary-foreground))", // #FFFFFF
          light: "hsl(var(--primary-light))", // #EAF0FB
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))", // Azul Claro (alternativo) o Gris Claro
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))", // Gris Claro #F4F4F4
          foreground: "hsl(var(--muted-foreground))", // Gris Texto #666666
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))", // Blanco #FFFFFF
          foreground: "hsl(var(--card-foreground))", // Negro Texto #000000
        },
        'text-primary': 'hsl(var(--text-primary))', // Negro Texto #000000
        'text-secondary': 'hsl(var(--text-secondary))', // Gris Texto #666666
      },
      borderRadius: {
        lg: "12px", // Botones primarios y otros elementos grandes
        md: "10px", // Inputs
        sm: "calc(var(--radius) - 4px)",
        pill: "9999px", // Badges
      },
      boxShadow: {
        'subtle': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', // Elevación sutil para cards
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};