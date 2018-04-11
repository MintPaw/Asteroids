set packer="C:\Program Files (x86)\SpriteSheet Packer\SpriteSheetPacker.exe"

rd /s /q bin\assets
mkdir bin\assets
%packer% --powerOf2 --format pixijs raw/testAnim bin/assets

cd raw
%packer% --powerOf2 --format pixijs sprites ../bin/assets
%packer% --powerOf2 --format pixijs minimap ../bin/assets
%packer% --powerOf2 --format pixijs ui ../bin/assets
%packer% --powerOf2 --format pixijs particles ../bin/assets
%packer% --powerOf2 --format pixijs tiles ../bin/assets

magick montage -mode concatenate -channel rgba -background transparent -tile 8x tiles/* tilesheet.png
copy tilesheet.png ..\bin\assets

xcopy /s /y /i maps ..\bin\assets\maps


cd ..
exit /b 0
