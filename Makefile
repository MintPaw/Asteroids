all:
	$(MAKE) b
	$(MAKE) r

b:
	cmd /c "call buildSystem/build.bat"

r:
	cmd /c "call buildSystem/run.bat"

