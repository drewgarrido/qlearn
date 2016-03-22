# Q Learning
## Overview
A Javascript animation q-learning where an agent tries to get to a goal
without any prior knowledge. The animation organizes the world as a grid, with
the current state being the x and y location of the agent on the grid. From
each state, the agent can move in each of the cardinal directions. For each
move to open space, the agent receives a small penalty, similar to getting
tired during a walk. This penalty motivates the agent to find the best path to
the goal.

Each space in the grid shows an arrow pointing to the best action found so far
in that state. Over time, the agent finds the best sequence of states to
maximize his reward.

The grid can be edited by the mouse by clicking, and different elements can
be introduced by clicking on the colored squares below the grid canvas.

## Running
Open index.html in a browser. Tested largely in Firefox and Chrome.
