# LessTriangle
Use only two triangles to render a dynamic or static scene.

# Compile
## macOS and Linux
```
mkdir build && cd build && cmake .. && make
```
## Windows
```
mkdir build && cd build
# Specify the path according to your settings.
g++ ..\src\main.cpp D:\\Mine\\Tool\\glad\\src\\glad.c -o ./lesstriangle.exe -ID:\\Mine\\Tool\\glad\\include -ID:\\Mine\\Tool\\glfw\\glfw-3.3.6.bin.WIN64\\include -ID:\\Mine\\Tool\\glew\\glew-2.1.0\\include -ID:\\Mine\\Tool\\glm\\install\\include -LD:\\Mine\\Tool\\glfw\\glfw-3.3.6.bin.WIN64\\lib-mingw-w64 -LD:\Mine\Tool\glew\glew-2.1.0\lib\Release\x64 -lglfw3dll -lglew32 -lOpengl32
```

## TODO 

- [ ] implement geometric primitives
- [ ] build up the scene
- [ ] polish the scene

