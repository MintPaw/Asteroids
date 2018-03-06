set packer="C:\Program Files (x86)\SpriteSheet Packer\SpriteSheetPacker.exe"

rd /s /q bin\assets
mkdir bin\assets
%packer% --powerOf2 --format json rawArt/testAnim bin/assets
