import modules.scripts as scripts
import modules.processing as processing
import gradio as gr

from modules.processing import process_images, slerp
from modules import devices, shared
import torch


global_seeds = ''


def advanced_creator (shape, seeds, subseeds=None, subseed_strength=0.0, seed_resize_from_h=0, seed_resize_from_w=0, p=None):
    global global_seeds

    parsed = []

    for one in global_seeds.split(","):
        parts = one.split(":")
        parsed.append((int(parts[0]), float(parts[1]) if len(parts) > 1 else 1))

    noises = list(map(lambda e: (devices.randn(e[0], shape), e[1]), parsed))
    while True:
        cur = noises[0]
        rest = noises[1:]
        if len(rest) <= 0:
            break
        noises = list(
            map(lambda r: (slerp(r[1] / (r[1] + cur[1]), cur[0], r[0]), r[1] * cur[1]), rest))

    return torch.stack([noises[0][0]]).to(shared.device)


class Script(scripts.Script):
    def title(self):
        return "Advanced Seed Blending"

    def ui(self, is_img2img):
        seeds = gr.Textbox(label='Seeds', value="")

        return [seeds]

    def run(self, p, seeds):
        real_creator = processing.create_random_tensors
        try:
            processing.create_random_tensors = advanced_creator
            global global_seeds
            global_seeds = seeds
            return process_images(p)
        finally:
            processing.create_random_tensors = real_creator
