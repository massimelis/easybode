# Easybode

**Easybode** is an interactive web application designed for the analysis and control of dynamic systems.
  By entering the desired transfer function into the designated input field, the application calculates and displays the key graphical and analytical tools used in control systems and system theory.

**Try the live application:** https://www.easybode.com

---

## Key Features

- **Bode Plots (Magnitude and Phase):**
  - Automatic plotting of both **actual (exact)** and **asymptotic** response curves.
  - Individual visualization and graphical decomposition of all single components (gain, poles, zeros, time constants).
- **Other Control Plots:**
  - Nyquist Plot
  - Nichols Chart
- **Time Response Analysis:**
  - Simulation of the system response to standard input signals: **step**, **ramp**, **impulse**, **sinusoidal input**, etc.
- **Integrated Documentation:**
  - A comprehensive theoretical reference page explaining the physical and mathematical significance of all calculated elements, covering the fundamentals of dynamic systems analysis.
- **PDF Generation:**
  - Instant PDF export containing all analysis outputs generated from the transfer function, pre-formatted for print and study.
- **Language Selector:**
  - A dedicated language switcher allowing users to translate the entire site (excluding documentation) into 10 languages: English, Chinese, Hindi, German, French, Italian, Spanish, Portuguese, Japanese, and Arabic.

---

## Technologies Used

The application is built using modern web standards:

- **HTML5** & **CSS3**
- **Tailwind CSS** (for graph styling and responsive layout)
- **JavaScript (ES6+)** (for computational logic and chart rendering)

---

## Transfer Function Input Format

Examples:
- Type `10(s+5)(s+100)/(s+10)` to enter a first-order stable system with zeros, poles, and gain.
- Type `10/(s-2)` to enter an unstable system with right-half-plane poles.

---

## 🔒 License & Copyright

© 2026 **Your Name / Your Username**. All rights reserved.

This software and its associated documentation are the exclusive property of the author. **No part of this code** may be copied, modified, distributed, reused, licensed, or sold, in whole or in part, for commercial or non-commercial purposes, without the express written permission of the author.
