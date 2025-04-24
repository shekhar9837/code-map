# CodeMap - Your Personal Learning Roadmap

CodeMap is an intelligent learning platform that creates personalized roadmaps for programming topics. It curates high-quality resources including GitHub repositories, blog articles, and YouTube videos to help you master any programming concept effectively.

## Features

- 🎯 Generate personalized learning roadmaps for any programming topic
- 📚 Get curated resources from multiple sources:
  - GitHub repositories with practical examples
  - Blog articles for in-depth understanding
  - YouTube videos for visual learning
- 🔒 Secure authentication with Supabase
- 📱 Responsive design for all devices
- 🌙 Dark mode support
- 📊 Track your learning progress
- 💾 Save and revisit your roadmaps

## Getting Started

First, set up your environment variables by copying `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in the required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `GEMINI_API_KEY`: Google's Gemini AI API key
- `YOUTUBE_API_KEY`: YouTube Data API key
- `GITHUB_TOKEN`: GitHub Personal Access Token

Then install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to start using CodeMap.

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Database & Auth**: Supabase
- **Styling**: Tailwind CSS
- **AI Integration**: Google Gemini
- **Form Handling**: React Hook Form with Zod
- **UI Components**: Radix UI
- **API Integration**: YouTube Data API, GitHub API

## Deployment

The application is deployed on Vercel. The production version is available at:
[https://code-map.shekharcodes.tech](https://code-map.shekharcodes.tech)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the ISC License.

## Author

Created by Shekhar
