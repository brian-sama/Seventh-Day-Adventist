import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './TruckButton.css';

const TruckButton = ({ 
    onClick, 
    label = 'Send Document', 
    successLabel = 'Sent Successfully',
    disabled = false,
    className = ""
}) => {
    const buttonRef = useRef(null);
    const boxRef = useRef(null);
    const truckRef = useRef(null);
    const [isDone, setIsDone] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    const handleClick = async (e) => {
        if (isDone || isAnimating || disabled) return;
        
        setIsAnimating(true);
        const button = buttonRef.current;
        const box = boxRef.current;
        const truck = truckRef.current;

        // Start Animation Sequence
        button.classList.add('animation');

        const tl = gsap.timeline({
            onComplete: async () => {
                try {
                    // Trigger the actual logic (e.g. API call)
                    await onClick();
                    
                    // Proceed to SUCCESS animation
                    gsap.timeline({
                        onComplete: () => {
                            button.classList.add('done');
                            setIsDone(true);
                            setIsAnimating(false);
                        }
                    }).to(truck, {
                        x: 0,
                        duration: .4
                    }).to(truck, {
                        x: 40,
                        duration: 1
                    }).to(truck, {
                        x: 20,
                        duration: .6
                    }).to(truck, {
                        x: 96,
                        duration: .4
                    });

                    gsap.to(button, {
                        '--progress': 1,
                        duration: 2.4,
                        ease: "power2.in"
                    });
                } catch (err) {
                    // Revert if error
                    button.classList.remove('animation');
                    setIsAnimating(false);
                    console.error("Action failed:", err);
                }
            }
        });

        tl.to(button, {
            '--box-s': 1,
            '--box-o': 1,
            duration: .3,
            delay: .5
        }).to(box, {
            x: 0,
            duration: .4,
            delay: .2 // relative to prev
        }, "-=0.2").to(button, {
            '--hx': -5,
            '--bx': 50,
            duration: .18,
            delay: .1
        }).to(box, {
            y: 0,
            duration: .1,
            delay: .1
        });

        gsap.set(button, {
            '--truck-y': 0,
            '--truck-y-n': -26
        });

        gsap.to(button, {
            '--truck-y': 1,
            '--truck-y-n': -25,
            duration: .2,
            delay: 1.25
        });
    };

    return (
        <button 
            ref={buttonRef}
            className={`truck-button ${isDone ? 'done' : ''} ${isAnimating ? 'animation' : ''} ${className}`}
            onClick={handleClick}
            disabled={disabled}
        >
            <span className="default">{label}</span>
            <span className="success">
                {successLabel}
                <svg viewBox="0 0 12 10">
                    <polyline points="1.5 6 4.5 9 10.5 1"></polyline>
                </svg>
            </span>
            <div className="truck" ref={truckRef}>
                <div className="wheel"></div>
                <div className="back"></div>
                <div className="front"></div>
                <div className="box" ref={boxRef}></div>
            </div>
        </button>
    );
};

export default TruckButton;
