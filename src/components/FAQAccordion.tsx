import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
  className?: string;
}

const FAQAccordion: React.FC<FAQAccordionProps> = ({ items, className }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className={`space-y-4 ${className || ''}`}>
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const buttonId = `faq-button-${index}`;
        const contentId = `faq-content-${index}`;

        return (
          <div key={index} className="border border-white/10 rounded-xl overflow-hidden">
            <button
              id={buttonId}
              aria-expanded={isOpen}
              aria-controls={contentId}
              onClick={() => toggleItem(index)}
              className="w-full text-left p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <span className="font-semibold">{item.question}</span>
              <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
            <div
              id={contentId}
              aria-labelledby={buttonId}
              className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96' : 'max-h-0'}`}
            >
              <div className="px-6 pb-6">
                <p className="text-white/70 leading-relaxed">{item.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FAQAccordion;