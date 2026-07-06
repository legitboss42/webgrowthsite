"use client";

import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  items: readonly FAQItem[];
  className?: string;
}

const FAQAccordion: React.FC<FAQAccordionProps> = ({ items, className }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className={`space-y-4 ${className || ""}`}>
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const buttonId = `faq-button-${index}`;
        const contentId = `faq-content-${index}`;

        return (
          <div
            key={index}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)]"
          >
            <button
              id={buttonId}
              aria-expanded={isOpen}
              aria-controls={contentId}
              onClick={() => toggleItem(index)}
              className="flex w-full items-center justify-between gap-6 p-6 text-left transition-colors hover:bg-slate-50"
            >
              <span className="font-semibold text-slate-950">{item.question}</span>
              <span
                aria-hidden="true"
                className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
              >
                ▼
              </span>
            </button>
            <div
              id={contentId}
              aria-labelledby={buttonId}
              className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-96" : "max-h-0"}`}
            >
              <div className="px-6 pb-6">
                <p className="leading-relaxed text-slate-600">{item.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FAQAccordion;
