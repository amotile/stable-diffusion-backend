# Required custom scripts
These scripts are required to be installed for this backend to function.
They also provide functionality that you can use if you're using the standard webui

## Install instructions
* Copy the scripts into the `/scripts` folder of your AUTOMATIC1111 setup
* Restart AUTOMATIC1111
* NOTE: the prompt blending will not show up in the script selection drop down. It's always on for any prompt.
    * This way you should be able to combine it with other scripts like `X/Y Plot`

## Advanced Seed Blending
This script allow you to base the initial noise on multiple weighted seeds.

Ex. seed1:2, seed2:1, seed3:1

The weights are normalized so you can use bigger once like above, or you can do floating point numbers:

Ex. seed1:0.5, seed2:0.25, seed3:0.25



## Prompt Blending
This script allows you to combine multiple weighted prompts together by mathematically combining their textual embeddings before generating the image.

Ex. 

`Crystal containing elemental {fire|ice}`


It supports nested definitions so you can do this as well:

`Crystal containing elemental {{fire:5|ice}|earth}`


