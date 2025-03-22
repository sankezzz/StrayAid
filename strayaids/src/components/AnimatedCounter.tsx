
import React, { useState, useEffect, useRef } from 'react';

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  className?: string;
  formatter?: (value: number) => string;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ 
  end, 
  duration = 2000, 
  className = '', 
  formatter = (value) => value.toString()
}) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // Reset start time
    startTimeRef.current = null;
    
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }
      
      const progress = timestamp - startTimeRef.current;
      const progressPercent = Math.min(progress / duration, 1);
      
      // Use easeOutExpo for smoother animation towards the end
      const easeOutExpo = 1 - Math.pow(2, -10 * progressPercent);
      const currentCount = Math.floor(easeOutExpo * end);
      
      if (currentCount !== countRef.current) {
        countRef.current = currentCount;
        setCount(currentCount);
      }
      
      if (progressPercent < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [end, duration]);

  return (
    <span className={className}>
      {formatter(count)}
    </span>
  );
};

export default AnimatedCounter;
