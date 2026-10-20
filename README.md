# Pendulum Lab

An interactive pendulum simulator for teaching physics, built for phones and desktops. No build step, no dependencies: plain HTML, CSS and JavaScript modules. Vibecoded with Claude, with <3.

## Features

- **Three ropes**: rigid rod (pulls or pushes), string (goes slack and snaps tight), elastic rope (T = k(r − L)).
- **Place and launch** the ball by dragging; swipe to throw it. Pause, step, slow motion (0.1× to 1×).
- **Forces on the ball**: weight, rope force, drag and friction, spring force, net force; components along and across the rope; force polygon.
- **Newton's third law**: forces on the rope, on the support and on the Earth, with numbered pairs.
- **Ball view (non-inertial frame)**: the camera rides on the ball, the apparent force −m·a appears (centrifugal + tangential parts), frame acceleration and effective gravity g − a.
- **Liquid in the ball**: a simple sloshing surface or a 2D particle fluid that shows the apparent forces.
- **Energy bars**: kinetic, gravitational, elastic, spring, dissipated, work of the drive, total.
- **Graphs** of every quantity versus time, phase plot θ–ω, measured period versus the small-angle and exact formulas, CSV export.
- **Pivot friction**, **air drag ∝ v²**, **viscous friction ∝ v**, adjustable g with planet presets.
- **Second pendulum**, independent or coupled by a spring (normal modes and energy transfer).
- **Driven support**, horizontal or vertical: resonance, chaos, Kapitza's inverted pendulum.
- **Phone on the ball**: accelerometer (with or without g) and gyroscope readings with phyphox-style axes, to compare with real data.

## Run it

Open the published page, or serve the folder locally (ES modules do not load from `file://`):

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Publish with GitHub Pages

Settings → Pages → Build and deployment → Deploy from a branch → `main`, folder `/ (root)`.

## Code structure

```
index.html          markup
css/style.css       styles and light/dark theme tokens
js/main.js          entry point: animation loop and start-up
js/state.js         parameters (P), display switches (LY), state (S), pendulums (PEN)
js/physics.js       forces, tension, driven support, RK4 integration, slack/snap
js/fluid.js         liquid models (surface and particles)
js/data.js          recorded quantities, period detection, phone sensor
js/view.js          canvas, colours, camera and coordinate transforms
js/render.js        drawing of the scene, arrows, polygon, energy bars
js/panels.js        readouts, graphs, period table, CSV
js/interaction.js   dragging, throwing, releasing, resetting
js/ui.js            buttons, tabs, sliders, toggles
js/util.js          shared helpers
```

## Physics notes

- Ropes and rods are massless; the ball is a point mass for the dynamics.
- Integration: fourth-order Runge–Kutta, step ≤ 0.5 ms. Energy is conserved to better than 10⁻⁴ J without friction.
- The liquid does not act back on the motion of the ball.

## License

MIT, see [LICENSE](LICENSE).
