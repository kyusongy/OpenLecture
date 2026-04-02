# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['app/run.py'],
    pathex=[],
    binaries=[],
    datas=[],
    hiddenimports=[
        'uvicorn.logging',
        'uvicorn.loops',
        'uvicorn.loops.auto',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.lifespan',
        'uvicorn.lifespan.on',
        'app.main',
        'app.config',
        'app.models',
        'app.storage',
        'app.routers.courses',
        'app.routers.lectures',
        'app.routers.transcripts',
        'app.routers.notes',
        'app.routers.languages',
        'app.routers.translate',
        'app.routers.settings_router',
        'app.routers.transcription_ws',
        'app.services.transcription',
        'app.services.transcription.base',
        'app.services.transcription.qwen',
        'app.services.qwen_mt',
        'app.services.language_pairs',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    name='openlecture-server',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,
)
