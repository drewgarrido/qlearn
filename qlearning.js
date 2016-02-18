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
    this.play_button        = html_elements.play_button;
    this.forward_button     = html_elements.forward_button;
    this.map_open_img       = html_elements.map_open_img;
    this.map_wall_img       = html_elements.map_wall_img;
    this.map_goal_img       = html_elements.map_goal_img;
    this.map_water_img      = html_elements.map_water_img;
    this.epsilon_text       = html_elements.epsilon_text;
    this.alpha_text         = html_elements.alpha_text;
    this.gamma_text         = html_elements.gamma_text;
    this.memory_text        = html_elements.memory_text;
    this.memory_discount_text = html_elements.memory_discount_text;
    this.action_prob_checkbox = html_elements.action_prob_checkbox;
    this.dreamwalk_text     = html_elements.dreamwalk_text;

    this.displayContext;
    this.width = this.displayCanvas.width;
    this.height = this.displayCanvas.height;

    this.start_location = [0,0];
    this.agent_location = this.start_location.slice();
    this.map    =   [
                    [1, 1, 1, 1, 2, 3, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
                    ];

    this.rewards = {0:0,    // Nothing (vacuum?)
                    1:-1,   // Open space
                    2:-10,  // Wall
                    3:100,  // Goal point
                    4:5,    // Cookie
                    5:-5,   // Water puddle
                    6:0     // last item
                    };

    this.map_tile_selection = 1;


    this.q_values = [];

    this.exploration_rate = 0.1;    // eta
    this.learning_rate = 0.5;       // alpha
    this.discount_factor = 0.9;     // gamma
    this.memory_size = 0;           // memory size
    this.memory_discount = 0.75

    this.memory = [];

    this.dreamwalk_memory = [];
    this.dreamwalk_memory_size = 0;

    this.animate_interval_hdl = 0;

    // Images
    this.up_arrow_img = loadImage("up_arrow.png", null);
    this.down_arrow_img = loadImage("down_arrow.png", null);
    this.left_arrow_img = loadImage("left_arrow.png", null);
    this.right_arrow_img = loadImage("right_arrow.png", null);
    this.arrow_imgs = [this.up_arrow_img,
                       this.down_arrow_img,
                       this.left_arrow_img,
                       this.right_arrow_img];


    this.initialize = function()
    {
        var idx, idy, idz;

        this.displayContext = this.displayCanvas.getContext("2d");

        this.play_button.onclick        = this.handle_play_press.bind(this);
        this.forward_button.onclick     = this.handle_forward_press.bind(this);
        this.map_open_img.onclick       = this.handle_map_open_img_click.bind(this);
        this.map_wall_img.onclick       = this.handle_map_wall_img_click.bind(this);
        this.map_goal_img.onclick       = this.handle_map_goal_img_click.bind(this);
        this.map_water_img.onclick      = this.handle_map_water_img_click.bind(this);
        this.epsilon_text.oninput       = this.handle_epsilon_text_change.bind(this);
        this.alpha_text.oninput         = this.handle_alpha_text_change.bind(this);
        this.gamma_text.oninput         = this.handle_gamma_text_change.bind(this);
        this.memory_text.oninput        = this.handle_memory_text_change.bind(this);
        this.memory_discount_text.oninput = this.handle_memory_discount_text_change.bind(this);
        this.dreamwalk_text.oninput     = this.handle_dreamwalk_text_change.bind(this);

        document.onkeypress             = this.handle_keys.bind(this);
        this.displayCanvas.onmousedown  = this.checkMouseDown.bind(this);

        this.handle_epsilon_text_change();
        this.handle_alpha_text_change();
        this.handle_gamma_text_change();
        this.handle_memory_text_change();
        this.handle_map_open_img_click();

        for (idx=0; idx < this.map[0].length; idx++)
        {
            this.q_values[idx]=[];
            for (idy = 0; idy < this.map.length; idy++)
            {
                this.q_values[idx][idy] = [];

                // 4 actions from each state/node
                for (idz = 0; idz < 4; idz++)
                {
                    this.q_values[idx][idy][idz] = 0;
                }
            }
        }
        this.render();
    };

    /**************************************************************************
     * EVENT HANDLERS
     *************************************************************************/

    this.handle_play_press = function()
    {
        if (this.play_button.innerHTML == "Play")
        {
            this.play_button.innerHTML = "Pause";
            this.animate_interval_hdl = setInterval(this.animate.bind(this), 50);
        }
        else
        {
            this.pause_animation();
        }
    };

    this.handle_forward_press = function()
    {
        this.pause_animation();

        this.execute_one_step();

        this.render();
    };

    this.handle_map_open_img_click = function()
    {
        this.map_tile_selection = 1;
        this.show_map_tile_selection(this.map_tile_selection);
    };

    this.handle_map_wall_img_click = function()
    {
        this.map_tile_selection = 2;
        this.show_map_tile_selection(this.map_tile_selection);
    };

    this.handle_map_goal_img_click = function()
    {
        this.map_tile_selection = 3;
        this.show_map_tile_selection(this.map_tile_selection);
    };

    this.handle_map_water_img_click = function()
    {
        this.map_tile_selection = 5;
        this.show_map_tile_selection(this.map_tile_selection);
    };

    this.handle_epsilon_text_change = function()
    {
        var patt = /^([0-9]+\.[0-9]+|[0-9]+)$/;

        if (patt.test(this.epsilon_text.value))
        {
            this.exploration_rate = parseFloat(this.epsilon_text.value);
        }
    };

    this.handle_alpha_text_change = function()
    {
        var patt = /^([0-9]+\.[0-9]+|[0-9]+)$/;

        if (patt.test(this.alpha_text.value))
        {
            this.learning_rate = parseFloat(this.alpha_text.value);
        }
    };

    this.handle_gamma_text_change = function()
    {
        var patt = /^([0-9]+\.[0-9]+|[0-9]+)$/;

        if (patt.test(this.gamma_text.value))
        {
            this.discount_factor = parseFloat(this.gamma_text.value);
        }
    };

    this.handle_memory_text_change = function()
    {
        var patt = /^([0-9]+)$/;

        if (patt.test(this.memory_text.value))
        {
            this.memory_size = parseInt(this.memory_text.value);
        }
    };

    this.handle_memory_discount_text_change = function()
    {
        var patt = /^([0-9]+\.[0-9]+|[0-9]+)$/;

        if (patt.test(this.memory_text.value))
        {
            this.memory_discount = parseFloat(this.memory_discount_text.value);
        }
    };

    this.handle_dreamwalk_text_change = function()
    {
        var patt = /^([0-9]+)$/;

        if (patt.test(this.dreamwalk_text.value))
        {
            this.dreamwalk_memory_size = parseInt(this.dreamwalk_text.value);
        }
    };

    this.handle_keys = function(e)
    {
        e = e || window.event;
        var keycode = e.which || e.keyCode;
        keycode = String.fromCharCode(keycode);

        var keycode_to_action = {'W':0,
                                 'w':0,
                                 'S':1,
                                 's':1,
                                 'A':2,
                                 'a':2,
                                 'D':3,
                                 'd':3};

        if (keycode_to_action[keycode] !== undefined)
        {
            this.apply_action(keycode_to_action[keycode]);
        }

        this.render();
    };

    this.checkMouseDown = function(e)
    {
        e = e || window.event;

        this.map[(e.offsetY / 32)|0][(e.offsetX / 32)|0] = this.map_tile_selection;
        this.render();
    };

    /**************************************************************************
     * HANDLER HELPERS
     *************************************************************************/
    this.show_map_tile_selection = function(selection)
    {
        var selection_dispatch = {
                                    1:this.map_open_img,
                                    2:this.map_wall_img,
                                    3:this.map_goal_img,
                                    5:this.map_water_img,
                                 };

        for(var prop in selection_dispatch)
        {
            if(selection_dispatch.hasOwnProperty(prop))
            {
                selection_dispatch[prop].style.borderColor = "#000";
            }
        }

        if (selection_dispatch[selection] !== undefined)
        {
            selection_dispatch[selection].style.borderColor = "#00F";
        }
    };

    /**************************************************************************
     * Automated Q_learning
     *************************************************************************/

    this.pause_animation = function()
    {
        if (this.play_button.innerHTML == "Pause")
        {
            this.play_button.innerHTML = "Play";
            clearInterval(this.animate_interval_hdl);
        }
    };

    this.animate = function()
    {
        this.execute_one_step();
        this.render();
    };

    this.execute_one_step = function()
    {
        this.apply_action(this.choose_action());
    };

    this.choose_action = function()
    {
        var max_q;
        // Pick an action vector
        var action_dir = 0;
        var old_state = this.agent_location.slice();
        var idz;

        // Randomly explore
        if (Math.random() < this.exploration_rate)
        {
            if (this.action_prob_checkbox.checked)
            {
                var mean = this.q_values[old_state[0]][old_state[1]].reduce(function(previousValue, currentValue){
                    return currentValue + previousValue;
                }) / 4;

                var exp_list = [];
                var exp_total = 0;
                var action_prob = Math.random()
                var prob_total = 0;

                for (idz = 0; idz < 4; idz++)
                {
                    exp_list[idz] = Math.exp((this.q_values[old_state[0]][old_state[1]][idz]-mean)/Math.abs(mean));
                    exp_total += exp_list[idz];
                }

                for (idz = 0; idz < 4; idz++)
                {
                    prob_total += (exp_list[idz] / exp_total);
                    if (action_prob < prob_total)
                    {
                        action_dir = idz;
                        break;
                    }
                }
            }
            else
            {
                action_dir = (Math.random() * 4)|0;
            }
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

        return action_dir;
    };

    this.apply_action = function(action_dir)
    {
        var max_q;
        // Pick an action vector
        var old_state = this.agent_location.slice();
        var new_state = this.agent_location.slice();
        var max_q_prime, reward;
        var idz;
        var new_q = 0, old_q;

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
            (new_state[0] >= this.map[0].length) ||
            (new_state[1] < 0) ||
            (new_state[1] >= this.map.length) ||
            (this.map[new_state[1]][new_state[0]] == 2)) // New state is a wall
        {
            new_state = this.agent_location.slice();
            reward = -10;
        }
        else
        {
            this.agent_location = new_state.slice();
            reward = this.rewards[this.map[new_state[1]][new_state[0]]];
        }

        if (this.dreamwalk_memory_size)
        {
            this.dreamwalk_memory.push({old_state:old_state,
                                        action:action_dir,
                                        reward:reward,
                                        new_state:new_state});

            this.dreamwalk_memory.slice(this.dreamwalk_memory_size);

            var random_idx = (this.dreamwalk_memory.length * Math.random())|0;
            var sample = this.dreamwalk_memory[random_idx];

            max_q_prime = Math.max.apply(Math, this.q_values[sample.new_state[0]][sample.new_state[1]]);

            // Q(s,a) = Q(s,a)*(1-a) + a*(R + y*max(Q(s')))
            this.q_values[sample.old_state[0]][sample.old_state[1]][sample.action] =
                this.q_values[sample.old_state[0]][sample.old_state[1]][sample.action] * (1-this.learning_rate) +
                this.learning_rate * (sample.reward + this.discount_factor * max_q_prime);

        }
        else
        {
            max_q_prime = Math.max.apply(Math, this.q_values[new_state[0]][new_state[1]]);

            // Q(s,a) = Q(s,a)*(1-a) + a*(R + y*max(Q(s')))
            this.q_values[old_state[0]][old_state[1]][action_dir] =
                this.q_values[old_state[0]][old_state[1]][action_dir] * (1-this.learning_rate) +
                this.learning_rate * (reward + this.discount_factor * max_q_prime);
        }

        if (this.map[new_state[1]][new_state[0]] == 3)  // New state is a goal
        {
            this.agent_location = this.start_location;

            if (this.memory_size)
            {
                new_q = reward * this.memory_discount;

                for (idz = this.memory.length-1; idz >= 0; idz--)
                {
                    new_q = (new_q) * this.discount_factor + this.memory[idz].reward;
                    old_q = this.q_values[this.memory[idz].state[0]][this.memory[idz].state[1]][this.memory[idz].action];

                    if (new_q > old_q)
                    {
                        this.q_values[this.memory[idz].state[0]][this.memory[idz].state[1]][this.memory[idz].action] = new_q;
                    }
                }

                this.memory = [];
            }
        }

        if (this.memory_size)
        {
            this.memory.push({state:old_state, action:action_dir, reward:reward});
            this.memory = this.memory.slice(-this.memory_size)
        }
    };

    this.render = function()
    {
        var idx, idy, idz, max_q, max_idx, color_value;

        this.displayContext.clearRect(0,0,this.width, this.height);

        // Walls and Goal
        for (idx = 0; idx < this.map[0].length; idx++)
        {
            for (idy = 0; idy < this.map.length; idy++)
            {
                if (this.map[idy][idx] == 1)    // Open space
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

                    color_value = (max_q + 150) | 0;

                    this.displayContext.fillStyle = "rgb(" + color_value + "," + color_value + "," + color_value + ")";
                    this.displayContext.fillRect(idx * 32,
                                                 idy * 32,
                                                 32, 32);

                    this.displayContext.drawImage(this.arrow_imgs[max_idx],
                                                    idx * 32,
                                                    idy * 32);
                }
                if (this.map[idy][idx] == 2)        // Wall
                {
                    this.displayContext.fillStyle = "rgb(0,0,0)";
                    this.displayContext.fillRect(idx * 32,
                                                 idy * 32,
                                                 32, 32);
                }
                else if (this.map[idy][idx] == 3)   // Goal point
                {
                    this.displayContext.fillStyle = "rgb(255,255,0)";
                    this.displayContext.fillRect(idx * 32,
                                                 idy * 32,
                                                 32, 32);

                }
                else if (this.map[idy][idx] == 5)   // Water puddle
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

                    this.displayContext.fillStyle = "rgb(0,0,255)";
                    this.displayContext.fillRect(idx * 32,
                                                 idy * 32,
                                                 32, 32);

                    this.displayContext.drawImage(this.arrow_imgs[max_idx],
                                                    idx * 32,
                                                    idy * 32);
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


/*
 * TODO: Add one-time cookie
 */
