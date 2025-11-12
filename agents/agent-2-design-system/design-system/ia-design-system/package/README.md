# Information Assistant Design System

A comprehensive React component library and design system extracted from the Microsoft PubSec Information Assistant, built for reuse in EVA-DA-2 and other applications.

## 🎨 Features

- **Complete Component Library**: Pre-built React components with TypeScript support
- **Design Tokens**: Consistent color palette, typography, spacing, and styling variables
- **Information Assistant Styling**: Authentic look and feel from the original application
- **Context-Aware Components**: Support for Work, Web, and Compare data sources
- **Responsive Design**: Mobile-first approach with responsive breakpoints
- **Accessibility**: Built with accessibility best practices
- **TypeScript**: Full TypeScript support with comprehensive type definitions

## 📦 Installation

```bash
npm install @eva-da/ia-design-system
```

## 🚀 Quick Start

```tsx
import React from 'react';
import { 
  IAButton, 
  IAPanel, 
  IAChatMessage, 
  IALayout 
} from '@eva-da/ia-design-system';

function App() {
  return (
    <IALayout
      header={<h1>My Application</h1>}
      sidebar={<nav>Navigation</nav>}
    >
      <IAPanel variant="work" title="Work Panel">
        <p>Panel content here</p>
      </IAPanel>
      
      <IAChatMessage role="assistant" source="work">
        Hello! How can I help you today?
      </IAChatMessage>
      
      <IAButton variant="primary">
        Get Started
      </IAButton>
    </IALayout>
  );
}
```

## 🧩 Components

### Core Components

- **IAButton** - Primary button component with multiple variants
- **IASegmentedButton** - Multi-option segmented control
- **IAPanel** - Container panels with contextual styling
- **IAChatMessage** - Chat message bubbles with source indicators
- **IAFileUpload** - File upload with drag & drop support
- **IAInput** - Form input with validation states
- **IALayout** - Application layout with header, sidebar, and content areas

### Design Tokens

The design system includes comprehensive design tokens:

```css
/* Colors */
--ia-color-work: #1B4AEF;        /* Work data source */
--ia-color-web: #188d45;         /* Web data source */
--ia-color-compare: #ce7b2e;     /* Compare data source */

/* Typography */
--ia-font-family-primary: "Segoe UI", sans-serif;
--ia-font-size-base: 1rem;

/* Spacing */
--ia-spacing-md: 0.75rem;
--ia-spacing-lg: 1rem;
```

## 🎯 Component Examples

### Buttons

```tsx
// Primary button
<IAButton variant="primary">Save Changes</IAButton>

// Segmented button group
<IASegmentedButton
  options={[
    { key: 'work', text: 'Work' },
    { key: 'web', text: 'Web' },
    { key: 'compare', text: 'Compare' }
  ]}
  selectedKey="work"
  onChange={(key) => console.log(key)}
/>
```

### Panels

```tsx
// Work panel with contextual styling
<IAPanel 
  variant="work" 
  title="Work Documents"
  subtitle="Enterprise documents and files"
>
  <p>Panel content goes here</p>
</IAPanel>

// Collapsible panel
<IAPanel
  title="Settings"
  collapsible
  defaultExpanded={false}
>
  <p>Collapsible content</p>
</IAPanel>
```

### Chat Messages

```tsx
// Assistant message with work source
<IAChatMessage 
  role="assistant" 
  source="work"
  timestamp={new Date()}
>
  Here's the information from your work documents...
</IAChatMessage>

// User message
<IAChatMessage role="user">
  What can you tell me about project timelines?
</IAChatMessage>
```

### File Upload

```tsx
<IAFileUpload
  accept=".pdf,.docx,.txt"
  multiple
  maxSize={10 * 1024 * 1024} // 10MB
  onFileSelect={(files) => console.log('Selected:', files)}
  onFileUpload={async (file) => {
    // Handle upload
    await uploadFile(file);
  }}
/>
```

### Layout

```tsx
<IALayout
  header={
    <div>
      <h1>Information Assistant</h1>
      <nav>Header navigation</nav>
    </div>
  }
  sidebar={
    <div>
      <h2>Sidebar</h2>
      <ul>
        <li>Navigation item 1</li>
        <li>Navigation item 2</li>
      </ul>
    </div>
  }
  footer={<p>&copy; 2025 EVA-DA Team</p>}
>
  <h2>Main Content</h2>
  <p>Your application content goes here</p>
</IALayout>
```

## 🎨 Customization

### CSS Custom Properties

All design tokens are available as CSS custom properties and can be overridden:

```css
:root {
  --ia-color-primary-blue: #0066cc; /* Override primary color */
  --ia-font-family-primary: "Inter", sans-serif; /* Override font */
  --ia-border-radius-lg: 12px; /* Override border radius */
}
```

### Theme Variants

Components support different variants for different contexts:

```tsx
// Panel variants for different data sources
<IAPanel variant="work">Work content</IAPanel>
<IAPanel variant="web">Web content</IAPanel>
<IAPanel variant="compare">Compare content</IAPanel>

// Button variants
<IAButton variant="primary">Primary</IAButton>
<IAButton variant="secondary">Secondary</IAButton>
<IAButton variant="outline">Outline</IAButton>
<IAButton variant="ghost">Ghost</IAButton>
```

## 📱 Responsive Design

All components are built with mobile-first responsive design:

- **Mobile**: 320px - 767px
- **Tablet**: 768px - 1023px  
- **Desktop**: 1024px+

The layout component automatically adapts:
- Collapsible sidebar on mobile
- Responsive header with hamburger menu
- Flexible content areas

## ♿ Accessibility

Components follow WCAG 2.1 AA guidelines:

- Keyboard navigation support
- Screen reader compatibility
- Focus management
- ARIA attributes
- Color contrast compliance

## 📚 Development

### Building the Package

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Related

- [PubSec Information Assistant](https://github.com/microsoft/PubSec-Info-Assistant)
- [EVA-DA-2 Repository](https://github.com/your-org/EVA-DA-2)

---

Built with ❤️ by the EVA-DA Team
