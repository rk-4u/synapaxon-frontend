import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(CustomEase);

const ECGHero = () => {
  const mainSVGRef = useRef(null);
  const pulseLineRef = useRef(null);

  useEffect(() => {
    const mainSVG = mainSVGRef.current;
    const pulseLine = pulseLineRef.current;

    if (!mainSVG || !pulseLine) return;

    const numPoints = 400;
    const width = numPoints * 2;
    const allPoints = [];

    // Clear any existing points
    while (pulseLine.points.length > 0) {
      pulseLine.points.removeItem(0);
    }

    for (let i = 0; i < numPoints; i++) {
      let p = mainSVG.createSVGPoint();
    //   p.y = 320; // baseline
      p.y = 280; // baseline
      pulseLine.points.appendItem(p);
      allPoints.push(p);
    }

    gsap.set(allPoints, {
      x: (i) => width - (i * (width / numPoints)),
    });

    CustomEase.create(
      "pulse",
      "M0,0 C0.051,0 0.076,0 0.076,0 0.11,0 0.144,0.011 0.158,0.038 0.181,0.083 0.184,0.114 0.194,0.164 0.206,0.217 0.234,0.208 0.241,0.152 0.252,0.065 0.263,-0.021 0.274,-0.108 0.28,-0.158 0.306,-0.152 0.309,-0.1 0.333,0.266 0.357,0.633 0.38,1 0.382,1.032 0.4,1.032 0.402,1 0.428,0.471 0.455,-0.056 0.481,-0.585 0.482,-0.617 0.5,-0.62 0.503,-0.588 0.528,-0.329 0.553,-0.07 0.578,0.188 0.586,0.258 0.619,0.279 0.636,0.223 0.649,0.179 0.662,0.135 0.675,0.091 0.69,0.041 0.715,0.029 0.736,0.061 0.752,0.088 0.768,0.114 0.784,0.141 0.798,0.164 0.818,0.167 0.832,0.144 0.849,0.118 0.867,0.093 0.884,0.067 0.91,0.026 0.922,0.021 0.945,0.011 0.962,0.003 0.99,0 1,0"
    );

    const animation = gsap.to(allPoints, {
        duration: 8, // longer duration = slower wave movement
        y: "-=100",
        stagger: {
            each: 0.06,   // increase this to slow down the wave progression
            repeat: -1,
            repeatDelay: 0.5, // slight pause between loops
        },
        ease: "pulse",
    });

    animation.seek(1000);

    return () => {
      animation.kill();
    };
  }, []);

return (
    <div className="w-screen h-screen overflow-hidden bg-white dark:bg-[#141c2a] flex justify-center items-center relative">

        <svg
            ref={mainSVGRef}
            id="mainSVG"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 800 600"
            style={{
                width: "100vw",
                height: "100vh",
                display: "block",
            }}
            preserveAspectRatio="xMidYMid slice"
        >
            <defs>
                <pattern
                    id="sqrs"
                    width="20"
                    height="20"
                    patternUnits="userSpaceOnUse"
                    viewBox="0 0 40 40"
                >
                    <rect
                        x="0"
                        y="0"
                        width="40"
                        height="40"
                        stroke="#FFF"
                        fill="none"
                    />
                </pattern>
                <filter id="glow" x="-100%" y="-100%" width="250%" height="250%">
                    <feGaussianBlur stdDeviation="8" result="coloredBlur" />
                    <feOffset dx="0" dy="0" result="offsetblur" />
                    <feFlood id="glowAlpha" floodColor="#FFF" floodOpacity="1" />
                    <feComposite in2="offsetblur" operator="in" />
                    <feMerge>
                        <feMergeNode />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            <g filter="url(#glow)">
                <rect fill="url(#sqrs)" width="800" height="600" opacity="0.1" />
                <polyline
                    ref={pulseLineRef}
                    id="pulseLine"
                    stroke="#C7F8E4"
                    strokeWidth="2"
                    fill="none"
                    opacity="0.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </g>
        </svg>

        <div
        className="absolute inset-0 z-0 bg-white/20 dark:bg-gray-800/20 dark:backdrop-blur-sm"
        />

        <div
            className="absolute z-10 text-white p-6 text-center"
            style={{
                width: "100%",
                top: "50%",
                transform: "translateY(-50%)",
            }}
        >

            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl lg:text-6xl z-10 relative">
                Elevate Your Learning Experience
            </h1>
            <p className="mt-6 max-w-lg mx-auto text-xl text-gray-500 dark:text-gray-300 z-10 relative">
                Create, share, and master knowledge with Synapaxon's powerful quiz platform.
            </p>
            <div className="mt-10 flex justify-center space-x-4 z-10 relative">
                <a
                    href="/register"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium shadow-sm text-white bg-indigo-500 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-500 rounded-full transition-all duration-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                    Get Started
                </a>
                <a
                    href="#features"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium text-indigo-500 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/50 hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded-full transition-all duration-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                    Learn More
                </a>
            </div>
        </div>
    </div>
);
};

export default ECGHero;
