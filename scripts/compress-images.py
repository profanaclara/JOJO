"""Create pixel-identical WebP copies of tracked PNG artwork; keep the originals.

Requires Pillow with WebP support. A JSON report lists only smaller, verified copies.
"""
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path
import json
import subprocess
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]


def compress(relative):
    source = ROOT / relative
    target = source.with_suffix('.webp')
    if target.exists():
        return {'source': relative, 'skipped': 'existing WebP'}
    with Image.open(source) as original:
        rgba = original.convert('RGBA')
        rgba.save(target, 'WEBP', lossless=True, exact=True, method=6)
        with Image.open(target) as encoded:
            if rgba.size != encoded.size or rgba.tobytes() != encoded.convert('RGBA').tobytes():
                target.unlink()
                raise ValueError(f'Pixel mismatch: {relative}')
    before, after = source.stat().st_size, target.stat().st_size
    if after >= before:
        target.unlink()
        return {'source': relative, 'skipped': 'not smaller'}
    return {'source': relative, 'target': target.relative_to(ROOT).as_posix(),
            'before': before, 'after': after, 'pixels_identical': True}


if __name__ == '__main__':
    tracked = subprocess.check_output(['git', 'ls-files', '-z', 'assets'], cwd=ROOT).decode().split('\0')
    paths = [p for p in tracked if p.endswith('.png')
             and not Path(p).name.startswith(('icon-', 'favicon', 'apple-touch'))]
    results = []
    with ProcessPoolExecutor(max_workers=4) as pool:
        tasks = [pool.submit(compress, p) for p in paths]
        for task in as_completed(tasks):
            results.append(task.result())
            if len(results) % 10 == 0:
                print(f'{len(results)}/{len(paths)} checked', flush=True)
    output = ROOT / '_local/compressao/report.json'
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(sorted(results, key=lambda r: r['source']), indent=2), encoding='utf-8')
    converted = [r for r in results if 'target' in r]
    print(json.dumps({'converted': len(converted), 'before': sum(r['before'] for r in converted),
                      'after': sum(r['after'] for r in converted)}), flush=True)
