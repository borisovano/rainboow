"""Compatibility entry point; builds the updated, rounder Pip."""
from pathlib import Path
import runpy
module=runpy.run_path(str(Path(__file__).with_name('build_characters.py')))
module['build']('pip')
