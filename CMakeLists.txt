cmake_minimum_required (VERSION 3.5)
project (lesstriangle)

set(CMAKE_CXX_STANDARD 17)

set(GLFW_BUILD_DOCS OFF CACHE BOOL "" FORCE)
set(GLFW_BUILD_TESTS OFF CACHE BOOL "" FORCE)
set(GLFW_BUILD_EXAMPLES OFF CACHE BOOL "" FORCE)

add_executable(lesstriangle
    src/main.cpp
)

find_package(glfw3 REQUIRED)
find_package(GLEW REQUIRED)
find_package(OpenGL REQUIRED)

if (GLEW_FOUND)
    include_directories(glew/include)
endif()

if (APPLE)
    target_link_libraries(lesstriangle ${GLEW_LIBRARY})
    target_link_libraries(lesstriangle glfw)
    target_link_libraries(lesstriangle "-framework GLUT")
    target_link_libraries(lesstriangle "-framework OpenGL")
endif()

target_link_libraries(lesstriangle glfw ${GLEW_LIBRARIES})