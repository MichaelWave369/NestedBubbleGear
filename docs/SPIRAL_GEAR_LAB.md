# NBG Spiral Gear Lab

This is a React pitch-curve *kinematics demonstration* rather than an
experimental NBG result or mechanically validated gear pair.

Two identical elliptical pitch curves are mounted at their foci, with
constant center separation 2a. Local pitch radius is

    r(t) = a*(1-e²)/(1+e*cos(t))

The driven angle for input 0 <= theta <= 2*pi is

    beta = -2*atan2(q*sin(theta/2), cos(theta/2))
    q = (1-e)/(1+e)

Contact radii sum to 2a, with instantaneous angular speed ratio -r1/r2.
For each complete input revolution the output returns by -one revolution.
At e=0 a circular control has constant -1 speed ratio.

A separate golden logarithmic spiral uses radius r0*phi^(2*t/pi).
This ideal curve expands by phi per quarter turn, and is related to the
limiting ratios in the Fibonacci sequence. It is not a Fibonacci-square
arc construction or a valid meshing-tooth claim.

No actual tooth profiles, materials, loads, torque, friction or
manufacturability are modeled. Snapshot exports are marked SIMULATED
and DEMONSTRATION_ONLY, and no frozen AH-series outcomes are modified.

Tests: npm run test:spiral-gears; npm test; npm run build.
