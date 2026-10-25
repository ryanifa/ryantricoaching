"""Maakt assets/og.png (1200×630) uit een SVG met logo en tagline. Draaien: python3 tools/og.py"""
from pathlib import Path
import cairosvg
ROOT = Path(__file__).resolve().parent.parent
mark = (ROOT / 'assets/logo/logo-wit.svg').read_text().split('>', 1)[1].rsplit('</svg>', 1)[0]
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0F5A3C"/><stop offset="1" stop-color="#1E8F5A"/></linearGradient></defs>
<rect width="1200" height="630" fill="url(#g)"/>
<path d="M0 520c150-60 300-60 450 0s300 60 450 0 200-60 300 0v110H0z" fill="rgba(255,255,255,.1)"/>
<path d="M0 570c150-60 300-60 450 0s300 60 450 0 200-60 300 0v60H0z" fill="rgba(255,255,255,.14)"/>
<g transform="translate(80 70) scale(1.6)">{mark}</g>
<text x="80" y="300" font-family="Sora, Inter, system-ui, sans-serif" font-weight="700" font-size="64" letter-spacing="-1.5" fill="#fff">Je eerste triathlon?</text>
<text x="80" y="375" font-family="Sora, Inter, system-ui, sans-serif" font-weight="700" font-size="64" letter-spacing="-1.5" fill="#FFB07A">Ik help je er komen.</text>
<text x="80" y="440" font-family="Inter, system-ui, sans-serif" font-size="28" fill="rgba(255,255,255,.85)">Zwemanalyse · trainingsschema's · begeleiding naar je race · Rotterdam</text>
</svg>'''
cairosvg.svg2png(bytestring=svg.encode(), write_to=str(ROOT / 'assets/og.png'), output_width=1200, output_height=630)
print('og ok')
