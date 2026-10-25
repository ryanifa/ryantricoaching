"""Genereert de logo-SVG's en PNG-iconen in assets/logo/. Draaien: python3 tools/logos.py
Beeldmerk: golf (zwemmen), fietswiel met hoge velg (fietsen) en hardloopschoen (lopen). Woordmerk: "Ryan TC"."""
from pathlib import Path
import cairosvg

OUT = Path(__file__).resolve().parent.parent / 'assets' / 'logo'
OUT.mkdir(parents=True, exist_ok=True)
GREEN, DEEP, RED, MINT, WHITE = '#1E8F5A', '#0F5A3C', '#D7263D', '#DDF3E8', '#FFFFFF'

def shoe(color, x=0, y=0, s=1.0):
    """Hardloopschoen in zijaanzicht, 30×16, neus naar rechts."""
    return f'''<g transform="translate({x} {y}) scale({s})">
  <path d="M2 13.5c0-1.2.6-2.1 1.7-2.5l6.4-2.3c1-.4 1.7-1.3 2.3-2.5l1.9-3.6c.5-.9 1.6-1.2 2.4-.6 1.4 1 3.1 1.9 4.9 2.4 2.6.8 5.1 1.9 7 3.6 1.2 1 1.4 2.4.6 3.6-.5.8-1.4 1.3-2.3 1.3H4.2C3 13.9 2 13.9 2 13.5z" fill="{color}"/>
  <path d="M11.5 8.7l2.2 1.3M13.7 6l2.3 1.4M15.8 3.5l2.4 1.4" stroke="{WHITE}" stroke-width="1.3" stroke-linecap="round" opacity=".9"/>
  <path d="M2.5 15.2h26" stroke="{color}" stroke-width="1.6" stroke-linecap="round"/>
</g>'''

def wheel(color, x=0, y=0, s=1.0):
    """Fietswiel met hoge velg (zoals een tijdritwiel), 26×26: dikke velg, vijf spaken, naaf."""
    return f'''<g transform="translate({x} {y}) scale({s})" fill="none" stroke="{color}" stroke-linecap="round">
  <circle cx="13" cy="13" r="11" stroke-width="4.2"/>
  <path d="M13 13l0.00 -8.60M13 13l8.18 -2.66M13 13l5.05 6.96M13 13l-5.05 6.96M13 13l-8.18 -2.66" stroke-width="2.4"/>
  <circle cx="13" cy="13" r="2.4" fill="{color}" stroke="none"/>
</g>'''

def wave(color, x=0, y=0, s=1.0, w=36, op=1):
    return f'<path transform="translate({x} {y}) scale({s})" d="M0 4c{w/6:.1f}-5.5 {w/3:.1f}-5.5 {w/2:.1f} 0s{w/6:.1f} 5.5 {w/2:.1f} 0" fill="none" stroke="{color}" stroke-width="3.6" stroke-linecap="round" opacity="{op}"/>'

def mark(green=GREEN, deep=DEEP, red=RED, x=0, y=0, s=1.0):
    """Beeldmerk 64×64: wiel links, schoen rechts, golven onderin."""
    return f'''<g transform="translate({x} {y}) scale({s})">
  {wheel(deep, 4, 8, 1.05)}
  {shoe(red, 33, 17, 0.95)}
  {wave(green, 6, 44, 1, 52)}
  {wave(green, 10, 53, 1, 44, 0.5)}
</g>'''

def svg(w, h, body, bg=None, rx=None):
    rect = f'<rect width="{w}" height="{h}" rx="{rx if rx is not None else round(w*0.22)}" fill="{bg}"/>' if bg else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">{rect}{body}</svg>'

FONT = "font-family=\"Sora, 'Sora Fallback', Inter, system-ui, sans-serif\""

def wordmark(main, accent, sub, x=74):
    return f'''<text x="{x}" y="34" {FONT} font-weight="700" font-size="28" letter-spacing="-0.6" fill="{main}">Ryan <tspan fill="{accent}">TC</tspan></text>
<text x="{x+1}" y="53" {FONT} font-weight="600" font-size="12.5" letter-spacing="1.4" fill="{sub}">TRIATHLON COACHING</text>'''

files = {}
files['logo-mark.svg'] = svg(64, 64, mark())
files['logo.svg'] = svg(300, 64, mark() + wordmark(DEEP, RED, GREEN))
files['logo-wit.svg'] = svg(300, 64, mark(green='#9FE3C1', deep=WHITE, red='#FF7B8A') + wordmark(WHITE, '#FF9FAA', '#9FE3C1'))
files['icon.svg'] = svg(64, 64, mark(green='#9FE3C1', deep=WHITE, red='#FF7B8A', x=4, y=4, s=0.875), bg=DEEP)

# Alternatief 1: monogram "TC" op groene tegel, rode golf eronder
files['alt-1.svg'] = svg(64, 64, f'''<rect width="64" height="64" rx="14" fill="{DEEP}"/>
<text x="32" y="38" text-anchor="middle" {FONT} font-weight="700" font-size="30" letter-spacing="-1" fill="{WHITE}">TC</text>
{wave(RED, 14, 47, 1, 36)}''')
# Alternatief 2: ronde badge met de drie elementen in een cirkel, schoen rood
files['alt-2.svg'] = svg(64, 64, f'''<circle cx="32" cy="32" r="30" fill="{MINT}"/>
<circle cx="32" cy="32" r="30" fill="none" stroke="{GREEN}" stroke-width="3"/>
{wheel(DEEP, 10, 11, 0.85)}
{shoe(RED, 32, 17, 0.8)}
{wave(GREEN, 12, 43, 1, 40)}
{wave(GREEN, 16, 51, 1, 32, 0.5)}''')

for name, content in files.items():
    (OUT / name).write_text(content + '\n', encoding='utf-8')
for size in (180, 192, 512):
    cairosvg.svg2png(bytestring=files['icon.svg'].encode(), write_to=str(OUT / f'icon-{size}.png'), output_width=size, output_height=size)
cairosvg.svg2png(bytestring=files['icon.svg'].encode(), write_to=str(OUT / 'icon-32.png'), output_width=32, output_height=32)

preview = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 420" width="760" height="420"><rect width="760" height="420" fill="#F6FAF7"/>'
preview += '<g transform="translate(24 24)">' + files['logo.svg'].split('>',1)[1].rsplit('</svg>',1)[0] + '</g>'
preview += f'<rect x="24" y="110" width="320" height="90" rx="12" fill="{DEEP}"/><g transform="translate(34 123)">' + files['logo-wit.svg'].split('>',1)[1].rsplit('</svg>',1)[0] + '</g>'
for i, n in enumerate(['logo-mark.svg', 'icon.svg', 'alt-1.svg', 'alt-2.svg']):
    inner = files[n].split('>',1)[1].rsplit('</svg>',1)[0]
    preview += f'<g transform="translate({24+i*180} 240) scale(2)">{inner}</g>'
    preview += f'<g transform="translate({24+i*180} 380) scale(0.375)">{inner}</g>'
    preview += f'<text x="{60+i*180}" y="400" font-family="sans-serif" font-size="13" fill="#4F6475">{n}</text>'
preview += '</svg>'
cairosvg.svg2png(bytestring=preview.encode(), write_to='/tmp/claude-0/-home-claude/931b1708-7fb4-54e8-a0ad-143fc2ec9311/scratchpad/logos.png', output_width=1520, output_height=840)
print('ok', sorted(p.name for p in OUT.iterdir()))
