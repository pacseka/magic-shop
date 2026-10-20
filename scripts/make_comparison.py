from pathlib import Path

from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1]
source_path = Path(r'C:\Users\Hacsi\.codex\generated_images\01a152ef-19e6-7281-81ad-005034ca2a31\exec-3f2e9c16-30dc-4293-9793-3ee0138a370f.png')
source = Image.open(source_path).convert('RGB').resize((819, 1201)).crop((0, 0, 819, 1173))
implementation = Image.open(root / 'implementation-tablet.jpg').convert('RGB')
comparison = Image.new('RGB', (1638, 1210), 'white')
comparison.paste(source, (0, 37))
comparison.paste(implementation, (819, 37))
draw = ImageDraw.Draw(comparison)
draw.text((15, 10), 'Selected visual', fill='black')
draw.text((834, 10), 'Prototype', fill='black')
comparison.save(root / 'design-comparison.jpg', quality=90)
detail = Image.new('RGB', (1638, 517), 'white')
detail.paste(source.crop((0, 710, 819, 1173)), (0, 37))
detail.paste(implementation.crop((0, 710, 819, 1173)), (819, 37))
detail_draw = ImageDraw.Draw(detail)
detail_draw.text((15, 10), 'Selected visual — item detail', fill='black')
detail_draw.text((834, 10), 'Prototype — item detail', fill='black')
detail.save(root / 'design-comparison-detail.jpg', quality=92)
