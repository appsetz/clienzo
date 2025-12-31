"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "Is Clienova free?",
    answer: "Yes, it's free until Feb 22, after that plan will be added.",
  },
  {
    question: "Is Clienova safe to use?",
    answer: "Yes, Clienova is completely safe to use. We use industry-standard security measures including Firebase Authentication and Firestore security rules to protect your data. All your information is encrypted and stored securely.",
  },
  {
    question: "How do I contact customer support if I need help?",
    answer: "You can reach our customer support team through the feedback form in the app, or contact us directly at clienova.app@gmail.com. We're here to help you with any questions or issues you may have.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First FAQ open by default

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      id="faq"
      className="bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 py-16 md:py-24"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Left Side - Heading */}
            <div>
              <div className="inline-block mb-4">
                <span className="px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase text-blue-600 bg-blue-100 border border-blue-300">
                  FAQs
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                All Questions{" "}
                <span className="text-blue-600">Answered</span>
              </h2>
            </div>

            {/* Right Side - FAQ Items */}
            <div className="space-y-4">
              {faqs.map((faq, index) => {
                const isOpen = openIndex === index;
                return (
                  <div
                    key={index}
                    className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => toggleFAQ(index)}
                      className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition"
                    >
                      <span className="text-base md:text-lg font-semibold text-gray-900 pr-4">
                        {faq.question}
                      </span>
                      <div className="flex-shrink-0">
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-blue-600" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-4">
                        <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

