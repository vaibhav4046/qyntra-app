"""Contra-style soldier logo — side stance, rifle extended right."""
from PIL import Image

O = (255, 91, 31, 255)
B = (15, 15, 15, 255)
W = (245, 245, 245, 255)
T = (0, 0, 0, 0)

# 26 wide x 32 tall - soldier facing right, holding rifle
# H=helmet orange band, etc
# Use codes: B black outline, O orange, W white, . transparent
grid = [
    "..........BBBBBB..........",
    "..........BOOOOB..........",
    ".........BWOOOOOB.........",
    "........BWWWWWWWB.........",
    "........BWWWWWWWB.........",
    ".......BWWWBWWWWWB........",
    "......BOWWWWBWWWWB........",
    ".....BOOWWWWWWWWWB........",
    ".....BOOWWBWWWWWWB........",
    "....BOOWWWWBWWWWWBBBBBBBBB",
    "...BOOWWWWWWBWWWWBOOOOOOOB",
    "...BOWWWWWWWWBWWWBBBBBBBBB",
    "....BOWWWWWWWWBWBBOOOB....",
    ".....BWWWWWWWWWBBOOOB.....",
    "......BOOOWWWWWWBBBB......",
    "......BOOOWWWWWWB.........",
    "......BOWWWWWWWWB.........",
    ".......BWWWWWWWWB.........",
    "........BWWWWWWWB.........",
    "........BWWWBWWWB.........",
    "........BWWBBWWWB.........",
    "........BWWB.BWWWB........",
    ".......BWWWB..BWWWB.......",
    ".......BWWWB..BWWWB.......",
    "......BWWWWB..BWWWWB......",
    "......BWWWWB..BWWWWB......",
    ".....BWWWWWB..BWWWOOB.....",
    ".....BWWWWWB..BWWOOOB.....",
    ".....BOOOWWB..BOOOWWB.....",
    "....BBOOOOWB..BWOOOWWB....",
    "....BBBBBBBB..BBBBBBBB....",
    "..........................",
]

W_PX = 26
H_PX = len(grid)
SCALE = 24

img = Image.new("RGBA", (W_PX * SCALE, H_PX * SCALE), T)
pixels = img.load()
for y, row in enumerate(grid):
    for x, ch in enumerate(row):
        color = T
        if ch == "O": color = O
        elif ch == "B": color = B
        elif ch == "W": color = W
        if color[3]:
            for dx in range(SCALE):
                for dy in range(SCALE):
                    pixels[x * SCALE + dx, y * SCALE + dy] = color

img.save("public/logo.png", "PNG")
print(f"Wrote public/logo.png at {W_PX*SCALE}x{H_PX*SCALE}")
