"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

export default function ConfettiEffect() {
  useEffect(() => {
    const duration = 3000;
    const end = Date.now() + duration;

    const colors = ["#093CA8", "#B98500", "#146B3A", "#B30B22"];

    function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }

    frame();
  }, []);

  return null;
}
