# 🚀 Advanced Notes App

A modern, feature-rich note-taking application built with Svelte and TailwindCSS. Features rich text editing, drawing capabilities, advanced search, and a beautiful responsive interface with dark mode support.

## ✨ Features

### 📝 Rich Text Editing
- **TipTap Editor Integration**: Professional-grade rich text editing
- **Formatting Options**: Bold, italic, headers (H1-H3), bullet/numbered lists
- **Keyboard Shortcuts**: Standard editor shortcuts (Ctrl+B, Ctrl+I, etc.)
- **Auto-save**: Automatic saving with 500ms debounce
- **Undo/Redo**: Complete history management

### 🎨 Drawing & Visual Features
- **Integrated Drawing Canvas**: Draw directly within notes using Rough.js
- **Drawing Tools**: Pen, shapes (rectangle, circle, line), eraser
- **Customizable Styling**: Adjustable stroke width, colors, and roughness
- **Drawing Management**: Save, edit, and delete drawings
- **Visual Integration**: Seamlessly embed drawings with text content

### 🗂️ Organization & Search
- **Full-text Search**: Search across all note titles and content with Fuse.js
- **Tag System**: Add and filter notes by custom tags
- **Pinning**: Pin important notes to the top
- **Smart Sorting**: Sort by title, creation date, or modification date
- **Advanced Filtering**: Combine search with tag filters

### 🎯 User Experience
- **Command Palette**: Quick access to all features (Ctrl+K)
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Dark Mode**: System-aware theme switching with manual override
- **Accessibility**: Full keyboard navigation, ARIA labels, screen reader support
- **Progressive Web App**: Install as native app with offline capabilities

### ⚡ Performance & Technical
- **Local Storage**: All data stored locally in the browser
- **Auto-save**: Never lose your work with intelligent auto-saving
- **Optimistic Updates**: Instant UI feedback for all operations
- **Code Splitting**: Optimized bundle loading for fast startup
- **Service Worker**: Offline functionality and caching

## 🛠️ Tech Stack

- **Frontend Framework**: [Svelte](https://svelte.dev) + [SvelteKit](https://kit.svelte.dev)
- **Styling**: [TailwindCSS](https://tailwindcss.com) with custom design system
- **Rich Text Editor**: [TipTap](https://tiptap.dev) with Svelte integration
- **Drawing**: [Rough.js](https://roughjs.com) for hand-drawn aesthetic
- **Search**: [Fuse.js](https://fusejs.io) for fuzzy search capabilities
- **Icons**: [Lucide Svelte](https://lucide.dev/guide/packages/lucide-svelte)
- **Build Tool**: [Vite](https://vitejs.dev) for fast development and building
- **Deployment**: Static site generation for easy hosting

## 🚀 Quick Start

### Prerequisites

- **Node.js**: v18 or higher
- **npm**: v8 or higher (or pnpm/yarn equivalent)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/advanced-notes-app.git
   cd advanced-notes-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   ```
   http://localhost:3000
   ```
5. **Start Services with Docker Compose

       docker-compose up -d

### Build for Production

```bash
# Build the application
npm run build

# Preview the production build
npm run preview

# Deploy the 'build' directory to your hosting provider
```

## 📁 Project Structure

```
src/
├── lib/
│   ├── components/
│   │   ├── ui/                 # Reusable UI components
│   │   │   ├── Button.svelte
│   │   │   ├── Modal.svelte
│   │   │   └── SearchBar.svelte
│   │   ├── layout/             # Layout components
│   │   │   ├── Sidebar.svelte
│   │   │   ├── NotesList.svelte
│   │   │   └── MainEditor.svelte
│   │   ├── editor/             # Editor components
│   │   │   ├── RichTextEditor.svelte
│   │   │   └── CommandPalette.svelte
│   │   └── drawing/            # Drawing components
│   │       └── DrawingCanvas.svelte
│   ├── stores/                 # Svelte stores for state management
│   │   ├── notesStore.js       # Notes data and operations
│   │   ├── themeStore.js       # Theme and preferences
│   │   └── editorStore.js      # Editor state and preferences
│   └── utils/                  # Utility functions
│       ├── debounce.js         # Debouncing utilities
│       ├── shortcuts.js        # Keyboard shortcuts system
│       ├── storage.js          # Local storage management
│       └── clickOutside.js     # Click outside detection
├── routes/                     # SvelteKit routes
│   ├── +layout.svelte          # Root layout
│   └── +page.svelte            # Main application page
├── app.css                     # Global styles and TailwindCSS
└── app.html                    # HTML template

static/                         # Static assets
├── manifest.json              # PWA manifest
├── sw.js                      # Service worker
└── icons/                     # App icons and images
```

## 🎮 Usage Guide

### Creating and Editing Notes

1. **Create a New Note**: Click the "New Note" button or use `Ctrl+N`
2. **Edit Title**: Click on the title area to edit
3. **Format Text**: Use the toolbar or keyboard shortcuts:
    - `Ctrl+B` for bold
    - `Ctrl+I` for italic
    - `Ctrl+1/2/3` for headings
    - `Ctrl+Shift+8` for bullet lists
4. **Auto-save**: Changes are automatically saved every 500ms

### Drawing Features

1. **Insert Drawing**: Click the drawing icon in the toolbar
2. **Select Tools**: Choose from pen, shapes, or eraser
3. **Customize**: Adjust colors, stroke width, and roughness
4. **Save**: Click "Save Drawing" to add to your note

### Organization

1. **Add Tags**: Click "Add tag" below the title
2. **Pin Notes**: Use the pin icon to keep important notes at the top
3. **Search**: Use the search bar to find notes by title or content
4. **Filter**: Combine search with tag filters for precise results

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | Create new note |
| `Ctrl+S` | Save current note |
| `Ctrl+F` | Focus search |
| `Ctrl+K` | Open command palette |
| `Ctrl+B` | Bold text |
| `Ctrl+I` | Italic text |
| `Ctrl+1/2/3` | Heading levels |
| `Ctrl+Z/Y` | Undo/Redo |
| `Ctrl+P` | Pin/unpin note |
| `Ctrl+D` | Duplicate note |
| `Ctrl+Shift+D` | Toggle dark mode |

## ⚙️ Configuration

### Customizing Themes

The app supports extensive theming options:

```javascript
// In themeStore.js
const themes = {
  light: { /* light theme colors */ },
  dark: { /* dark theme colors */ },
  system: 'auto' // Follows system preference
};
```

### Editor Preferences

Customize the editor behavior:

```javascript
// In editorStore.js
const preferences = {
  autoSave: true,
  autoSaveDelay: 500,
  showWordCount: true,
  spellCheck: true,
  typewriterMode: false,
  focusMode: false
};
```

### Storage Configuration

Configure local storage behavior:

```javascript
// In storage.js
const storage = new Storage({
  prefix: 'notes-app',
  compress: false,
  maxAge: null // No expiration
});
```

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run dev:host     # Start with network access

# Building
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix linting issues
npm run format       # Format code with Prettier
npm run check        # Type checking with svelte-check

# Testing
npm run test         # Run unit tests
npm run test:ui      # Run tests with UI
npm run test:coverage # Generate coverage report
```

### Development Guidelines

1. **Component Structure**: Follow the established component hierarchy
2. **State Management**: Use Svelte stores for shared state
3. **Styling**: Use TailwindCSS utility classes and design tokens
4. **Accessibility**: Include ARIA labels and keyboard navigation
5. **Performance**: Lazy load heavy components and optimize bundle size

### Adding New Features

1. **Create Component**: Add to appropriate directory in `src/lib/components/`
2. **Add Store**: Create or extend stores in `src/lib/stores/`
3. **Implement Utilities**: Add helper functions to `src/lib/utils/`
4. **Add Shortcuts**: Register keyboard shortcuts in shortcuts system
5. **Update Tests**: Add unit tests for new functionality


### Test Structure

```
src/
├── lib/
│   ├── components/
│   │   └── __tests__/          # Component tests
│   ├── stores/
│   │   └── __tests__/          # Store tests
│   └── utils/
│       └── __tests__/          # Utility tests
└── test/
    ├── setup.js                # Test setup
    └── mocks/                  # Test mocks
```

## 🚀 Deployment

### Static Hosting (Recommended)

The app builds to static files and can be deployed to any static hosting service:



#### GitHub Pages
```bash
npm install --save-dev gh-pages
npm run build
npx gh-pages -d build
```

### Docker Deployment

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🔒 Privacy & Security

- **Local-First**: All data is stored locally in your browser
- **No Analytics**: No tracking or data collection
- **No Backend**: Completely client-side application
- **Secure**: No data transmitted to external servers
- **HTTPS Ready**: Works with any HTTPS deployment

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**: Follow the development guidelines
4. **Add tests**: Ensure new features are tested
5. **Commit changes**: `git commit -m 'Add amazing feature'`
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**: Describe your changes

### Development Setup for Contributors

```bash
# Fork and clone the repo
git clone https://github.com/yourusername/advanced-notes-app.git
cd advanced-notes-app

# Install dependencies
npm install

# Start development server
npm run dev


# Check code quality
npm run lint
npm run check
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Svelte Team**: For the amazing framework
- **TailwindCSS**: For the utility-first CSS framework
- **TipTap**: For the excellent rich text editor
- **Lucide**: For the beautiful icon set
- **Rough.js**: For the hand-drawn drawing aesthetic
- **All Contributors**: Thank you for your contributions!

## 📞 Support

If you encounter any issues or have questions:

1. **Check the documentation** above
2. **Search existing issues** on GitHub
3. **Create a new issue** with detailed information
4. **Join our discussions** for general questions

## 🗺️ Roadmap

### Upcoming Features

- [ ] **Collaboration**: Real-time collaborative editing
- [ ] **Cloud Sync**: Optional cloud storage integration
- [ ] **Templates**: Pre-built note templates
- [ ] **Export Options**: PDF, Markdown, and HTML export
- [ ] **Plugin System**: Extensible plugin architecture
- [ ] **Advanced Drawing**: More drawing tools and shapes
- [ ] **Voice Notes**: Audio recording and transcription
- [ ] **Mobile Apps**: Native iOS and Android applications



---

**Made with ❤️ using Svelte and TailwindCSS**

*Happy note-taking! 📝✨*
