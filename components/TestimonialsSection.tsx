"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import Image from "next/image";
import { getReviews, Review } from "@/lib/firebase/db";

// --- Types ---
interface Testimonial {
  text: string;
  name: string;
  role?: string;
  rating: number;
  image?: string;
}

// --- Sub-Components ---
const TestimonialsColumn = (props: {
  className?: string;
  testimonials: Testimonial[];
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.ul
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6 bg-transparent transition-colors duration-300 list-none m-0 p-0"
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.testimonials.map(({ text, image, name, role, rating }, i) => (
                <motion.li
                  key={`${index}-${i}`}
                  aria-hidden={index === 1 ? "true" : "false"}
                  tabIndex={index === 1 ? -1 : 0}
                  whileHover={{
                    scale: 1.03,
                    y: -8,
                    boxShadow:
                      "0 25px 50px -12px rgba(0, 0, 0, 0.12), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.05)",
                    transition: { type: "spring", stiffness: 400, damping: 17 },
                  }}
                  whileFocus={{
                    scale: 1.03,
                    y: -8,
                    boxShadow:
                      "0 25px 50px -12px rgba(0, 0, 0, 0.12), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.05)",
                    transition: { type: "spring", stiffness: 400, damping: 17 },
                  }}
                  className="p-10 rounded-3xl border border-neutral-200 shadow-lg shadow-black/5 max-w-xs w-full bg-white transition-all duration-300 cursor-default select-none group focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                >
                  <blockquote className="m-0 p-0">
                    {/* Star Rating */}
                    <div className="flex items-center gap-1 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= rating
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>

                    <p className="text-neutral-600 leading-relaxed font-normal m-0 transition-colors duration-300">
                      {text}
                    </p>
                    <footer className="flex items-center gap-3 mt-6">
                      {image ? (
                        <Image
                          width={40}
                          height={40}
                          src={image}
                          alt={`Avatar of ${name}`}
                          className="h-10 w-10 rounded-full object-cover ring-2 ring-neutral-100 group-hover:ring-purple-500/30 transition-all duration-300 ease-in-out"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm ring-2 ring-neutral-100 group-hover:ring-purple-500/30 transition-all duration-300">
                          {name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <cite className="font-semibold not-italic tracking-tight leading-5 text-neutral-900 transition-colors duration-300">
                          {name}
                        </cite>
                        {role && (
                          <span className="text-sm leading-5 tracking-tight text-neutral-500 mt-0.5 transition-colors duration-300">
                            {role}
                          </span>
                        )}
                      </div>
                    </footer>
                  </blockquote>
                </motion.li>
              ))}
            </React.Fragment>
          )),
        ]}
      </motion.ul>
    </div>
  );
};

const TestimonialsSection = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const reviewsData = await getReviews(20);
        setReviews(reviewsData);
      } catch (error) {
        console.error("Error loading reviews:", error);
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, []);

  // Convert reviews to testimonials format
  const testimonials: Testimonial[] = reviews.map((review) => ({
    text: review.comment || review.features_requested || "Great experience using Clienova!",
    name: review.user_name || "Anonymous",
    role: review.features_requested ? "Clienova User" : undefined,
    rating: review.rating || 5,
    image: undefined, // We'll use initials instead
  }));

  // Show loading state with full structure
  if (loading) {
    return (
      <section
        aria-labelledby="testimonials-heading"
        className="bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 py-24 relative overflow-hidden"
      >
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{
            duration: 1.2,
            ease: [0.16, 1, 0.3, 1],
            opacity: { duration: 0.8 },
          }}
          className="container px-4 z-10 mx-auto"
        >
          <div className="flex flex-col items-center justify-center max-w-[540px] mx-auto">
            <div className="flex justify-center">
              <div className="border border-purple-300 py-1 px-4 rounded-full text-xs font-semibold tracking-wide uppercase text-purple-600 bg-purple-100/50 transition-colors">
                Testimonials
              </div>
            </div>

            <h2
              id="testimonials-heading"
              className="text-4xl md:text-5xl font-extrabold tracking-tight mt-6 text-center text-gray-900 transition-colors"
            >
              What our users say
            </h2>
            <p className="text-center mt-5 text-gray-600 text-lg leading-relaxed max-w-sm transition-colors">
              Loading testimonials...
            </p>
          </div>
        </motion.div>
      </section>
    );
  }

  // Show section even if no reviews (with empty state)
  if (testimonials.length === 0) {
    return (
      <section
        aria-labelledby="testimonials-heading"
        className="bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 py-24 relative overflow-hidden"
      >
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{
            duration: 1.2,
            ease: [0.16, 1, 0.3, 1],
            opacity: { duration: 0.8 },
          }}
          className="container px-4 z-10 mx-auto"
        >
          <div className="flex flex-col items-center justify-center max-w-[540px] mx-auto">
            <div className="flex justify-center">
              <div className="border border-purple-300 py-1 px-4 rounded-full text-xs font-semibold tracking-wide uppercase text-purple-600 bg-purple-100/50 transition-colors">
                Testimonials
              </div>
            </div>

            <h2
              id="testimonials-heading"
              className="text-4xl md:text-5xl font-extrabold tracking-tight mt-6 text-center text-gray-900 transition-colors"
            >
              What our users say
            </h2>
            <p className="text-center mt-5 text-gray-600 text-lg leading-relaxed max-w-sm transition-colors">
              Be the first to share your experience with Clienova!
            </p>
          </div>
        </motion.div>
      </section>
    );
  }

  // Split testimonials into columns
  const firstColumn = testimonials.slice(0, Math.ceil(testimonials.length / 3));
  const secondColumn = testimonials.slice(
    Math.ceil(testimonials.length / 3),
    Math.ceil((testimonials.length * 2) / 3)
  );
  const thirdColumn = testimonials.slice(Math.ceil((testimonials.length * 2) / 3));

  return (
    <section
      aria-labelledby="testimonials-heading"
      className="bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 py-24 relative overflow-hidden"
    >
      <motion.div
        initial={{ opacity: 0, y: 50, rotate: -2 }}
        whileInView={{ opacity: 1, y: 0, rotate: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{
          duration: 1.2,
          ease: [0.16, 1, 0.3, 1],
          opacity: { duration: 0.8 },
        }}
        className="container px-4 z-10 mx-auto"
      >
        <div className="flex flex-col items-center justify-center max-w-[540px] mx-auto mb-16">
          <div className="flex justify-center">
            <div className="border border-purple-300 py-1 px-4 rounded-full text-xs font-semibold tracking-wide uppercase text-purple-600 bg-purple-100/50 transition-colors">
              Testimonials
            </div>
          </div>

          <h2
            id="testimonials-heading"
            className="text-4xl md:text-5xl font-extrabold tracking-tight mt-6 text-center text-gray-900 transition-colors"
          >
            What our users say
          </h2>
          <p className="text-center mt-5 text-gray-600 text-lg leading-relaxed max-w-sm transition-colors">
            Discover how thousands of teams streamline their operations with Clienova.
          </p>
        </div>

        <div
          className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)] max-h-[740px] overflow-hidden"
          role="region"
          aria-label="Scrolling Testimonials"
        >
          {firstColumn.length > 0 && (
            <TestimonialsColumn testimonials={firstColumn} duration={15} />
          )}
          {secondColumn.length > 0 && (
            <TestimonialsColumn
              testimonials={secondColumn}
              className="hidden md:block"
              duration={19}
            />
          )}
          {thirdColumn.length > 0 && (
            <TestimonialsColumn
              testimonials={thirdColumn}
              className="hidden lg:block"
              duration={17}
            />
          )}
        </div>
      </motion.div>
    </section>
  );
};

export default TestimonialsSection;

