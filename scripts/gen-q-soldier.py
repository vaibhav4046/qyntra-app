"""Generate Q-soldier pixel logo: helmet, Q-body, side stance, extending rifle, orange outline glow."""
from PIL import Image

O = (255, 91, 31, 255)
B = (15, 15, 15, 255)
W = (245, 245, 245, 255)
T = (0, 0, 0, 0)

# 28 wide x 32 tall. Codes: O=orange outline, B=black, W=white, .=transparent
grid = [
    "............................",
    "............OOOOOOO.........",
    "...........OBBBBBBBO........",
    "..........OBOOOOOOOBO.......",
    "..........OBOOOOOOOBO.......",
    "..........OBWWWWWWWBO.......",
    ".........OBWWWWWWWWBO.......",
    "........OBWWBBBWWWWBO.......",
    "........OBWBWWWBWWWBO.......",
    ".......OBWBWWBBBWWWWBOOOOOOO",
    ".......OBWBWBOOOBWWWBOOOOOOO",
    ".......OBWBWBOOOBWWWBBBBBBBO",
    ".......OBWBWWBBBWWWBOOOOOOOO",
    "........OBWWBWBWWWBOO.......",
    "........OBWWWBBWWBOO........",
    ".........OBWWWWWWBO.........",
    "..........OBBWWWBBO.........",
    "..........OBOWWWOBO.........",
    "..........OBOWWWOBO.........",
    "..........OBOWWWOBO.........",
    "..........OBOWWBOO..........",
    "..........OBWWWBO...........",
    ".........OBBBBBBO...........",
    ".........OBOOOOBOO..........",
    ".........OBWWWWBOO..........",
    ".........OBWWWWBO...........",
    ".........OBWWWWBO...........",
    ".........OBBWWBBO...........",
    "..........OBBBBOO...........",
    "...........OOOOO............",
    "............................",
    "............................",
]

W_PX = 28
H_PX = len(grid)
SCALE = 24

img = Image.new("RGBA", (W_PX * SCALE, H_PX * SCALE), T)
pixels = img.load()
for y, row in enumerate(grid):
    for x, ch in enumerate(row):
        color = None
        if ch == "O": color = O
        elif ch == "B": color = B
        elif ch == "W": color = W
        if not color: continue
        for dx in range(SCALE):
            for dy in range(SCALE):
                pixels[x * SCALE + dx, y * SCALE + dy] = color

img.save("public/logo.png", "PNG")
print(f"wrote public/logo.png at {W_PX*SCALE}x{H_PX*SCALE}")
