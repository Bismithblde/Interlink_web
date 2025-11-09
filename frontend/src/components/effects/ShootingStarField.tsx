import { CSSProperties, useMemo } from "react";

import "../../styles/shooting-stars.css";

type ShootingStarConfig = {
  top: string;
  left: string;
  delay: number;
  duration: number;
  width: number;
};

type ShootingStarFieldProps = {
  variant?: "container" | "screen";
};

const STAR_CONFIGS: ShootingStarConfig[] = [
  { top: "6%", left: "8%", delay: 0, duration: 3.4, width: 180 },
  { top: "16%", left: "68%", delay: 0.9, duration: 3.7, width: 160 },
  { top: "32%", left: "18%", delay: 1.6, duration: 3.3, width: 190 },
  { top: "44%", left: "72%", delay: 1.2, duration: 3.8, width: 170 },
  { top: "58%", left: "12%", delay: 2.3, duration: 3.5, width: 200 },
  { top: "72%", left: "64%", delay: 3.1, duration: 3.9, width: 210 },
  { top: "84%", left: "26%", delay: 3.8, duration: 3.4, width: 180 },
  { top: "12%", left: "88%", delay: 2.7, duration: 3.9, width: 160 },
];

const ShootingStarField = ({ variant = "container" }: ShootingStarFieldProps) => {
  const stars = useMemo(() => STAR_CONFIGS, []);
  const wrapperClassName =
    variant === "screen"
      ? "schedule-shooting-stars schedule-shooting-stars--screen"
      : "schedule-shooting-stars";

  return (
    <div className={wrapperClassName} aria-hidden="true">
      {stars.map((star, index) => {
        const style: CSSProperties = {
          top: star.top,
          left: star.left,
          animationDelay: `${star.delay}s`,
          animationDuration: `${star.duration}s`,
          width: star.width,
        };

        return <span key={index} className="shooting-star" style={style} />;
      })}
    </div>
  );
};

export default ShootingStarField;

