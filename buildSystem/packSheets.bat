set packer="C:\Program Files (x86)\SpriteSheet Packer\SpriteSheetPacker.exe"

rd /s /q bin\assets
mkdir bin\assets
%packer% --powerOf2 --format pixijs rawArt/testAnim bin/assets

cd rawArt
%packer% --powerOf2 --format pixijs sprites ../bin/assets

cd ..
exit /b 0
