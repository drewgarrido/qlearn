"use strict";
/*
    Copyright 2016 Drew Garrido

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program; if not, write to the Free Software
    Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston,
    MA 02110-1301, USA.
*/

var QLearn = function(html_elements)
{
    this.displayCanvas      = html_elements.main_canvas;
    this.rewind_button      = html_elements.rewind_button;
    this.backstep_button    = html_elements.backstep_button;
    this.play_button        = html_elements.play_button;
    this.forward_button     = html_elements.forward_button;

    this.displayContext;
    this.width = this.displayCanvas.width;
    this.height = this.displayCanvas.height;

    this.start_location = [0,0];
    this.agent_location = this.start_location.slice();
    this.rewards = [[-1, -1, -1, -1, -100, 100],
                    [-1, -1, -1, -1, -100, -1],
                    [-1, -1, -1, -1, -100, -1],
                    [-1, -1, -1, -1, -100, -1],
                    [-1, -1, -1, -1, -1,   -1],
                    [-1, -1, -1, -1, -1,   -1]];

    this.q_values = [];

    this.exploration_rate = 0.1;    // eta
    this.learning_rate = 0.1;       // alpha
    this.discount_factor = 0.9;     // gamma

    this.experience = [];
    this.experience_idx = 0;

    // Images
    this.up_arrow_img = loadImage("up_arrow.png", null);
    this.down_arrow_img = loadImage("down_arrow.png", null);
    this.left_arrow_img = loadImage("left_arrow.png", null);
    this.right_arrow_img = loadImage("right_arrow.png", null);


    this.initialize = function()
    {
        var idx, idy, idz;

        this.displayContext = this.displayCanvas.getContext("2d");

        this.rewind_button.onclick      = this.handle_rewind_press.bind(this);
        this.backstep_button.onclick    = this.handle_backstep_press.bind(this);
        this.play_button.onclick        = this.handle_play_press.bind(this);
        this.forward_button.onclick     = this.handle_forward_press.bind(this);

        for (idx=0; idx < this.rewards[0].length; idx++)
        {
            this.q_values[idx]=[];
            for (idy = 0; idy < this.rewards.length; idy++)
            {
                this.q_values[idx][idy] = [];

                // 4 actions from each state/node
                for (idz = 0; idz < 4; idz++)
                {
                    this.q_values[idx][idy][idz] = 0;
                }
            }
        }
        console.log(this.q_values);
    };

    this.handle_rewind_press = function()
    {
        console.log("Rewind");
    };

    this.handle_backstep_press = function()
    {
        console.log("Backstep");
    };

    this.handle_play_press = function()
    {
        if (this.play_button.innerHTML == "Play")
        {
            this.play_button.innerHTML = "Pause";
        }
        else
        {
            this.play_button.innerHTML = "Play";
        }
    };

    this.handle_forward_press = function()
    {
        console.log("Forward");

        this.evaluate_new_action()

        this.render();
    };

    this.evaluate_new_action = function()
    {
        var max_q;
        // Pick an action vector
        var action_dir = 0;
        var old_state = this.agent_location.slice();
        var new_state = this.agent_location.slice();
        var max_q_prime, reward;
        var idz;

        // Randomly explore
        if (Math.random() < this.exploration_rate)
        {
            action_dir = (Math.random() * 4)|0;
        }
        else // Exploit
        {
            max_q = this.q_values[old_state[0]][old_state[1]][0];
            action_dir = 0;

            for (idz = 1; idz < 4; idz++)
            {
                if (this.q_values[old_state[0]][old_state[1]][idz] > max_q)
                {
                    max_q = this.q_values[old_state[0]][old_state[1]][idz];
                    action_dir = idz;
                }
            }
        }

        if (action_dir == 0) // Up
        {
            new_state[1] -= 1;
        }
        else if (action_dir == 1) // Down
        {
            new_state[1] += 1;
        }
        else if (action_dir == 2) // Left
        {
            new_state[0] -= 1;
        }
        else    // Right
        {
            new_state[0] += 1;
        }

        if ((new_state[0] < 0) ||
            (new_state[0] >= this.rewards[0].length) ||
            (new_state[1] < 0) ||
            (new_state[1] >= this.rewards.length))
        {
            new_state = this.agent_location;
            reward = -1;
        }
        else
        {
            reward = this.rewards[new_state[1]][new_state[0]];
        }

        max_q_prime = Math.max.apply(Math, this.q_values[new_state[0]][new_state[1]]);

        // Q(s,a) = Q(s,a)*(1-a) + a*(R + y*max(Q(s')))
        this.q_values[old_state[0]][old_state[1]][action_dir] =
            this.q_values[old_state[0]][old_state[1]][action_dir] * (1-this.learning_rate) +
            this.learning_rate * (reward + this.discount_factor * max_q_prime);

        if (reward == 100)
        {
            this.agent_location = this.start_location;
        }
        else
        {
            this.agent_location = new_state;
        }
    };

    this.pause_animation = function()
    {
        if (this.play_button.innerHTML == "Pause")
        {
            this.play_button.innerHTML = "Play";
        }
    };

    this.render = function()
    {
        var idx, idy, idz, max_q, max_idx, color_value;

        this.displayContext.clearRect(0,0,this.width, this.height);

        // q values
        for (idx = 0; idx < this.rewards[0].length; idx++)
        {
            for (idy = 0; idy < this.rewards.length; idy++)
            {
                max_q = this.q_values[idx][idy][0];
                max_idx = 0;

                for (idz = 1; idz < 4; idz++)
                {
                    if (this.q_values[idx][idy][idz] > max_q)
                    {
                        max_q = this.q_values[idx][idy][idz];
                        max_idx = idz;
                    }
                }

                color_value = (max_q + 128) | 0;

                this.displayContext.fillStyle = "rgb(255," + color_value + "," + color_value + ")";
                this.displayContext.fillRect(idx * 32,
                                             idy * 32,
                                             32, 32);

                if (max_idx == 0)
                {
                    this.displayContext.drawImage(this.up_arrow_img,
                                                    idx * 32,
                                                    idy * 32);
                }
                else if (max_idx == 1)
                {
                    this.displayContext.drawImage(this.down_arrow_img,
                                                    idx * 32,
                                                    idy * 32);
                }
                else if (max_idx == 2)
                {
                    this.displayContext.drawImage(this.left_arrow_img,
                                                    idx * 32,
                                                    idy * 32);
                }
                else if (max_idx == 3)
                {
                    this.displayContext.drawImage(this.right_arrow_img,
                                                    idx * 32,
                                                    idy * 32);
                }

            }
        }

        // Walls and Goal
        this.displayContext.fillStyle = "rgb(0,0,0)";

        for (idx = 0; idx < this.rewards[0].length; idx++)
        {
            for (idy = 0; idy < this.rewards.length; idy++)
            {
                if (this.rewards[idy][idx] == -100)
                {
                    this.displayContext.fillRect(idx * 32,
                                                 idy * 32,
                                                 32, 32);
                }
                else if (this.rewards[idy][idx] == 100)
                {
                    this.displayContext.fillStyle = "rgb(0,0,255)";
                    this.displayContext.fillRect(idx * 32,
                                                 idy * 32,
                                                 32, 32);
                    this.displayContext.fillStyle = "rgb(0,0,0)";
                }
            }
        }

        // Agent
        this.displayContext.fillStyle = "rgb(0,192,0)";
        this.displayContext.beginPath();
        this.displayContext.arc(this.agent_location[0] * 32 + 16,
                                this.agent_location[1] * 32 + 16,
                                16, 0, Math.PI*2, true);
        this.displayContext.closePath();
        this.displayContext.fill();
    };




    this.initialize();
};


function loadImage(src, cb)
{
    var img1 = false;

    if (document.images)
    {
        img1 = new Image();
        img1.onload = cb;
        img1.src = src;
    }
    return img1;
};
