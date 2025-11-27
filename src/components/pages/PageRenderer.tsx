import React from 'react';

interface PageRendererProps {
  title: string;
  content: string;
  template?: string;
}

// Simple renderer: splits content into paragraphs by blank lines; supports basic markdown (**bold**, *italic*)
export function PageRenderer({ title, content, template = 'default' }: PageRendererProps) {
  const blocks = content.split(/\n\n+/).map(b => b.trim()).filter(Boolean);
  const renderInline = (text: string) => {
    // very minimal markdown replacements
    const withBold = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    const withItalics = withBold.replace(/\*(.*?)\*/g, '<em>$1</em>');
    return withItalics;
  };

  const containerClass = 
    template === 'full-width' ? 'max-w-full' :
    template === 'centered' ? 'max-w-3xl mx-auto text-center' :
    template === 'sidebar' ? 'max-w-7xl mx-auto grid lg:grid-cols-3 gap-8' :
    'max-w-none';

  const articleClass = template === 'sidebar' ? 'lg:col-span-2' : '';

  return (
    <div className={containerClass}>
      <article className={`prose prose-lg prose-headings:font-semibold prose-p:leading-relaxed dark:prose-invert ${articleClass}`}>
        <h1>{title}</h1>
        {blocks.map((blk, i) => (
          <p key={i} dangerouslySetInnerHTML={{ __html: renderInline(blk) }} />
        ))}
      </article>
      {template === 'sidebar' && (
        <aside className="space-y-4">
          <div className="glossy-card p-4">
            <h3 className="font-semibold mb-2">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/contact" className="text-blue-600 hover:underline">Contact Us</a></li>
              <li><a href="/automotive" className="text-blue-600 hover:underline">Automotive Services</a></li>
              <li><a href="/property" className="text-blue-600 hover:underline">Property Management</a></li>
            </ul>
          </div>
        </aside>
      )}
    </div>
  );
}

export default PageRenderer;
