import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const posters = [
  "/assets/poster1.png",
  "/assets/poster2.png",
  "/assets/poster3.png",
  "/assets/poster4.jpg",
];

export default function Slideshow() {
  const [index, setIndex] = useState(0);
  const totalSlides = posters.length;

  // Auto-slide every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % totalSlides);
    }, 3000);

    return () => clearInterval(interval);
  }, [totalSlides]);

  function prevSlide() {
    setIndex((i) => (i === 0 ? totalSlides - 1 : i - 1));
  }

  function nextSlide() {
    setIndex((i) => (i === totalSlides - 1 ? 0 : i + 1));
  }

  return (
    <div className="slideshow-container">
      <button className="nav-btn left" onClick={prevSlide}>
        <ChevronLeft size={28} />
      </button>

      <div className="slides-wrapper">
        <div
          className="slides-track"
          style={{
            transform: `translateX(-${index * 100}%)`,
          }}
        >
          {posters.map((src, i) => (
            <div key={i} className="slide">
              <img src={src} alt={`Slide ${i + 1}`} />
            </div>
          ))}
        </div>
      </div>

      <button className="nav-btn right" onClick={nextSlide}>
        <ChevronRight size={28} />
      </button>
    </div>
  );
}
