# R_Wreframing

A wireframing tool specifically designed for creating Power BI project layouts and mockups.

## Features

- 🎨 **Drag & Drop Interface** - Easily place Power BI components on the canvas
- 📊 **Power BI Components** - Pre-built components matching Power BI visuals:
  - Tables
  - Bar Charts
  - Pie Charts
  - Gauges
  - Slicers
  - Cards
- 🔄 **Interactive Canvas** - Pan, zoom, and connect components
- 💾 **Export Wireframes** - Save and share your designs

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`

## Usage

1. **Drag Components**: Select a Power BI component from the left sidebar and drag it onto the canvas
2. **Position Visuals**: Move components around to create your desired layout
3. **Connect Elements**: Click and drag from connection points to show data flow
4. **Customize**: Click on components to modify their properties

## Project Structure

```
r_wreframing/
├── src/
│   ├── components/
│   │   ├── WireframeCanvas.tsx  # Main canvas component
│   │   ├── Toolbar.tsx          # Component sidebar
│   │   └── nodes/
│   │       └── PowerBINode.tsx  # Power BI visual node
│   ├── types/
│   │   └── index.ts             # TypeScript type definitions
│   ├── App.tsx                  # Main app component
│   ├── App.css                  # App styles
│   ├── main.tsx                 # App entry point
│   └── index.css                # Global styles
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Technologies Used

- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Flow** - Canvas and node management
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Customization

To add new Power BI components:

1. Add the component type to `src/types/index.ts`
2. Add the component to the toolbar in `src/components/Toolbar.tsx`
3. Update the icon mapping in `src/components/nodes/PowerBINode.tsx`

## Future Enhancements

- [ ] Save/Load wireframes
- [ ] Export to PDF/PNG
- [ ] Component properties panel
- [ ] Templates for common layouts
- [ ] Collaboration features
- [ ] Dark mode

## License

This project is for personal/internal use.

---

Built with ❤️ for Power BI wireframing
